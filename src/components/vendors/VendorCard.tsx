import { Link } from 'react-router-dom'
import { MapPin, Star, ShieldCheck, Package } from 'lucide-react'
import type { Vendor } from '@/types'

interface VendorCardProps {
  vendor: Vendor
  productCount?: number
}

export function VendorCard({ vendor, productCount }: VendorCardProps) {
  return (
    <Link to={`/vendors/${vendor.id}`} className="group block">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden hover:-translate-y-0.5">
        {/* Cover */}
        <div className="h-28 bg-gradient-to-br from-forest-700 to-forest-950 relative overflow-hidden">
          {vendor.cover_url && (
            <img
              src={vendor.cover_url}
              alt=""
              className="w-full h-full object-cover opacity-40"
            />
          )}
          {vendor.verified && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-forest-700 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck size={11} />
              Verified
            </div>
          )}
        </div>

        {/* Logo */}
        <div className="px-4 pb-4">
          <div className="-mt-6 mb-3 flex items-end justify-between">
            <div className="w-14 h-14 rounded-xl bg-white border-2 border-white shadow-md overflow-hidden">
              {vendor.logo_url ? (
                <img src={vendor.logo_url} alt={vendor.business_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xl">
                  {vendor.business_name.charAt(0)}
                </div>
              )}
            </div>
            {vendor.rating > 0 && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Star size={14} className="fill-primary-400 text-primary-400" />
                <span className="font-medium">{vendor.rating.toFixed(1)}</span>
                <span className="text-gray-400 text-xs">({vendor.review_count})</span>
              </div>
            )}
          </div>

          <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors mb-1">
            {vendor.business_name}
          </h3>

          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
            <MapPin size={11} />
            {vendor.city ?? vendor.location ?? vendor.country}
          </div>

          {vendor.description && (
            <p className="text-xs text-gray-500 line-clamp-2 mb-3">{vendor.description}</p>
          )}

          {productCount !== undefined && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 border-t border-gray-50 pt-3">
              <Package size={13} />
              {productCount} product{productCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
