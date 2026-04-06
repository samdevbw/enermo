import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Package, MessageSquare, ShoppingCart,
  Plus, Pencil, Trash2, Eye, CheckCircle2, Clock, ArrowRight,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import {
  useVendorByProfile,
  useVendorProducts,
  useVendorInquiries,
  useVendorOrders,
  useDeleteProduct,
  useUpdateOrderStatus,
  useCreateProduct,
  useUpdateProduct,
  useCategories,
} from '@/hooks/useProducts'
import { Button, Card, StatCard, Badge, EmptyState, Modal, Spinner } from '@/components/ui'
import { ProductForm } from '@/components/products/ProductForm'
import type { Product, ProductFormData } from '@/types'

// ============================================================
// Vendor Dashboard Home
// ============================================================
export function VendorDashboard() {
  const { profile } = useAuth()
  const { data: vendor } = useVendorByProfile(profile?.id)
  const { data: products = [] } = useVendorProducts(vendor?.id)
  const { data: inquiries = [] } = useVendorInquiries(vendor?.id)
  const { data: orders = [] } = useVendorOrders(vendor?.id)

  const openInquiries = inquiries.filter((i) => i.status === 'open').length
  const activeOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length
  const orderTotal = orders.reduce((sum, o) => sum + o.total_amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here's an overview of your vendor activity.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Products"
          value={products.length}
          icon={<Package size={20} />}
          color="yellow"
        />
        <StatCard
          label="Open Inquiries"
          value={openInquiries}
          icon={<MessageSquare size={20} />}
          color="blue"
        />
        <StatCard
          label="Active Orders"
          value={activeOrders}
          icon={<ShoppingCart size={20} />}
          color="green"
          trend={orderTotal > 0 ? `BWP ${new Intl.NumberFormat('en-BW', { minimumFractionDigits: 0 }).format(orderTotal)} total` : undefined}
        />
      </div>

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

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Products</h2>
          <Link to="/vendor/products" className="text-sm text-primary-600 hover:underline">View all</Link>
        </div>
        {products.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No products yet. <Link to="/vendor/products" className="text-primary-600 hover:underline">Add one</Link>.</p>
        ) : (
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
                      : 'Get Quote'}
                  </p>
                </div>
                <Badge variant={p.status === 'published' ? 'green' : p.status === 'draft' ? 'yellow' : 'gray'}>
                  {p.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
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

  const { data: vendor } = useVendorByProfile(profile?.id)
  const { data: products = [], isLoading } = useVendorProducts(vendor?.id)
  const { data: categories = [] } = useCategories()

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

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-0.5">{products.length} listing{products.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={!vendor}>
          <Plus size={16} />
          Add Product
        </Button>
      </div>

      {!vendor && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          You need to complete your vendor profile before adding products. Go to <Link to="/vendor/settings" className="font-medium underline">Settings</Link>.
        </div>
      )}

      {products.length === 0 ? (
        <EmptyState
          icon={<Package size={40} />}
          title="No products yet"
          description="Add your first product listing to start receiving inquiries."
          action={<Button onClick={() => setCreateOpen(true)} disabled={!vendor}><Plus size={16} />Add Product</Button>}
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add New Product" size="lg">
        <ProductForm
          categories={categories}
          onSubmit={handleCreate}
          loading={createProduct.isPending}
          submitLabel="Create Product"
        />
      </Modal>

      <Modal open={!!editProduct} onClose={() => setEditProduct(null)} title="Edit Product" size="lg">
  {editProduct && (
    <ProductForm
      categories={categories}
      defaultValues={{
        title: editProduct.title,
        description: editProduct.description || '', // Convert null to empty string
        price: editProduct.price || 0,
        category_id: editProduct.category_id || '',
        capacity: editProduct.capacity || '',
        brand: editProduct.brand || '',
        model: editProduct.model || '',
        warranty_months: editProduct.warranty_months || 0,
        features: Array.isArray(editProduct.features) 
          ? editProduct.features.join('\n') 
          : editProduct.features || '', // Convert array to string or handle null
        stock_qty: editProduct.stock_qty || 0,
        in_stock: editProduct.in_stock ?? true,
        status: editProduct.status || 'published',
      }}
      onSubmit={handleEdit}
      loading={updateProduct.isPending}
      submitLabel="Save Changes"
    />
  )}
</Modal>

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
  const { profile } = useAuth()
  const { data: vendor } = useVendorByProfile(profile?.id)
  const { data: inquiries = [], isLoading } = useVendorInquiries(vendor?.id)

  const statusBadge = (status: string) => {
    if (status === 'open') return <Badge variant="yellow"><Clock size={11} className="mr-1" />Open</Badge>
    if (status === 'replied') return <Badge variant="blue">Replied</Badge>
    return <Badge variant="gray">Closed</Badge>
  }

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Inquiries</h1>
        <p className="text-gray-500 text-sm mt-0.5">Customer questions about your products</p>
      </div>

      {inquiries.length === 0 ? (
        <EmptyState icon={<MessageSquare size={40} />} title="No inquiries yet" description="When customers send you questions they'll appear here." />
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
                  <p className="text-xs text-gray-400 mb-2">
                    {inq.customer_email}{inq.customer_phone ? ` · ${inq.customer_phone}` : ''}
                  </p>
                  {inq.product && (
                    <p className="text-xs text-primary-600 mb-2">Re: {inq.product.title}</p>
                  )}
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
  const { profile } = useAuth()
  const { data: vendor } = useVendorByProfile(profile?.id)
  const { data: orders = [], isLoading } = useVendorOrders(vendor?.id)
  const updateStatus = useUpdateOrderStatus()

  const statusVariant = (s: string): 'green' | 'yellow' | 'red' | 'blue' | 'gray' => {
    if (s === 'delivered') return 'green'
    if (s === 'cancelled') return 'red'
    if (s === 'pending') return 'yellow'
    return 'blue'
  }

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage and fulfil customer orders</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={<ShoppingCart size={40} />} title="No orders yet" description="Orders from customers will appear here." />
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
                      <Badge variant={statusVariant(o.status)}>{o.status}</Badge>
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
