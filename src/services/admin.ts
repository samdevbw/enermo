// ============================================================
// ADMIN SERVICE — reads rely on admin RLS policies (migrations 004–006)
// ============================================================
import { supabase } from '@/lib/supabase'
import type { Order, Profile } from '@/types'

export type MessageStatus = 'new' | 'read' | 'replied' | 'archived'

export interface ContactMessage {
  id: string
  user_id: string | null
  name: string
  email: string
  subject: string
  message: string
  status: MessageStatus
  created_at: string
}

export interface AdminOverview {
  users: { total: number; vendors: number; customers: number; newThisWeek: number }
  vendors: { total: number; verified: number }
  products: { total: number; published: number }
  orders: { total: number; open: number; valueBwp: number }
  messages: { unread: number }
  recentOrders: Order[]
  recentSignups: Profile[]
  recentMessages: ContactMessage[]
}

/** `head: true` + `count: 'exact'` returns only the row count — no data transferred. */
async function count(
  table: string,
  filter?: (q: ReturnType<ReturnType<typeof supabase.from>['select']>) => typeof q,
): Promise<number> {
  let q = supabase.from(table).select('*', { count: 'exact', head: true })
  if (filter) q = filter(q)
  const { count: n, error } = await q
  if (error) throw error
  return n ?? 0
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    users, vendorsRole, customers, newThisWeek,
    vendorsTotal, vendorsVerified,
    productsTotal, productsPublished,
    unread,
    orderRows, recentOrders, recentSignups, recentMessages,
  ] = await Promise.all([
    count('profiles'),
    count('profiles', (q) => q.eq('role', 'vendor')),
    count('profiles', (q) => q.eq('role', 'customer')),
    count('profiles', (q) => q.gte('created_at', weekAgo)),
    count('vendors'),
    count('vendors', (q) => q.eq('verified', true)),
    count('products'),
    count('products', (q) => q.eq('status', 'published')),
    count('contact_messages', (q) => q.eq('status', 'new')),
    // Totals computed client-side: fine at current volume. Move to a SQL view
    // or RPC once orders reach the thousands.
    supabase.from('orders').select('status, total_amount'),
    supabase
      .from('orders')
      .select('*, product:products(title, slug), vendor:vendors(business_name), customer:profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(5),
  ])

  for (const r of [orderRows, recentOrders, recentSignups, recentMessages]) if (r.error) throw r.error

  const orders = (orderRows.data ?? []) as Pick<Order, 'status' | 'total_amount'>[]
  const live = orders.filter((o) => o.status !== 'cancelled')

  return {
    users: { total: users, vendors: vendorsRole, customers, newThisWeek },
    vendors: { total: vendorsTotal, verified: vendorsVerified },
    products: { total: productsTotal, published: productsPublished },
    orders: {
      total: orders.length,
      open: orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length,
      valueBwp: live.reduce((sum, o) => sum + Number(o.total_amount), 0),
    },
    messages: { unread },
    recentOrders: recentOrders.data as Order[],
    recentSignups: recentSignups.data as Profile[],
    recentMessages: recentMessages.data as ContactMessage[],
  }
}

export async function fetchContactMessages(status: MessageStatus | 'all'): Promise<ContactMessage[]> {
  let q = supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(200)
  if (status !== 'all') q = q.eq('status', status)
  const { data, error } = await q
  if (error) throw error
  return data as ContactMessage[]
}

export async function setMessageStatus(id: string, status: MessageStatus): Promise<void> {
  const { error } = await supabase.from('contact_messages').update({ status }).eq('id', id)
  if (error) throw error
}
