import { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import { useProducts, useCategories } from '@/hooks/useProducts'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductFilters } from '@/components/products/ProductFilters'
import { Spinner, EmptyState, Button } from '@/components/ui'
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

  const { data: products = [], isLoading, isError } = useProducts(filters)
  const { data: categories = [] } = useCategories()

  const handleFilterChange = useCallback((key: keyof FilterState, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleReset = useCallback(() => setFilters(DEFAULT_FILTERS), [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Solar Marketplace</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isLoading ? 'Loading...' : `${products.length} product${products.length !== 1 ? 's' : ''} found`}
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
        <aside className={`shrink-0 w-64 ${filtersOpen ? 'block fixed inset-0 z-30 md:static md:block' : 'hidden md:block'}`}>
          {filtersOpen && (
            <div className="md:hidden fixed inset-0 bg-black/40 z-20" onClick={() => setFiltersOpen(false)} />
          )}
          <div className={`${filtersOpen ? 'fixed bottom-0 left-0 right-0 z-30 rounded-t-2xl md:static md:rounded-none' : ''} md:sticky md:top-20`}>
            <ProductFilters
              filters={filters}
              categories={categories}
              onFilterChange={handleFilterChange}
              onReset={handleReset}
            />
            {filtersOpen && (
              <div className="md:hidden p-4 bg-white border-t border-gray-100">
                <Button fullWidth onClick={() => setFiltersOpen(false)}>
                  Show {products.length} results
                </Button>
              </div>
            )}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {isLoading && <Spinner />}
          {isError && (
            <EmptyState
              title="Failed to load products"
              description="Something went wrong. Please try again."
              action={<Button onClick={() => window.location.reload()}>Retry</Button>}
            />
          )}
          {!isLoading && !isError && products.length === 0 && (
            <EmptyState
              title="No products found"
              description="Try adjusting your filters or search term."
              action={<Button variant="outline" onClick={handleReset}>Clear Filters</Button>}
            />
          )}
          {!isLoading && !isError && products.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
