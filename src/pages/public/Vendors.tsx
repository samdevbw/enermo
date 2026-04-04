// ============================================================
// Vendors listing page
// ============================================================
import { Link, useParams } from 'react-router-dom'
import { MapPin, Star, ShieldCheck, Globe, Phone, Mail, ArrowLeft } from 'lucide-react'
import { VendorCard } from '@/components/vendors/VendorCard'
import { ProductCard } from '@/components/products/ProductCard'
import { Spinner, EmptyState, Badge } from '@/components/ui'
import { SAMPLE_VENDORS, SAMPLE_PRODUCTS } from '@/data/sampleData'

export function Vendors() {
  // const { data: vendors, isLoading } = useVendors()
  const vendors = SAMPLE_VENDORS
  const isLoading = false

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">Solar Vendors</h1>
        <p className="text-gray-500 mt-1">Find trusted clean energy suppliers across Botswana</p>
      </div>

      {isLoading && <Spinner />}

      {!isLoading && vendors.length === 0 && (
        <EmptyState title="No vendors listed yet" description="Check back soon." />
      )}

      {!isLoading && vendors.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {vendors.map((v) => (
            <VendorCard
              key={v.id}
              vendor={v}
              productCount={SAMPLE_PRODUCTS.filter((p) => p.vendor_id === v.id).length}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Vendor profile page
// ============================================================
export function VendorProfile() {
  const { id } = useParams<{ id: string }>()

  // const { data: vendor, isLoading } = useVendor(id)
  const vendor = SAMPLE_VENDORS.find((v) => v.id === id)
  const products = SAMPLE_PRODUCTS.filter((p) => p.vendor_id === id)
  const isLoading = false

  if (isLoading) return <Spinner />
  if (!vendor) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          title="Vendor not found"
          action={<Link to="/vendors" className="text-primary-600 text-sm font-medium">← Back to Vendors</Link>}
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/vendors"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-6"
      >
        <ArrowLeft size={15} />
        All Vendors
      </Link>

      {/* Cover */}
      <div className="relative h-40 sm:h-56 rounded-2xl overflow-hidden bg-gradient-to-br from-forest-700 to-forest-950 mb-6">
        {vendor.cover_url && (
          <img src={vendor.cover_url} alt="" className="w-full h-full object-cover opacity-40" />
        )}
        {vendor.verified && (
          <div className="absolute top-4 right-4 bg-white/90 text-forest-700 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck size={12} />
            Verified Vendor
          </div>
        )}
      </div>

      {/* Profile header */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border-4 border-white shadow-md overflow-hidden shrink-0 -mt-12 sm:-mt-16 ml-4">
          {vendor.logo_url ? (
            <img src={vendor.logo_url} alt={vendor.business_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-2xl">
              {vendor.business_name.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-start gap-2 mb-1">
            <h1 className="font-display text-2xl font-bold text-gray-900">{vendor.business_name}</h1>
            {vendor.verified && <Badge variant="green">Verified</Badge>}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <MapPin size={13} />
              {vendor.location ?? vendor.city}, {vendor.country}
            </span>
            {vendor.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star size={13} className="fill-primary-400 text-primary-400" />
                {vendor.rating.toFixed(1)} ({vendor.review_count} reviews)
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
            {vendor.email && (
              <a href={`mailto:${vendor.email}`} className="flex items-center gap-1.5 hover:text-primary-600">
                <Mail size={13} /> {vendor.email}
              </a>
            )}
            {vendor.phone && (
              <a href={`tel:${vendor.phone}`} className="flex items-center gap-1.5 hover:text-primary-600">
                <Phone size={13} /> {vendor.phone}
              </a>
            )}
            {vendor.website && (
              <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary-600">
                <Globe size={13} /> Website
              </a>
            )}
          </div>
        </div>
      </div>

      {vendor.description && (
        <div className="bg-gray-50 rounded-xl p-5 mb-8">
          <p className="text-sm text-gray-600 leading-relaxed">{vendor.description}</p>
        </div>
      )}

      {/* Products */}
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900 mb-4">
          Products ({products.length})
        </h2>
        {products.length === 0 ? (
          <EmptyState title="No products listed yet" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
