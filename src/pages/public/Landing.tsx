import { Link } from 'react-router-dom'
import {
  Sun, Zap, BatteryCharging, Droplets, Home, Briefcase, Building2, Flame,
  ArrowRight, CheckCircle2, Star, ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useProducts, useVendors, useCategories } from '@/hooks/useProducts'
import { ProductCard } from '@/components/products/ProductCard'
import { VendorCard } from '@/components/vendors/VendorCard'

const ICON_MAP: Record<string, React.ReactNode> = {
  Sun: <Sun size={22} />,
  Home: <Home size={22} />,
  Zap: <Zap size={22} />,
  BatteryCharging: <BatteryCharging size={22} />,
  Droplets: <Droplets size={22} />,
  Briefcase: <Briefcase size={22} />,
  Building2: <Building2 size={22} />,
  Flame: <Flame size={22} />,
}

const STATS = [
  { value: '50+', label: 'Verified Vendors' },
  { value: '500+', label: 'Products Listed' },
  { value: '2,400+', label: 'Customers Served' },
  { value: '5 MW', label: 'Solar Deployed' },
]

const WHY_ITEMS = [
  { icon: <ShieldCheck size={20} />, title: 'Verified Vendors', desc: 'Every vendor is screened and verified before listing.' },
  { icon: <Star size={20} />, title: 'Rated & Reviewed', desc: 'Real customer ratings to help you choose with confidence.' },
  { icon: <Zap size={20} />, title: 'Fast Inquiries', desc: 'Connect directly with vendors and get quotes within hours.' },
  { icon: <CheckCircle2 size={20} />, title: 'Secure Orders', desc: 'Track your orders and installations end to end.' },
]

export function Landing() {
  const { data: categories = [] } = useCategories()
  const { data: products = [] } = useProducts()
  const { data: vendors = [] } = useVendors()

  return (
    <div className="font-body">
      {/* ---- Hero ---- */}
      <section className="relative bg-gradient-to-br from-gray-950 via-forest-950 to-gray-900 text-white overflow-hidden">
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1600&q=60")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 to-forest-950/60" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-primary-400/20 border border-primary-400/30 rounded-full px-4 py-1.5 text-sm text-primary-300 mb-6">
              <Sun size={14} />
              Botswana's #1 Clean Energy Marketplace
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
              Power Your Home.<br />
              <span className="text-primary-400">Build a Brighter</span> Future.
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-xl mb-8 leading-relaxed">
              Discover, compare, and buy solar panels, batteries, inverters, and more from trusted vendors across Botswana.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/marketplace">
                <Button size="lg" className="bg-primary-500 hover:bg-primary-600 shadow-lg shadow-primary-500/20">
                  Browse Marketplace
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/signup?role=vendor">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  List Your Products
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Stats ---- */}
      <section className="bg-primary-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-3xl md:text-4xl font-bold">{stat.value}</p>
                <p className="text-primary-100 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Categories ---- */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold text-gray-900 mb-2">Shop by Category</h2>
            <p className="text-gray-500">Find exactly what your energy needs require</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/marketplace?category=${cat.id}`}
                className="group flex flex-col items-center gap-3 bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                  {ICON_MAP[cat.icon ?? 'Sun'] ?? <Sun size={22} />}
                </div>
                <p className="text-sm font-medium text-gray-700 text-center leading-snug">{cat.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Featured Products ---- */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl font-bold text-gray-900">Featured Products</h2>
              <p className="text-gray-500 mt-1">Top-rated solar solutions from verified vendors</p>
            </div>
            <Link to="/marketplace" className="hidden sm:flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.slice(0, 3).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="text-center mt-8 sm:hidden">
            <Link to="/marketplace">
              <Button variant="outline">View All Products</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ---- Why Enermo ---- */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl font-bold text-gray-900 mb-4">
                Why Choose Enermo?
              </h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                We're not just a listing site. We're a platform built for Africa — designed around how energy buyers actually find, compare, and commission solar solutions in Botswana.
              </p>
              <div className="space-y-5">
                {WHY_ITEMS.map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-forest-100 text-forest-700 rounded-xl flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-0.5">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&q=80"
                alt="Solar installation in Africa"
                className="rounded-2xl shadow-xl w-full object-cover aspect-[4/3]"
              />
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-forest-100 rounded-lg flex items-center justify-center">
                  <Sun size={20} className="text-forest-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Solar Deployed</p>
                  <p className="font-bold text-gray-900 font-display">5 MW+</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Top Vendors ---- */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl font-bold text-gray-900">Top Vendors</h2>
              <p className="text-gray-500 mt-1">Trusted suppliers across Botswana</p>
            </div>
            <Link to="/vendors" className="hidden sm:flex items-center gap-1 text-sm text-primary-600 font-medium">
              All vendors <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {vendors.slice(0, 3).map((v) => (
              <VendorCard key={v.id} vendor={v} />
            ))}
          </div>
        </div>
      </section>

      {/* ---- Vendor CTA ---- */}
      <section className="py-16 bg-forest-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Sun size={40} className="text-primary-400 mx-auto mb-4" />
          <h2 className="font-display text-3xl font-bold mb-3">
            Are You a Solar Vendor?
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-8">
            Join Enermo and reach thousands of customers looking for clean energy solutions across Botswana.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup?role=vendor">
              <Button size="lg" className="bg-primary-500 hover:bg-primary-600">
                List Your Products
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
