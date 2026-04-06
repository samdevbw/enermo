import { Link } from 'react-router-dom'
import { ShoppingCart, Package, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCustomerOrders } from '@/hooks/useProducts'
import { Card, StatCard, Badge, EmptyState, Spinner, Button } from '@/components/ui'

export function CustomerDashboard() {
  const { user, profile } = useAuth()
  const { data: orders = [], isLoading } = useCustomerOrders(user?.id)

  const activeOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length

  const statusBadge = (s: string) => {
    const map: Record<string, 'green' | 'yellow' | 'red' | 'blue' | 'gray'> = {
      delivered: 'green', cancelled: 'red', pending: 'yellow', confirmed: 'blue',
    }
    return <Badge variant={map[s] ?? 'gray'}>{s}</Badge>
  }

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">My Account</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back, {profile?.full_name?.split(' ')[0] ?? 'there'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Total Orders" value={orders.length} icon={<ShoppingCart size={20} />} color="yellow" />
        <StatCard label="Active Orders" value={activeOrders} icon={<Package size={20} />} color="blue" />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Orders</h2>
          <Link to="/orders" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
            View all <ArrowRight size={13} />
          </Link>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="Browse the marketplace to find clean energy products."
            action={<Link to="/marketplace"><Button variant="outline" size="sm">Browse Products</Button></Link>}
          />
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium text-sm text-gray-900">{o.product?.title}</p>
                  <p className="text-xs text-gray-400">
                    {o.vendor?.business_name} · {o.order_number}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {statusBadge(o.status)}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Intl.NumberFormat('en-BW', { style: 'currency', currency: o.currency, minimumFractionDigits: 0 }).format(o.total_amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ============================================================
// Admin Dashboard (placeholder — structure ready to build on)
// ============================================================
export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 text-sm mt-1">Platform administration</p>
      </div>
      <Card>
        <div className="text-center py-8">
          <Package size={40} className="text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700 mb-1">Admin features coming soon</h3>
          <p className="text-sm text-gray-400">
            Vendor approval, product moderation, and platform analytics will be built here.
          </p>
        </div>
      </Card>
    </div>
  )
}
