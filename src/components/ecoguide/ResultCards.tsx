import { Link } from 'react-router-dom'
import { ShieldCheck, MapPin, Store, Calculator, Info } from 'lucide-react'
import type { EcoEstimate, EcoProduct, EcoVendor } from '@/services/ecoguide'

const bwp = new Intl.NumberFormat('en-BW', { style: 'currency', currency: 'BWP', maximumFractionDigits: 0 })

export function ProductResults({ products }: { products: EcoProduct[] }) {
  if (!products.length) return null
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-2">From the ENERMO Marketplace</p>
      <ul className="grid sm:grid-cols-2 gap-2">
        {products.map((p) => (
          <li key={p.id}>
            <Link
              to={`/product/${p.slug}`}
              className="flex gap-3 p-2.5 rounded-xl border border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm transition"
            >
              <div className="w-16 h-16 shrink-0 rounded-lg bg-gray-100 overflow-hidden">
                {p.image_url && <img src={p.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 line-clamp-2">{p.title}</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{p.price ? bwp.format(Number(p.price)) : 'Price on request'}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                  {p.vendor_verified && <ShieldCheck size={12} className="text-forest-600 shrink-0" aria-label="Verified vendor" />}
                  {p.vendor_name}{!p.in_stock && ' · Out of stock'}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function VendorResults({ vendors }: { vendors: EcoVendor[] }) {
  if (!vendors.length) return null
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-2">ENERMO vendors</p>
      <ul className="grid sm:grid-cols-2 gap-2">
        {vendors.map((v) => (
          <li key={v.id}>
            <Link
              to={`/vendors/${v.id}`}
              className="flex gap-3 p-2.5 rounded-xl border border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm transition"
            >
              <div className="w-11 h-11 shrink-0 rounded-lg bg-primary-50 text-primary-600 overflow-hidden flex items-center justify-center">
                {v.logo_url ? <img src={v.logo_url} alt="" className="w-full h-full object-cover" /> : <Store size={18} />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1 truncate">
                  {v.business_name}
                  {v.verified && <ShieldCheck size={13} className="text-forest-600 shrink-0" aria-label="Verified vendor" />}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {v.city && <><MapPin size={11} className="inline -mt-0.5" /> {v.city} · </>}
                  {v.published_products} listing{v.published_products === 1 ? '' : 's'}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function EstimateCard({ estimate: e }: { estimate: EcoEstimate }) {
  const rows: [string, string][] = [
    ['Daily energy use', `${e.dailyKwh} kWh/day`],
    ['Solar array', `${e.arrayKwp} kWp (${e.panelCount} × ${e.panelWatts} W panels)`],
    ['Inverter', `${e.inverterKw} kW`],
  ]
  if (e.batteryRatedKwh > 0) {
    rows.push(['Battery', `${e.batteryRatedKwh} kWh rated (${e.batteryUsableKwh} kWh usable, ~${e.batteryAh} Ah @ 48 V)`])
  }

  return (
    <div className="rounded-xl border border-forest-200 bg-forest-50/60 p-4">
      <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 mb-3">
        <Calculator size={16} className="text-forest-700" /> Preliminary system estimate
        <span className="ml-auto text-xs font-normal text-gray-500 capitalize">{e.systemType} · {e.batteryChemistry}</span>
      </p>
      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-gray-500">{k}</dt>
            <dd className="font-medium text-gray-900">{v}</dd>
          </div>
        ))}
      </dl>
      <details className="mt-3 text-xs text-gray-600">
        <summary className="cursor-pointer font-medium text-gray-700">Assumptions used</summary>
        <ul className="list-disc pl-5 mt-1.5 space-y-0.5">
          {e.assumptions.map((a) => <li key={a}>{a}</li>)}
          {e.notes.map((n) => <li key={n}>{n}</li>)}
        </ul>
      </details>
      <p className="mt-3 text-xs text-gray-600 flex gap-1.5">
        <Info size={14} className="shrink-0 mt-0.5 text-gray-400" /> {e.disclaimer}
      </p>
    </div>
  )
}
