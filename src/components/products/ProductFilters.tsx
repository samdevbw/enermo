import { Search, SlidersHorizontal, X } from 'lucide-react'
import type { Category, FilterState } from '@/types'
import { Input, Select } from '@/components/ui'

interface ProductFiltersProps {
  filters: FilterState
  categories: Category[]
  onFilterChange: (key: keyof FilterState, value: string | boolean) => void
  onReset: () => void
}

export function ProductFilters({ filters, categories, onFilterChange, onReset }: ProductFiltersProps) {
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ]

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
  ]

  const hasActiveFilters =
    filters.search || filters.category || filters.minPrice || filters.maxPrice || filters.inStock

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <SlidersHorizontal size={16} />
        Filters
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="ml-auto text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <X size={12} />
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
        />
      </div>

      {/* Category */}
      <Select
        label="Category"
        value={filters.category}
        onChange={(e) => onFilterChange('category', e.target.value)}
        options={categoryOptions}
      />

      {/* Price range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Price Range (BWP)</label>
        <div className="flex gap-2">
          <Input
            placeholder="Min"
            type="number"
            value={filters.minPrice}
            onChange={(e) => onFilterChange('minPrice', e.target.value)}
          />
          <Input
            placeholder="Max"
            type="number"
            value={filters.maxPrice}
            onChange={(e) => onFilterChange('maxPrice', e.target.value)}
          />
        </div>
      </div>

      {/* In stock */}
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.inStock}
          onChange={(e) => onFilterChange('inStock', e.target.checked)}
          className="w-4 h-4 accent-primary-500 rounded"
        />
        <span className="text-sm text-gray-700">In stock only</span>
      </label>

      {/* Sort */}
      <Select
        label="Sort By"
        value={filters.sortBy}
        onChange={(e) => onFilterChange('sortBy', e.target.value)}
        options={sortOptions}
      />
    </div>
  )
}
