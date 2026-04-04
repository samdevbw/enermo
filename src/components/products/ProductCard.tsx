import { Link } from 'react-router-dom'
import { MapPin, Star, ShieldCheck } from 'lucide-react'
import type { Product } from '@/types'
import { Badge } from '@/components/ui'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.product_images?.find((i) => i.is_primary) ?? product.product_images?.[0]
  const imageUrl = primaryImage?.url ?? `https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=80`

  function formatPrice(price: number | null, currency: string) {
    if (!price) return 'Get Quote'
    return new Intl.NumberFormat('en-BW', {
      style: 'currency',
      currency: currency || 'BWP',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden hover:-translate-y-0.5">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={imageUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {/* Overlay badges */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            {!product.in_stock && (
              <Badge variant="red">Out of Stock</Badge>
            )}
            {product.in_stock && product.stock_qty <= 5 && (
              <Badge variant="yellow">Low Stock</Badge>
            )}
          </div>
          {product.vendor?.verified && (
            <div className="absolute top-3 right-3">
              <span className="bg-white/90 backdrop-blur-sm text-forest-700 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <ShieldCheck size={11} />
                Verified
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category */}
          {product.category && (
            <p className="text-xs font-medium text-primary-600 mb-1 uppercase tracking-wide">
              {product.category.name}
            </p>
          )}

          {/* Title */}
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-primary-700 transition-colors">
            {product.title}
          </h3>

          {/* Capacity */}
          {product.capacity && (
            <p className="text-xs text-gray-500 mb-3">{product.capacity}</p>
          )}

          {/* Vendor */}
          <div className="flex items-center gap-1.5 mb-3">
            <MapPin size={12} className="text-gray-400 shrink-0" />
            <span className="text-xs text-gray-500 truncate">
              {product.vendor?.business_name} · {product.vendor?.city}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-50 pt-3 flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900 font-display">
                {formatPrice(product.price, product.currency)}
              </p>
              {product.price && (
                <p className="text-xs text-gray-400">per {product.unit}</p>
              )}
            </div>
            {product.vendor?.rating && product.vendor.rating > 0 ? (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Star size={12} className="fill-primary-400 text-primary-400" />
                <span>{product.vendor.rating.toFixed(1)}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  )
}
