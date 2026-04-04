// ============================================================
// VENDORS SERVICE
// ============================================================
import { supabase } from '@/lib/supabase'
import type { Vendor, VendorProfileFormData, Inquiry, InquiryFormData, Order, OrderFormData } from '@/types'

export async function fetchVendors(): Promise<Vendor[]> {
  const { data, error } = await supabase
    .from('vendors')
    .select('*, profile:profiles(*)')
    .eq('active', true)
    .order('rating', { ascending: false })

  if (error) throw error
  return data as Vendor[]
}

export async function fetchVendorById(vendorId: string): Promise<Vendor> {
  const { data, error } = await supabase
    .from('vendors')
    .select('*, profile:profiles(*)')
    .eq('id', vendorId)
    .single()

  if (error) throw error
  return data as Vendor
}

export async function fetchVendorByProfileId(profileId: string): Promise<Vendor | null> {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) throw error
  return data as Vendor | null
}

export async function createVendor(
  profileId: string,
  formData: VendorProfileFormData
): Promise<Vendor> {
  const { data, error } = await supabase
    .from('vendors')
    .insert({ profile_id: profileId, ...formData })
    .select()
    .single()

  if (error) throw error
  return data as Vendor
}

export async function updateVendor(
  vendorId: string,
  formData: Partial<VendorProfileFormData>
): Promise<Vendor> {
  const { data, error } = await supabase
    .from('vendors')
    .update(formData)
    .eq('id', vendorId)
    .select()
    .single()

  if (error) throw error
  return data as Vendor
}

// ============================================================
// INQUIRIES SERVICE
// ============================================================

export async function submitInquiry(
  productId: string,
  vendorId: string,
  customerId: string | null,
  formData: InquiryFormData
): Promise<Inquiry> {
  const { data, error } = await supabase
    .from('inquiries')
    .insert({
      product_id: productId,
      vendor_id: vendorId,
      customer_id: customerId,
      ...formData,
    })
    .select()
    .single()

  if (error) throw error

  // Increment inquiry count
  supabase
    .from('products')
    .rpc('increment', { row_id: productId, table_name: 'products', column_name: 'inquiry_count' })
    .then(() => {})

  return data as Inquiry
}

export async function fetchVendorInquiries(vendorId: string): Promise<Inquiry[]> {
  const { data, error } = await supabase
    .from('inquiries')
    .select('*, product:products(title, slug)')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Inquiry[]
}

export async function updateInquiryStatus(
  inquiryId: string,
  status: Inquiry['status']
): Promise<void> {
  const { error } = await supabase
    .from('inquiries')
    .update({ status })
    .eq('id', inquiryId)

  if (error) throw error
}

// ============================================================
// ORDERS SERVICE
// ============================================================

export async function placeOrder(
  productId: string,
  vendorId: string,
  customerId: string,
  unitPrice: number,
  formData: OrderFormData
): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      product_id: productId,
      vendor_id: vendorId,
      customer_id: customerId,
      unit_price: unitPrice,
      total_amount: unitPrice * formData.quantity,
      quantity: formData.quantity,
      notes: formData.notes,
      shipping_address: formData.shipping_address,
    })
    .select()
    .single()

  if (error) throw error
  return data as Order
}

export async function fetchCustomerOrders(customerId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, product:products(title, slug), vendor:vendors(business_name)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Order[]
}

export async function fetchVendorOrders(vendorId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, product:products(title, slug), customer:profiles(full_name, phone)')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Order[]
}

export async function updateOrderStatus(
  orderId: string,
  status: Order['status']
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) throw error
}
