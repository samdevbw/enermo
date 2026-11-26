import { Link } from 'react-router-dom'
import {
  Users, Store, Package, ShoppingCart, ShieldAlert, Mail, ArrowRight, ShieldCheck,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAdminOverview } from '@/hooks/useAdmin'
import { useVendorsForReview } from '@/hooks/useVerification'
import { latestByType } from '@/services/verification'
import { Badge, Card, Spinner } from '@/components/ui'
import { formatDate } from '@/components/verification/DocumentBits'

const bwp = new Intl.NumberFormat('en-BW', { style: 'currency', currency: 'BWP', maximumFractionDigits: 0 })

const ORDER_BADGE: Record<string, 'green' | 'yellow' | 'red' | 'blue' | 'gray'> = {
  pending: 'yellow', confirmed: 'blue', processing: 'blue', shipped: 'blue', delivered: 'green', cancelled: 'red',
}

const ROLE_BADGE: Record<string, 'green' | 'yellow' | 'blue'> = { admin: 'blue', vendor: 'yellow', customer: 'green' }

export function AdminDashboard() {
  const { profile } = useAuth()
  const { data, isLoading, error } = useAdminOverview()
  const { data: reviewVendors = [] } = useVendorsForReview()

  const pendingReviews = reviewVendors.filter((v) =>
    Object.values(latestByType(v.documents)).some((d) => d?.status === 'pending'),
  ).length

  if (isLoading) return <Spinner />
  if (error || !data) {
    return (
      <Card>
        <p role="alert" className="text-sm text-red-600">
          Could not load the dashboard: {error instanceof Error ? error.message : 'unknown error'}.
          If this mentions permissions, make sure migrations 004–006 have been run.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">
          Admin overview{profile?.full_name ? ` — hi ${profile.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-gray-500 text-sm mt-1">Everything happening on Enermo at a glance.</p>
      </div>

      {/* Needs attention */}
      {(pendingReviews > 0 || data.messages.unread > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {pendingReviews > 0 && (
            <AttentionCard
              to="/admin/vendors"
              icon={<ShieldAlert size={20} />}
              title={`${pendingReviews} vendor${pendingReviews === 1 ? '' : 's'} waiting for document review`}
              cta="Review documents"
            />
          )}
          {data.messages.unread > 0 && (
            <AttentionCard
              to="/admin/messages"
              icon={<Mail size={20} />}
              title={`${data.messages.unread} new contact message${data.messages.unread === 1 ? '' : 's'}`}
              cta="Open inbox"
            />
          )}
        </div>
      )}

      {/* Key numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Users"
          value={data.users.total}
          sub={`${data.users.customers} customers · ${data.users.vendors} vendors`}
          extra={data.users.newThisWeek > 0 ? `+${data.users.newThisWeek} this week` : undefined}
          icon={<Users size={20} />}
        />
        <Stat
          label="Vendors"
          value={data.vendors.total}
          sub={`${data.vendors.verified} verified`}
          icon={<Store size={20} />}
          to="/admin/vendors"
        />
        <Stat
          label="Products"
          value={data.products.total}
          sub={`${data.products.published} published`}
          icon={<Package size={20} />}
        />
        <Stat
          label="Orders"
          value={data.orders.total}
          sub={`${data.orders.open} open · ${bwp.format(data.orders.valueBwp)}`}
          icon={<ShoppingCart size={20} />}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <Panel title="Recent orders">
          {data.recentOrders.length === 0 ? (
            <Empty>No orders yet.</Empty>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.recentOrders.map((o) => (
                <li key={o.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {o.product?.title ?? 'Product removed'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {o.order_number} · {o.customer?.full_name ?? 'Customer'} → {o.vendor?.business_name ?? 'Vendor'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{bwp.format(Number(o.total_amount))}</p>
                    <Badge variant={ORDER_BADGE[o.status] ?? 'gray'}>{o.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Recent sign-ups */}
        <Panel title="New sign-ups">
          {data.recentSignups.length === 0 ? (
            <Empty>No users yet.</Empty>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.recentSignups.map((p) => (
                <li key={p.id} className="py-3 flex items-center gap-3">
                  <div className="w-9 h-9 shrink-0 overflow-hidden rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm">
                    {p.avatar_url
                      ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      : (p.full_name?.charAt(0).toUpperCase() ?? '?')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.full_name || 'No name yet'}</p>
                    <p className="text-xs text-gray-500">Joined {formatDate(p.created_at)}</p>
                  </div>
                  <Badge variant={ROLE_BADGE[p.role] ?? 'gray'}>{p.role}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Latest messages */}
        <Panel title="Latest contact messages" link={{ to: '/admin/messages', label: 'All messages' }}>
          {data.recentMessages.length === 0 ? (
            <Empty>No messages yet.</Empty>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.recentMessages.map((m) => (
                <li key={m.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{m.subject}</p>
                    {m.status === 'new' && <Badge variant="yellow">new</Badge>}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {m.name} · {m.email} · {formatDate(m.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Verification summary */}
        <Panel title="Vendor verification" link={{ to: '/admin/vendors', label: 'Manage' }}>
          <div className="flex items-center gap-4 py-2">
            <ShieldCheck size={36} className="text-forest-600 shrink-0" />
            <div>
              <p className="text-2xl font-bold font-display text-gray-900">
                {data.vendors.verified} <span className="text-base font-normal text-gray-500">of {data.vendors.total} verified</span>
              </p>
              <p className="text-sm text-gray-500">
                {pendingReviews > 0 ? `${pendingReviews} waiting for review` : 'No documents waiting for review'}
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}

// ------------------------------------------------------------
function Stat({ label, value, sub, extra, icon, to }: {
  label: string; value: number; sub: string; extra?: string; icon: React.ReactNode; to?: string
}) {
  const body = (
    <Card className={to ? 'h-full transition-shadow hover:shadow-md' : 'h-full'}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900 font-display">{value.toLocaleString('en-BW')}</p>
          <p className="text-xs text-gray-500 mt-1">{sub}</p>
          {extra && <p className="text-xs text-forest-600 mt-0.5">{extra}</p>}
        </div>
        <div className="p-2.5 rounded-xl bg-primary-50 text-primary-600 shrink-0">{icon}</div>
      </div>
    </Card>
  )
  return to ? <Link to={to} className="block">{body}</Link> : body
}

function AttentionCard({ to, icon, title, cta }: { to: string; icon: React.ReactNode; title: string; cta: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-4 rounded-xl border border-primary-200 bg-primary-50 hover:bg-primary-100 transition-colors"
    >
      <div className="p-2 rounded-lg bg-white text-primary-600 shrink-0">{icon}</div>
      <p className="flex-1 text-sm font-medium text-gray-900">{title}</p>
      <span className="text-sm font-medium text-primary-700 inline-flex items-center gap-1 shrink-0">
        {cta} <ArrowRight size={14} />
      </span>
    </Link>
  )
}

function Panel({ title, link, children }: {
  title: string; link?: { to: string; label: string }; children: React.ReactNode
}) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        {link && (
          <Link to={link.to} className="text-sm text-primary-600 hover:underline inline-flex items-center gap-1">
            {link.label} <ArrowRight size={14} />
          </Link>
        )}
      </div>
      {children}
    </Card>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-400 py-6 text-center">{children}</p>
}
