import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Package, MessageSquare, ShoppingCart, TrendingUp,
  Plus, Pencil, Trash2, Eye, CheckCircle2, Clock, XCircle, ArrowRight,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import {
  useVendorByProfile,
  useVendorProducts,
  useVendorInquiries,
  useVendorOrders,
  useDeleteProduct,
  useUpdateOrderStatus,
} from '@/hooks/useProducts'
import {
  Button, Card, StatCard, Badge, Spinner, EmptyState, Modal,
} from '@/components/ui'
import { ProductForm } from '@/components/products/ProductForm'
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts'
import { SAMPLE_CATEGORIES, SAMPLE_PRODUCTS, SAMPLE_VENDORS } from '@/data/sampleData'
import type { Product, ProductFormData } from '@/types'

// ============================================================
// Vendor Dashboard Home
// ============================================================
export function VendorDashboard() {
  const { profile } = useAuth()

  // const { data: vendor } = useVendorByProfile(profile?.id)
  const vendor = SAMPLE_VENDORS[0] // demo
  const products = SAMPLE_PRODUCTS.filter((p) => p.vendor_id === vendor?.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here's an overview of your vendor activity.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Products"
          value={products.length}
          icon={<Package size={20} />}
          color="yellow"
          trend="2 added this month"
        />
        <StatCard
          label="Open Inquiries"
          value={12}
          icon={<MessageSquare size={20} />}
          color="blue"
          trend="3 new today"
        />
        <StatCard
          label="Active Orders"
          value={5}
          icon={<ShoppingCart size={20} />}
          color="green"
          trend="BWP 42,500 total"
        />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="hover:border-primary-200 transition-colors">
          <Link to="/vendor/products" className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-0.5">Manage Products</h3>
              <p className="text-sm text-gray-500">Add, edit, or remove your listings</p>
            </div>
            <ArrowRight size={18} className="text-gray-400" />
          </Link>
        </Card>
        <Card className="hover:border-primary-200 transition-colors">
          <Link to="/vendor/inquiries" className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-0.5">View Inquiries</h3>
              <p className="text-sm text-gray-500">Respond to customer questions</p>
            </div>
            <ArrowRight size={18} className="text-gray-400" />
          </Link>
        </Card>
      </div>

      {/* Recent products */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Products</h2>
          <Link to="/vendor/products" className="text-sm text-primary-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {products.slice(0, 3).map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                {p.product_images?.[0] && (
                  <img src={p.product_images[0].url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                <p className="text-xs text-gray-500">
                  {p.price
                    ? new Intl.NumberFormat('en-BW', { style: 'currency', currency: 'BWP', minimumFractionDigits: 0 }).format(p.price)
                    : 'Get Quote'
                  }
                </p>
              </div>
              <Badge variant={p.status === 'published' ? 'green' : p.status === 'draft' ? 'yellow' : 'gray'}>
                {p.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ============================================================
// Vendor Products Page
// ============================================================
export function VendorProducts() {
  const { profile } = useAuth()
  const [createOpen, setCreateOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const vendor = SAMPLE_VENDORS[0] // demo — replace with useVendorByProfile
  const products = SAMPLE_PRODUCTS.filter((p) => p.vendor_id === vendor?.id)
  const deleteProduct = useDeleteProduct()

  const createProduct = useCreateProduct(vendor?.id ?? '')
  const updateProduct = useUpdateProduct(editProduct?.id ?? '')

  async function handleCreate(data: ProductFormData) {
    await createProduct.mutateAsync(data)
    setCreateOpen(false)
  }

  async function handleEdit(data: ProductFormData) {
    await updateProduct.mutateAsync(data)
    setEditProduct(null)
  }

  async function handleDelete() {
    if (!deleteId) return
    await deleteProduct.mutateAsync(deleteId)
    setDeleteId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-0.5">{products.length} listing{products.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          Add Product
        </Button>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={<Package size={40} />}
          title="No products yet"
          description="Add your first product listing to start receiving inquiries."
          action={<Button onClick={() => setCreateOpen(true)}><Plus size={16} />Add Product</Button>}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">Product</th>
                  <th className="px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Price</th>
                  <th className="px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Stock</th>
                  <th className="px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          {p.product_images?.[0] && (
                            <img src={p.product_images[0].url} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{p.title}</p>
                          <p className="text-xs text-gray-400">{p.category?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-700">
                      {p.price
                        ? new Intl.NumberFormat('en-BW', { style: 'currency', currency: 'BWP', minimumFractionDigits: 0 }).format(p.price)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={p.in_stock ? 'text-forest-700' : 'text-red-600'}>
                        {p.in_stock ? `${p.stock_qty} units` : 'Out'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge variant={p.status === 'published' ? 'green' : p.status === 'draft' ? 'yellow' : 'gray'}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/product/${p.slug}`}>
                          <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="View">
                            <Eye size={15} />
                          </button>
                        </Link>
                        <button
                          className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                          title="Edit"
                          onClick={() => setEditProduct(p)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                          onClick={() => setDeleteId(p.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add New Product" size="lg">
        <ProductForm
          categories={SAMPLE_CATEGORIES}
          onSubmit={handleCreate}
          loading={createProduct.isPending}
          submitLabel="Create Product"
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editProduct} onClose={() => setEditProduct(null)} title="Edit Product" size="lg">
        {editProduct && (
          <ProductForm
            categories={SAMPLE_CATEGORIES}
            defaultValues={{
              ...editProduct,
              features: editProduct.features?.join('\n') ?? '',
            }}
            onSubmit={handleEdit}
            loading={updateProduct.isPending}
            submitLabel="Save Changes"
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Product">
        <p className="text-sm text-gray-600 mb-5">
          Are you sure you want to delete this product? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleteProduct.isPending} className="flex-1">Delete</Button>
        </div>
      </Modal>
    </div>
  )
}

// ============================================================
// Vendor Inquiries Page
// ============================================================
export function VendorInquiries() {
  // const { data: vendor } = useVendorByProfile(profile?.id)
  // const { data: inquiries, isLoading } = useVendorInquiries(vendor?.id)

  // Demo data
  const inquiries = [
    { id: '1', customer_name: 'Thabo Sithole', customer_email: 'thabo@example.com', customer_phone: '+267 7111 2222', message: 'I am interested in the 3kW home system. What is the installation timeline and do you offer financing?', status: 'open' as const, created_at: '2024-03-20T10:00:00Z', product: { title: 'SunTech Home 3kW Solar System', slug: 'suntech-home-3kw' } },
    { id: '2', customer_name: 'Mpho Kgomotso', customer_email: 'mpho@example.com', customer_phone: '', message: 'Can you deliver to Francistown? What is the delivery cost?', status: 'replied' as const, created_at: '2024-03-18T14:00:00Z', product: { title: 'LiFePO4 100Ah Lithium Battery', slug: 'lifepo4-100ah-lithium' } },
  ]

  const statusBadge = (status: string) => {
    if (status === 'open') return <Badge variant="yellow"><Clock size={11} className="mr-1" />Open</Badge>
    if (status === 'replied') return <Badge variant="blue">Replied</Badge>
    return <Badge variant="gray">Closed</Badge>
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Inquiries</h1>
        <p className="text-gray-500 text-sm mt-0.5">Customer questions about your products</p>
      </div>

      {inquiries.length === 0 ? (
        <EmptyState icon={<MessageSquare size={40} />} title="No inquiries yet" />
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => (
            <Card key={inq.id}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900">{inq.customer_name}</p>
                    {statusBadge(inq.status)}
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{inq.customer_email}{inq.customer_phone ? ` · ${inq.customer_phone}` : ''}</p>
                  <p className="text-xs text-primary-600 mb-2">Re: {inq.product?.title}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{inq.message}</p>
                </div>
                <div className="text-xs text-gray-400 shrink-0">
                  {new Date(inq.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <a href={`mailto:${inq.customer_email}`}>
                  <Button size="sm" variant="outline">Reply via Email</Button>
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Vendor Orders Page
// ============================================================
export function VendorOrders() {
  const updateStatus = useUpdateOrderStatus()

  // Demo data
  const orders = [
    { id: 'o1', order_number: 'ORD-20240320-ab1234', quantity: 1, unit_price: 28500, total_amount: 28500, currency: 'BWP', status: 'pending' as const, created_at: '2024-03-20T10:00:00Z', product: { title: 'SunTech Home 3kW Solar System', slug: 'suntech-home-3kw' }, customer: { full_name: 'Thabo Sithole', phone: '+267 7111 2222' } },
    { id: 'o2', order_number: 'ORD-20240318-cd5678', quantity: 2, unit_price: 4800, total_amount: 9600, currency: 'BWP', status: 'confirmed' as const, created_at: '2024-03-18T09:00:00Z', product: { title: 'LiFePO4 100Ah Lithium Battery', slug: 'lifepo4-100ah-lithium' }, customer: { full_name: 'Mpho Kgomotso', phone: '' } },
  ]

  const statusVariant = (s: string) => {
    if (s === 'delivered') return 'green'
    if (s === 'cancelled') return 'red'
    if (s === 'pending') return 'yellow'
    return 'blue'
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage and fulfil customer orders</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={<ShoppingCart size={40} />} title="No orders yet" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">Order</th>
                  <th className="px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Customer</th>
                  <th className="px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Total</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right hidden lg:table-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-gray-500">{o.order_number}</p>
                      <p className="text-gray-700 text-sm mt-0.5 line-clamp-1">{o.product?.title}</p>
                      <p className="text-xs text-gray-400">Qty: {o.quantity}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="font-medium text-gray-800">{o.customer?.full_name}</p>
                      {o.customer?.phone && <p className="text-xs text-gray-400">{o.customer.phone}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell font-semibold text-gray-900">
                      {new Intl.NumberFormat('en-BW', { style: 'currency', currency: o.currency, minimumFractionDigits: 0 }).format(o.total_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(o.status) as 'green' | 'yellow' | 'red' | 'blue' | 'gray'}>
                        {o.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-right">
                      {o.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updateStatus.mutate({ orderId: o.id, status: 'confirmed' })}
                          loading={updateStatus.isPending}
                        >
                          <CheckCircle2 size={14} />
                          Confirm
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
