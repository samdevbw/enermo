// ============================================================
// EcoGuide chat orchestration. All I/O is injected (Deps) so this file is
// testable without Deno, Supabase or OpenAI.
// ============================================================
import { buildSystemPrompt, type KnowledgeSnippet, type UserRole } from './prompt.ts'
import { parseChatRequest, conversationTitle, keywords, ValidationError, type ChatTurn } from './validate.ts'
import { TOOL_DEFINITIONS, runTool, type ProductHit, type ToolBackend, type ToolDefinition, type VendorHit } from './tools.ts'
import type { SizingResult } from './sizing.ts'

// ---------- Ports ----------

export interface AuthedUser { id: string; role: UserRole; firstName: string | null }

export interface AiMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: { id: string; type: 'function'; function: { name: string; arguments: string } }[]
  tool_call_id?: string
}

export interface AiCompletion {
  message: AiMessage
  usage: { prompt_tokens: number; completion_tokens: number } | null
}

export interface AiPort {
  model: string
  /** An empty `tools` list means: answer now, no more tool calls. */
  complete(messages: AiMessage[], tools: readonly ToolDefinition[]): Promise<AiCompletion>
  embed(text: string): Promise<number[]>
}

export interface UsageRow {
  user_id: string | null; client_key: string; user_role: UserRole; question: string | null
  knowledge_hits: number; tools_used: string[]; model: string | null
  prompt_tokens: number | null; completion_tokens: number | null
  status: 'ok' | 'error' | 'rate_limited' | 'not_configured'
}

export interface DbPort extends ToolBackend {
  userFromJwt(jwt: string): Promise<AuthedUser | null>
  countUsageSince(clientKey: string, sinceIso: string): Promise<number>
  countAllUsageSince(sinceIso: string): Promise<number>
  logUsage(row: UsageRow): Promise<void>
  /** true when every published chunk has an embedding (vector search usable) */
  knowledgeFullyEmbedded(): Promise<boolean>
  matchKnowledge(query: string, embedding: number[] | null, count: number): Promise<KnowledgeSnippet[]>
  categories(): Promise<{ slug: string; name: string }[]>
  ownsConversation(conversationId: string, userId: string): Promise<boolean>
  createConversation(userId: string, title: string): Promise<string>
  loadHistory(conversationId: string, limit: number): Promise<ChatTurn[]>
  saveExchange(conversationId: string, user: string, assistant: string, metadata: Record<string, unknown>): Promise<void>
}

export interface Config {
  visitorHourlyLimit: number
  userHourlyLimit: number
  globalDailyLimit: number
  maxToolRounds: number
  today: string
}

export interface ChatInput {
  body: unknown
  authorization: string | null
  clientIpHash: string
}

export interface ChatResponseBody {
  conversationId: string | null
  reply: string
  products: ProductHit[]
  vendors: VendorHit[]
  estimate: SizingResult | null
  sources: { slug: string; title: string }[]
}

export type ChatResult =
  | { status: 200; body: ChatResponseBody }
  | { status: 400 | 401 | 403 | 404 | 429 | 500 | 503; body: { error: string; code: string } }

const fail = (status: 400 | 401 | 403 | 404 | 429 | 500 | 503, code: string, error: string): ChatResult => ({ status, body: { error, code } })

// ---------- Orchestration ----------

