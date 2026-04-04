import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Category, Product, ProductFormData } from '@/types'
import { Button, Input, Textarea, Select } from '@/components/ui'

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  price: z.coerce.number().positive('Price must be positive'),
  category_id: z.string().min(1, 'Please select a category'),
  capacity: z.string().optional().default(''),
  brand: z.string().optional().default(''),
  model: z.string().optional().default(''),
  warranty_months: z.coerce.number().min(0).default(0),
  features: z.string().optional().default(''),
  stock_qty: z.coerce.number().min(0).default(0),
  in_stock: z.boolean().default(true),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
})

interface ProductFormProps {
  categories: Category[]
  defaultValues?: Partial<ProductFormData>
  onSubmit: (data: ProductFormData) => Promise<void>
  loading?: boolean
  submitLabel?: string
}

export function ProductForm({
  categories,
  defaultValues,
  onSubmit,
  loading,
  submitLabel = 'Save Product',
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'published',
      in_stock: true,
      stock_qty: 1,
      warranty_months: 12,
      ...defaultValues,
    },
  })

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }))
  const statusOptions = [
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' },
    { value: 'archived', label: 'Archived' },
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        label="Product Title *"
        placeholder="e.g. SunTech 3kW Solar Home System"
        error={errors.title?.message}
        {...register('title')}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          rows={4}
          placeholder="Describe this product in detail — specifications, what's included, ideal use case..."
          className={`w-full px-3 py-2 border rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary-400 ${
            errors.description ? 'border-red-400' : 'border-gray-300'
          }`}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Price (BWP) *"
          type="number"
          step="0.01"
          placeholder="0.00"
          error={errors.price?.message}
          {...register('price')}
        />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Category *</label>
          <select
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 ${
              errors.category_id ? 'border-red-400' : 'border-gray-300'
            }`}
            {...register('category_id')}
          >
            <option value="">Select category...</option>
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.category_id && (
            <p className="text-xs text-red-600">{errors.category_id.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Brand"
          placeholder="e.g. Growatt"
          {...register('brand')}
        />
        <Input
          label="Model"
          placeholder="e.g. SPH5000TL"
          {...register('model')}
        />
        <Input
          label="Capacity"
          placeholder="e.g. 5kW / 100Ah"
          {...register('capacity')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Warranty (months)"
          type="number"
          min={0}
          {...register('warranty_months')}
        />
        <Input
          label="Stock Quantity"
          type="number"
          min={0}
          {...register('stock_qty')}
        />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            {...register('status')}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Features <span className="text-gray-400 font-normal">(one per line)</span>
        </label>
        <textarea
          rows={4}
          placeholder={`8 x 375W monocrystalline panels\n3kW hybrid inverter\n200Ah lithium battery\nInstallation included`}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary-400"
          {...register('features')}
        />
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          className="w-4 h-4 accent-primary-500"
          {...register('in_stock')}
        />
        <span className="text-sm text-gray-700">Mark as in stock</span>
      </label>

      <div className="pt-2">
        <Button type="submit" loading={loading} size="lg" fullWidth>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
