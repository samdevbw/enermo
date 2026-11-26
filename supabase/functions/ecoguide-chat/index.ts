// ============================================================
// ecoguide-chat — Supabase Edge Function (Deno)
// Wires real Supabase + OpenAI into handler.ts.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   OPENAI_API_KEY            required to answer questions
//   OPENAI_MODEL              optional, default gpt-4o-mini
//   OPENAI_EMBEDDING_MODEL    optional, default text-embedding-3-small (1536 dims)
//   ECOGUIDE_ALLOWED_ORIGINS  optional, comma-separated
//   ECOGUIDE_VISITOR_HOURLY_LIMIT / _USER_HOURLY_LIMIT / _GLOBAL_DAILY_LIMIT  optional
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
//
// Deployed with verify_jwt = false: the site uses a publishable (non-JWT)
// key, and visitors may chat without signing in. The function verifies user
// tokens itself (db.userFromJwt) and rate-limits everyone.
// ============================================================
import { createClient } from 'npm:@supabase/supabase-js@2'
import { handleChat, type AiMessage, type AiPort, type DbPort, type Config } from './handler.ts'
import type { UserRole } from './prompt.ts'
import type { ProductHit, VendorHit } from './tools.ts'

const env = (k: string, d?: string) => Deno.env.get(k) ?? d