export async function handleChat(input: ChatInput, db: DbPort, ai: AiPort | null, cfg: Config): Promise<ChatResult> {
  // 1. Validate
  let req
  try {
    req = parseChatRequest(input.body)
  } catch (e) {
    if (e instanceof ValidationError) return fail(400, 'invalid_request', e.message)
    throw e
  }

  // 2. Identify (anonymous is allowed)
  let user: AuthedUser | null = null
  const jwt = input.authorization?.replace(/^Bearer\s+/i, '') ?? ''
  if (jwt && jwt.split('.').length === 3) {
    user = await db.userFromJwt(jwt)
  }
  const role: UserRole = user?.role ?? 'visitor'
  const clientKey = user ? `u:${user.id}` : `ip:${input.clientIpHash}`
  const baseLog = { user_id: user?.id ?? null, client_key: clientKey, user_role: role, question: req.message.slice(0, 500) }

  if (req.conversationId && !user) return fail(401, 'sign_in_required', 'Sign in to continue a saved conversation.')

  // 3. Configured?
  if (!ai) {
    await db.logUsage({ ...baseLog, knowledge_hits: 0, tools_used: [], model: null, prompt_tokens: null, completion_tokens: null, status: 'not_configured' })
    return fail(503, 'not_configured', 'EcoGuide is being set up and will be available soon. In the meantime, browse the Marketplace or the Learn section below.')
  }

  // 4. Rate limits (per person per hour, plus a global daily cost guard)
  const hourAgo = new Date(Date.now() - 3600_000).toISOString()
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString()
  const [mine, everyone] = await Promise.all([db.countUsageSince(clientKey, hourAgo), db.countAllUsageSince(dayAgo)])
  const limit = user ? cfg.userHourlyLimit : cfg.visitorHourlyLimit
  if (mine >= limit || everyone >= cfg.globalDailyLimit) {
    await db.logUsage({ ...baseLog, knowledge_hits: 0, tools_used: [], model: null, prompt_tokens: null, completion_tokens: null, status: 'rate_limited' })
    return fail(429, 'rate_limited', user
      ? 'You have reached the hourly question limit. Please try again a little later.'
      : 'You have reached the hourly limit for visitors. Sign in for a higher limit, or try again later.')
  }

  // 5. Conversation + history
  let conversationId: string | null = null
  let history: ChatTurn[] = req.history
  if (user) {
    if (req.conversationId) {
      if (!(await db.ownsConversation(req.conversationId, user.id))) return fail(404, 'not_found', 'Conversation not found.')
      conversationId = req.conversationId
      history = await db.loadHistory(conversationId, 12) // server copy wins over client-sent history
    } else {
      history = []
    }
  }

  try {
    // 6. Retrieve knowledge (vector when fully embedded, else full-text)
    const retrievalQuery = [...history.filter((t) => t.role === 'user').slice(-1).map((t) => t.content), req.message].join('\n')
    let embedding: number[] | null = null
    if (await db.knowledgeFullyEmbedded()) {
      try { embedding = await ai.embed(retrievalQuery) } catch (e) { console.warn('embedding failed, using full-text', e) }
    }
    const knowledge = await db.matchKnowledge(embedding ? retrievalQuery : keywords(retrievalQuery, 12).join(' '), embedding, 5)

    // 7. Ask the model, letting it call approved tools
    const messages: AiMessage[] = [
      { role: 'system', content: buildSystemPrompt({ role, firstName: user?.firstName, knowledge, categories: await db.categories(), today: cfg.today }) },
      ...history.map((t) => ({ role: t.role, content: t.content }) as AiMessage),
      { role: 'user', content: req.message },
    ]

    const products = new Map<string, ProductHit>()
    const vendors = new Map<string, VendorHit>()
    let estimate: SizingResult | null = null
    const toolsUsed: string[] = []
    let promptTokens = 0
    let completionTokens = 0
    let reply = ''

    for (let round = 0; round <= cfg.maxToolRounds; round++) {
      const lastRound = round === cfg.maxToolRounds
      const res = await ai.complete(messages, lastRound ? [] : TOOL_DEFINITIONS)
      promptTokens += res.usage?.prompt_tokens ?? 0
      completionTokens += res.usage?.completion_tokens ?? 0

      const calls = res.message.tool_calls ?? []
      if (calls.length === 0 || lastRound) {
        reply = (res.message.content ?? '').trim()
        break
      }

      messages.push({ role: 'assistant', content: res.message.content ?? null, tool_calls: calls })
      for (const call of calls.slice(0, 4)) {
        toolsUsed.push(call.function.name)
        const out = await runTool(call.function.name, call.function.arguments, db)
        out.products?.forEach((p) => products.set(p.id, p))
        out.vendors?.forEach((v) => vendors.set(v.id, v))
        if (out.estimate) estimate = out.estimate
        messages.push({ role: 'tool', tool_call_id: call.id, content: out.content })
      }
    }

    if (!reply) reply = "Sorry, I couldn't put together an answer for that. Could you rephrase or add a little more detail?"

    const sources = dedupe(knowledge.map((k) => ({ slug: k.slug, title: k.title })))
    const body: ChatResponseBody = {
      conversationId,
      reply,
      products: [...products.values()].slice(0, 6),
      vendors: [...vendors.values()].slice(0, 5),
      estimate,
      sources,
    }

    // 8. Persist (signed-in only)
    if (user) {
      if (!conversationId) {
        conversationId = await db.createConversation(user.id, conversationTitle(req.message))
        body.conversationId = conversationId
      }
      await db.saveExchange(conversationId, req.message, reply, {
        products: body.products, vendors: body.vendors, estimate, sources,
      })
    }

    await db.logUsage({
      ...baseLog, knowledge_hits: knowledge.length, tools_used: toolsUsed, model: ai.model,
      prompt_tokens: promptTokens, completion_tokens: completionTokens, status: 'ok',
    })
    return { status: 200, body }
  } catch (e) {
    console.error('ecoguide chat failed', e)
    await db.logUsage({ ...baseLog, knowledge_hits: 0, tools_used: [], model: ai.model, prompt_tokens: null, completion_tokens: null, status: 'error' }).catch(() => {})
    const upstream = e instanceof Error && /\b(429|5\d\d)\b/.test(e.message)
    return fail(upstream ? 503 : 500, 'ai_unavailable', upstream
      ? 'EcoGuide is busy right now. Please try again in a moment.'
      : 'Something went wrong while answering. Please try again.')
  }
}

function dedupe<T extends { slug: string }>(xs: T[]): T[] {
  const seen = new Set<string>()
  return xs.filter((x) => (seen.has(x.slug) ? false : (seen.add(x.slug), true)))
}
