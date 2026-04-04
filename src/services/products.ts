// ============================================================
// PRODUCTS SERVICE
// ============================================================
import { supabase } from '@/lib/supabase'
import type { Product, ProductFormData, FilterState } from '@/types'

export async function fetchProducts(filters?: Partial<FilterState>): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select(`
      *,
      vendor:vendors(*),
      category:categories(*),
      product_images(*)
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (filters?.category) {
    query = query.eq('category_id', filters.category)
  }

  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`)
  }

  if (filters?.minPrice) {
    query = query.gte('price', parseFloat(filters.minPrice))
  }

  if (filters?.maxPrice) {
    query = query.lte('price', parseFloat(filters.maxPrice))
  }

  if (filters?.inStock) {
    query = query.eq('in_stock', true)
  }

  if (filters?.sortBy === 'price_asc') {
    query = query.order('price', { ascending: true })
  } else if (filters?.sortBy === 'price_desc') {
    query = query.order('price', { ascending: false })
  } else if (filters?.sortBy === 'popular') {
    query = query.order('view_count', { ascending: false })
  }

  const { data, error } = await query
  if (error) throw error
  return data as Product[]
}

export async function fetchProductBySlug(slug: string): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      vendor:vendors(*),
      category:categories(*),
      product_images(*)
    `)
    .eq('slug', slug)
    .single()

  if (error) throw error

  // Increment view count (fire and forget)
  supabase
    .from('products')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('id', data.id)
    .then(() => {})

  return data as Product
}

export async function fetchVendorProducts(vendorId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`*, category:categories(*), product_images(*)`)
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Product[]
}

export async function createProduct(
  vendorId: string,
  formData: ProductFormData
): Promise<Product> {
  const slug = formData.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .concat('-', Date.now().toString(36))

  const features = formData.features
    ? formData.features.split('\n').map((f) => f.trim()).filter(Boolean)
    : []

  const { data, error } = await supabase
    .from('products')
    .insert({
      vendor_id: vendorId,
      category_id: formData.category_id,
      title: formData.title,
      slug,
      description: formData.description,
      price: formData.price,
      capacity: formData.capacity,
      brand: formData.brand,
      model: formData.model,
      warranty_months: formData.warranty_months,
      features,
      stock_qty: formData.stock_qty,
      in_stock: formData.in_stock,
      status: formData.status,
    })
    .select()
    .single()

  if (error) throw error
  return data as Product
}

export async function updateProduct(
  productId: string,
  formData: Partial<ProductFormData>
): Promise<Product> {
  const updates: Record<string, unknown> = { ...formData, updated_at: new Date().toISOString() }

  if (formData.features && typeof formData.features === 'string') {
    updates.features = (formData.features as string)
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean)
  }

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single()

  if (error) throw error
  return data as Product
}

export async function deleteProduct(productId: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', productId)
  if (error) throw error
}

export async function uploadProductImage(
  productId: string,
  file: File,
  isPrimary = false
): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `products/${productId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(path, file)

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(path)

  const { error: dbError } = await supabase.from('product_images').insert({
    product_id: productId,
    url: publicUrl,
    is_primary: isPrimary,
  })

  if (dbError) throw dbError
  return publicUrl
}
