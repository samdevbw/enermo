import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  MapPin, Star, ShieldCheck, CheckCircle2, Package,
  MessageSquare, ShoppingCart, ArrowLeft, Zap, Calendar,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { useSubmitInquiry } from '@/hooks/useProducts'
import { Button, Badge, Modal, Input, Spinner, EmptyState } from '@/components/ui'
import { SAMPLE_PRODUCTS } from '@/data/sampleData'
import type { InquiryFormData } from '@/types'

const inquirySchema = z.object({
  customer_name: z.string().min(2, 'Name required'),
  customer_email: z.string().email('Valid email required'),
  customer_phone: z.string().optional().default(''),
  message: z.string().min(10, 'Please provide more detail'),
})

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { user, profile } = useAuth()
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [inquiryDone, setInquiryDone] = useState(false)
  const submitInquiry = useSubmitInquiry()

  // Use sample data; swap with: const { data: product, isLoading } = useProduct(slug!)
  const product = SAMPLE_PRODUCTS.find((p) => p.slug === slug)
  const isLoading = false

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      customer_name: profile?.full_name ?? '',
      customer_email: user?.email ?? '',
    },
  })

  if (isLoading) return <Spinner />
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          title="Product not found"
          description="This product may have been removed or the URL is incorrect."
          action={<Link to="/marketplace"><Button variant="outline">Back to Marketplace</Button></Link>}
        />
      </div>
    )
  }

  const primaryImage = product.product_images?.find((i) => i.is_primary) ?? product.product_images?.[0]
  const imageUrl = primaryImage?.url ?? 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80'

  function formatPrice(price: number | null, currency: string) {
    if (!price) return 'Get Quote'
    return new Intl.NumberFormat('en-BW', { style: 'currency', currency, minimumFractionDigits: 0 }).format(price)
  }

  async function onInquirySubmit(data: InquiryFormData) {
    await submitInquiry.mutateAsync({
      productId: product!.id,
      vendorId: product!.vendor_id,
      customerId: user?.id ?? null,
      formData: data,
    })
    setInquiryDone(true)
    reset()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Link
        to="/marketplace"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-6 transition-colors"
      >
        <ArrowLeft size={15} />
        Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image */}
        <div className="space-y-3">
          <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-[4/3]">
            <img src={imageUrl} alt={product.title} className="w-full h-full object-cover" />
          </div>
          {product.product_images && product.product_images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.product_images.map((img) => (
                <div key={img.id} className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category && (
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-2">
              {product.category.name}
            </p>
          )}
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {product.title}
          </h1>

          {/* Brand & model */}
          {(product.brand || product.model) && (
            <p className="text-sm text-gray-500 mb-4">
              {[product.brand, product.model].filter(Boolean).join(' · ')}
            </p>
          )}

          {/* Price */}
          <div className="mb-5">
            <p className="font-display text-3xl font-bold text-gray-900">
              {formatPrice(product.price, product.currency)}
            </p>
            {product.price && (
              <p className="text-sm text-gray-400">per {product.unit} · {product.currency}</p>
            )}
          </div>

          {/* Quick specs */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {product.capacity && (
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                <Zap size={15} className="text-primary-500" />
                {product.capacity}
              </div>
            )}
            {product.warranty_months && product.warranty_months > 0 ? (
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                <Calendar size={15} className="text-primary-500" />
                {product.warranty_months >= 12
                  ? `${product.warranty_months / 12}yr warranty`
                  : `${product.warranty_months}mo warranty`}
              </div>
            ) : null}
            <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2">
              <Package size={15} className={product.in_stock ? 'text-forest-600' : 'text-red-500'} />
              <span className={product.in_stock ? 'text-forest-700' : 'text-red-600'}>
                {product.in_stock ? `${product.stock_qty} in stock` : 'Out of stock'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-6">
            <Button
              size="lg"
              className="flex-1"
              onClick={() => setInquiryOpen(true)}
            >
              <MessageSquare size={18} />
              Send Inquiry
            </Button>
            {product.in_stock && (
              <Button size="lg" variant="secondary" className="flex-1">
                <ShoppingCart size={18} />
                Order Now
              </Button>
            )}
          </div>

          {/* Vendor card */}
          {product.vendor && (
            <Link
              to={`/vendors/${product.vendor.id}`}
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary-200 transition-colors mb-6"
            >
              <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 overflow-hidden shrink-0">
                {product.vendor.logo_url ? (
                  <img src={product.vendor.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-primary-600">
                    {product.vendor.business_name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-sm text-gray-900 truncate">{product.vendor.business_name}</p>
                  {product.vendor.verified && <ShieldCheck size={13} className="text-forest-600 shrink-0" />}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin size={11} />
                  {product.vendor.city ?? product.vendor.country}
                  {product.vendor.rating > 0 && (
                    <>
                      <Star size={11} className="fill-primary-400 text-primary-400 ml-1" />
                      {product.vendor.rating.toFixed(1)}
                    </>
                  )}
                </div>
              </div>
            </Link>
          )}

          {/* Description */}
          {product.description && (
            <div className="mb-6">
              <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Features */}
          {product.features && product.features.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-3">What's Included</h2>
              <ul className="space-y-2">
                {product.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle2 size={15} className="text-forest-600 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Inquiry modal */}
      <Modal open={inquiryOpen} onClose={() => { setInquiryOpen(false); setInquiryDone(false) }} title="Send an Inquiry">
        {inquiryDone ? (
          <div className="text-center py-6">
            <CheckCircle2 size={48} className="text-forest-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Inquiry Sent!</h3>
            <p className="text-sm text-gray-500 mb-4">
              {product.vendor?.business_name} will get back to you shortly.
            </p>
            <Button onClick={() => { setInquiryOpen(false); setInquiryDone(false) }}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onInquirySubmit)} className="space-y-4">
            <p className="text-sm text-gray-500 -mt-2 mb-1">
              Inquiring about: <strong className="text-gray-700">{product.title}</strong>
            </p>
            <Input
              label="Your Name *"
              error={errors.customer_name?.message}
              {...register('customer_name')}
            />
            <Input
              label="Email *"
              type="email"
              error={errors.customer_email?.message}
              {...register('customer_email')}
            />
            <Input
              label="Phone (optional)"
              type="tel"
              placeholder="+267 7..."
              {...register('customer_phone')}
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Message *</label>
              <textarea
                rows={4}
                placeholder="I'm interested in this product. Can you provide more information about installation, delivery, and pricing?"
                className={`w-full px-3 py-2 border rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary-400 ${
                  errors.message ? 'border-red-400' : 'border-gray-300'
                }`}
                {...register('message')}
              />
              {errors.message && <p className="text-xs text-red-600">{errors.message.message}</p>}
            </div>
            <Button
              type="submit"
              fullWidth
              loading={submitInquiry.isPending}
            >
              Send Inquiry
            </Button>
          </form>
        )}
      </Modal>
    </div>
  )
}
