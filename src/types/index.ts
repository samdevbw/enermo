// ============================================================
// ENERMO — Core TypeScript Types
// ============================================================

export type UserRole = 'customer' | 'vendor' | 'admin'

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  description: string | null
  created_at: string
}

export interface Vendor {
  id: string
  profile_id: string
  business_name: string
  description: string | null
  logo_url: string | null
  cover_url: string | null
  website: string | null
  email: string | null
  phone: string | null
  location: string | null
  city: string | null
  country: string
  verified: boolean
  active: boolean
  rating: number
  review_count: number
  created_at: string
  // Joined
  profile?: Profile
  products?: Product[]
}

export type ProductStatus = 'draft' | 'published' | 'archived'

export interface Product {
  id: string
  vendor_id: string
  category_id: string | null
  title: string
  slug: string
  description: string | null
  price: number | null
  currency: string
  unit: string
  capacity: string | null
  brand: string | null
  model: string | null
  sku: string | null
  stock_qty: number
  in_stock: boolean
  warranty_months: number | null
  features: string[] | null
  tags: string[] | null
  status: ProductStatus
  view_count: number
  inquiry_count: number
  created_at: string
  updated_at: string
  // Joined
  vendor?: Vendor
  category?: Category
  product_images?: ProductImage[]
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt: string | null
  is_primary: boolean
  sort_order: number
  created_at: string
}

export type InquiryStatus = 'open' | 'replied' | 'closed'

export interface Inquiry {
  id: string
  product_id: string | null
  vendor_id: string | null
  customer_id: string | null
  customer_name: string
  customer_email: string
  customer_phone: string | null
  message: string
  status: InquiryStatus
  created_at: string
  // Joined
  product?: Product
  vendor?: Vendor
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface Order {
  id: string
  order_number: string
  customer_id: string | null
  vendor_id: string | null
  product_id: string | null
  quantity: number
  unit_price: number
  total_amount: number
  currency: string
  status: OrderStatus
  notes: string | null
  shipping_address: string | null
  created_at: string
  updated_at: string
  // Joined
  product?: Product
  vendor?: Vendor
  customer?: Profile
}

// ============================================================
// Form input types
// ============================================================

export interface ProductFormData {
  title: string
  description: string
  price: number
  category_id: string
  capacity: string
  brand: string
  model: string
  warranty_months: number
  features: string
  stock_qty: number
  in_stock: boolean
  status: ProductStatus
}

export interface InquiryFormData {
  customer_name: string
  customer_email: string
  customer_phone: string
  message: string
}

export interface OrderFormData {
  quantity: number
  notes: string
  shipping_address: string
}

export interface VendorProfileFormData {
  business_name: string
  description: string
  email: string
  phone: string
  website: string
  location: string
  city: string
}

// ============================================================
// UI helpers
// ============================================================

export interface FilterState {
  category: string
  search: string
  minPrice: string
  maxPrice: string
  inStock: boolean
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'popular'
}
