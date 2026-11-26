// ============================================================
// ECOGUIDE SERVICE — talks to the ecoguide-chat Edge Function and reads
// the user's own conversations / public knowledge via RLS.
// ============================================================
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Mirrors supabase/functions/ecoguide-chat (tools.ts, sizing.ts, handler.ts)
export interface EcoProduct {
  id: string; title: string; slug: string; price: number | null; currency: string | null
  capacity: string | null; brand: string | null; model: string | null; in_stock: boolean
  category: string | null; vendor_id: string; vendor_name: string; vendor_verified: boolean
  vendor_city: string | null; image_url: string | null
}

export interface EcoVendor {
  id: string; business_name: string; description: string | null; city: string | null
  verified: boolean; rating: number | null; logo_url: string | null
  product_categories: string[]; published_products: number
}

export interface EcoEstimate {
  dailyKwh: number; peakLoadKw: number | null; arrayKwp: number; panelCount: number; panelWatts: number
  inverterKw: number; batteryUsableKwh: number; batteryRatedKwh: number; batteryAh: number
  systemType: string; batteryChemistry: string; assumptions: string[]; notes: string[]; disclaimer: string
}

export interface EcoSource { slug: string; title: string }

export interface EcoMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  products?: EcoProduct[]
  vendors?: EcoVendor[]
  estimate?: EcoEstimate | null
  sources?: EcoSource[]
}

export interface EcoReply {
  conversationId: string | null
  reply: string
  products: EcoProduct[]
  vendors: EcoVendor[]
  estimate: EcoEstimate | null
  sources: EcoSource[]
}

export class EcoGuideError extends Error {
  constructor(message: string, public code: string) {
    super(message)
  }
}

export async function sendEcoGuideMessage(params: {
  message: string
  conversationId: string | null
  history: { role: 'user' | 'assistant'; content: string }[]
}): Promise<EcoReply> {
  const { data, error } = await supabase.functions.invoke<EcoReply>('ecoguide-chat', { body: params })
  if (error) {
    // Non-2xx: the function returns { error, code } with a user-friendly message
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null) as { error?: string; code?: string } | null
      throw new EcoGuideError(body?.error ?? 'EcoGuide could not answer right now.', body?.code ?? 'unknown')
    }
    throw new EcoGuideError('Could not reach EcoGuide. Check your connection and try again.', 'network')
  }
  return data!
}

// ---------- Saved conversations (signed-in users; RLS limits to own) ----------

export interface EcoConversation { id: string; title: string; updated_at: string }

export async function fetchConversations(): Promise<EcoConversation[]> {
  const { data, error } = await supabase
    .from('eco_guide_conversations')
    .select('id, title, updated_at')
    .order('updated_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data as EcoConversation[]
}

export async function fetchConversationMessages(conversationId: string): Promise<EcoMessage[]> {
  const { data, error } = await supabase
    .from('eco_guide_messages')
    .select('id, role, content, metadata')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((m) => {
    const meta = (m.metadata ?? {}) as Partial<EcoReply>
    return {
      id: m.id, role: m.role, content: m.content,
      products: meta.products ?? [], vendors: meta.vendors ?? [], estimate: meta.estimate ?? null, sources: meta.sources ?? [],
    } as EcoMessage
  })
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const { error } = await supabase.from('eco_guide_conversations').delete().eq('id', conversationId)
  if (error) throw error
}

// ---------- Knowledge articles (public) ----------

export interface EcoArticle {
  id: string; slug: string; title: string; category: string; summary: string
  content?: string; audience: string; updated_at: string
}

export async function fetchArticles(): Promise<EcoArticle[]> {
  const { data, error } = await supabase
    .from('eco_guide_knowledge')
    .select('id, slug, title, category, summary, audience, updated_at')
    .eq('is_published', true)
    .order('title')
  if (error) throw error
  return data as EcoArticle[]
}

export async function fetchArticle(slug: string): Promise<EcoArticle | null> {
  const { data, error } = await supabase
    .from('eco_guide_knowledge')
    .select('id, slug, title, category, summary, content, audience, updated_at')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()
  if (error) throw error
  return data as EcoArticle | null
}

export const CATEGORY_LABELS: Record<string, string> = {
  solar: 'Solar energy',
  'solar-components': 'Solar components',
  'solar-installation': 'Installation',
  batteries: 'Batteries & storage',
  biogas: 'Biogas',
  'energy-efficiency': 'Energy efficiency',
  financing: 'Financing',
  eaas: 'Energy-as-a-Service',
  payg: 'Pay-as-you-go',
  rental: 'Rental',
  'enermo-marketplace': 'Using ENERMO',
  'enermo-vendors': 'For vendors',
  'enermo-services': 'ENERMO services',
  maintenance: 'Maintenance',
}