const supabase = createClient(env('SUPABASE_URL')!, env('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const ALLOWED_ORIGINS = (env('ECOGUIDE_ALLOWED_ORIGINS', 'https://enermo.co.bw,https://www.enermo.co.bw,http://localhost:5173')!)
  .split(',').map((s) => s.trim()).filter(Boolean)

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && (ALLOWED_ORIGINS.includes(origin) || /^https:\/\/[a-z0-9-]+--enermo\.netlify\.app$/.test(origin))
  return {
    'Access-Control-Allow-Origin': allowed ? origin! : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

// ---------- OpenAI ----------
function openAi(): AiPort | null {
  const key = env('OPENAI_API_KEY')
  if (!key) return null
  const model = env('OPENAI_MODEL', 'gpt-4o-mini')!
  const embeddingModel = env('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small')!

  async function call(path: string, payload: unknown) {
    const res = await fetch(`https://api.openai.com/v1/${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(45_000),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`OpenAI ${res.status}: ${text.slice(0, 300)}`)
    }
    return res.json()
  }

  return {
    model,
    async complete(messages: AiMessage[], tools) {
      const json = await call('chat/completions', {
        model,
        messages,
        ...(tools.length ? { tools, tool_choice: 'auto', parallel_tool_calls: true } : {}),
        temperature: 0.3,
        max_tokens: 900,
      })
      return { message: json.choices[0].message, usage: json.usage ?? null }
    },
    async embed(text: string) {
      const json = await call('embeddings', { model: embeddingModel, input: text.slice(0, 8000) })
      return json.data[0].embedding as number[]
    },
  }
}

// ---------- Database adapter ----------
let categoriesCache: { at: number; data: { slug: string; name: string }[] } | null = null
let embeddedCache: { at: number; value: boolean } | null = null

const db: DbPort = {
  async userFromJwt(jwt) {
    const { data, error } = await supabase.auth.getUser(jwt)
    if (error || !data.user) return null
    const { data: p } = await supabase.from('profiles').select('role, full_name').eq('id', data.user.id).maybeSingle()
    const role = (['customer', 'vendor', 'admin'].includes(p?.role) ? p!.role : 'customer') as UserRole
    return { id: data.user.id, role, firstName: p?.full_name?.split(' ')[0] ?? null }
  },
  async countUsageSince(clientKey, since) {
    const { count, error } = await supabase.from('eco_guide_usage').select('id', { count: 'exact', head: true })
      .eq('client_key', clientKey).gte('created_at', since).in('status', ['ok', 'error'])
    if (error) throw error
    return count ?? 0
  },
  async countAllUsageSince(since) {
    const { count, error } = await supabase.from('eco_guide_usage').select('id', { count: 'exact', head: true })
      .gte('created_at', since).eq('status', 'ok')
    if (error) throw error
    return count ?? 0
  },
  async logUsage(row) {
    const { error } = await supabase.from('eco_guide_usage').insert(row)
    if (error) console.error('usage log failed', error.message)
  },
  async knowledgeFullyEmbedded() {
    if (embeddedCache && Date.now() - embeddedCache.at < 300_000) return embeddedCache.value
    const { count } = await supabase.from('eco_guide_chunks').select('id', { count: 'exact', head: true }).is('embedding', null)
    embeddedCache = { at: Date.now(), value: (count ?? 1) === 0 }
    return embeddedCache.value
  },
  async matchKnowledge(query, embedding, count) {
    const { data, error } = await supabase.rpc('eco_guide_match_chunks', {
      p_query: query, p_embedding: embedding ? JSON.stringify(embedding) : null, p_match_count: count,
    })
    if (error) throw error
    return (data ?? []).map((r: { slug: string; title: string; content: string }) => ({ slug: r.slug, title: r.title, content: r.content }))
  },
  async categories() {
    if (categoriesCache && Date.now() - categoriesCache.at < 600_000) return categoriesCache.data
    const { data } = await supabase.from('categories').select('slug, name').order('name')
    categoriesCache = { at: Date.now(), data: data ?? [] }
    return categoriesCache.data
  },
  async ownsConversation(id, userId) {
    const { data } = await supabase.from('eco_guide_conversations').select('id').eq('id', id).eq('user_id', userId).maybeSingle()
    return !!data
  },
  async createConversation(userId, title) {
    const { data, error } = await supabase.from('eco_guide_conversations').insert({ user_id: userId, title }).select('id').single()
    if (error) throw error
    return data.id
  },
  async loadHistory(conversationId, limit) {
    const { data, error } = await supabase.from('eco_guide_messages').select('role, content')
      .eq('conversation_id', conversationId).order('created_at', { ascending: false }).limit(limit)
    if (error) throw error
    return (data ?? []).reverse()
  },
  async saveExchange(conversationId, user, assistant, metadata) {
    const now = Date.now()
    const { error } = await supabase.from('eco_guide_messages').insert([
      { conversation_id: conversationId, role: 'user', content: user, created_at: new Date(now).toISOString() },
      { conversation_id: conversationId, role: 'assistant', content: assistant, metadata, created_at: new Date(now + 1).toISOString() },
    ])
    if (error) throw error
    await supabase.from('eco_guide_conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId)
  },
  async searchProducts(a) {
    const { data, error } = await supabase.rpc('eco_guide_search_products', {
      p_terms: a.terms, p_category_slug: a.category, p_min_price: a.minPrice, p_max_price: a.maxPrice, p_limit: a.limit,
    })
    if (error) throw error
    return (data ?? []) as ProductHit[]
  },
  async searchVendors(a) {
    const { data, error } = await supabase.rpc('eco_guide_search_vendors', {
      p_terms: a.terms, p_city: a.city, p_capability: a.capability, p_limit: a.limit,
    })
    if (error) throw error
    return (data ?? []) as VendorHit[]
  },
}

// ---------- Background: embed new/edited knowledge chunks ----------
async function embedBacklog(ai: AiPort, max = 20) {
  const { data } = await supabase.from('eco_guide_chunks').select('id, content').is('embedding', null).limit(max)
  for (const c of data ?? []) {
    try {
      const e = await ai.embed(c.content)
      await supabase.from('eco_guide_chunks').update({ embedding: JSON.stringify(e) }).eq('id', c.id)
    } catch (err) {
      console.warn('embedding chunk failed', c.id, err)
      return
    }
  }
  if ((data ?? []).length) embeddedCache = null
}

async function hashIp(ip: string): Promise<string> {
  const salt = env('ECOGUIDE_IP_SALT', env('SUPABASE_URL'))!
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${ip}`))
  return [...new Uint8Array(digest)].slice(0, 16).map((b) => b.toString(16).padStart(2, '0')).join('')
}

const intEnv = (k: string, d: number) => {
  const n = Number(env(k))
  return Number.isFinite(n) && n > 0 ? n : d
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get('origin'))
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers: cors })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON', code: 'invalid_request' }, { status: 400, headers: cors })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip') || 'unknown'
  const ai = openAi()
  const cfg: Config = {
    visitorHourlyLimit: intEnv('ECOGUIDE_VISITOR_HOURLY_LIMIT', 15),
    userHourlyLimit: intEnv('ECOGUIDE_USER_HOURLY_LIMIT', 40),
    globalDailyLimit: intEnv('ECOGUIDE_GLOBAL_DAILY_LIMIT', 1500),
    maxToolRounds: 3,
    today: new Date().toISOString().slice(0, 10),
  }

  try {
    const result = await handleChat(
      { body, authorization: req.headers.get('authorization'), clientIpHash: await hashIp(ip) },
      db, ai, cfg,
    )
    // Keep the knowledge base embedded without an admin step
    if (ai && result.status === 200) {
      // @ts-ignore EdgeRuntime is provided by Supabase
      globalThis.EdgeRuntime?.waitUntil?.(embedBacklog(ai))
    }
    return Response.json(result.body, { status: result.status, headers: cors })
  } catch (e) {
    console.error('unhandled', e)
    return Response.json({ error: 'Something went wrong. Please try again.', code: 'internal' }, { status: 500, headers: cors })
  }
})
