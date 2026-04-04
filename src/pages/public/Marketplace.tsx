import { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductFilters } from '@/components/products/ProductFilters'
import { Spinner, EmptyState, Button } from '@/components/ui'
import { SAMPLE_CATEGORIES, SAMPLE_PRODUCTS } from '@/data/sampleData'
import type { FilterState } from '@/types'

const DEFAULT_FILTERS: FilterState = {
  category: '',
  search: '',
  minPrice: '',
  maxPrice: '',
  inStock: false,
  sortBy: 'newest',
}

export function Marketplace() {
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    category: searchParams.get('category') ?? '',
  })
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Use sample data in development; swap with useProducts(filters) for real Supabase data
  // const { data: products, isLoading, isError } = useProducts(filters)
  const products = SAMPLE_PRODUCTS
  const isLoading = false
  const isError = false

  const handleFilterChange = useCallback((key: keyof FilterState, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  // Client-side filter on sample data (remove when using real Supabase query)
  const filtered = products.filter((p) => {
    if (filters.category && p.category_id !== filters.category) return false
    if (filters.search && !p.title.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.inStock && !p.in_stock) return false
    if (filters.minPrice && p.price !== null && p.price < parseFloat(filters.minPrice)) return false
    if (filters.maxPrice && p.price !== null && p.price > parseFloat(filters.maxPrice)) return false
    return true
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Solar Marketplace</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <button
          className="md:hidden flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <SlidersHorizontal size={15} />
          Filters
        </button>
      </div>

      <div className="flex gap-6">
        {/* Filters sidebar */}
        <aside className={`shrink-0 w-64 ${filtersOpen ? 'block fixed inset-0 z-30 md:static md:block' : 'hidden md:block'}`}>
          {filtersOpen && (
            <div className="md:hidden fixed inset-0 bg-black/40 z-20" onClick={() => setFiltersOpen(false)} />
          )}
          <div className={`${filtersOpen ? 'fixed bottom-0 left-0 right-0 z-30 rounded-t-2xl md:static md:rounded-none' : ''} md:sticky md:top-20`}>
            <ProductFilters
              filters={filters}
              categories={SAMPLE_CATEGORIES}
              onFilterChange={handleFilterChange}
              onReset={handleReset}
            />
            {filtersOpen && (
              <div className="md:hidden p-4 bg-white border-t border-gray-100">
                <Button fullWidth onClick={() => setFiltersOpen(false)}>
                  Show {filtered.length} results
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {isLoading && <Spinner />}
          {isError && (
            <EmptyState
              title="Failed to load products"
              description="Something went wrong. Please try again."
              action={<Button onClick={() => window.location.reload()}>Retry</Button>}
            />
          )}
          {!isLoading && !isError && filtered.length === 0 && (
            <EmptyState
              title="No products found"
              description="Try adjusting your filters or search term."
              action={<Button variant="outline" onClick={handleReset}>Clear Filters</Button>}
            />
          )}
          {!isLoading && !isError && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
