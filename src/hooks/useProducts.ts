import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchProducts,
  fetchProductBySlug,
  fetchVendorProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/services/products'
import {
  fetchVendors,
  fetchVendorById,
  fetchVendorByProfileId,
  fetchVendorInquiries,
  fetchVendorOrders,
  fetchCustomerOrders,
  submitInquiry,
  placeOrder,
  updateOrderStatus,
} from '@/services/vendors'
import type { FilterState, ProductFormData, InquiryFormData, OrderFormData } from '@/types'

// ---- Products ----

export function useProducts(filters?: Partial<FilterState>) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProductBySlug(slug),
    enabled: !!slug,
  })
}

export function useVendorProducts(vendorId: string | undefined) {
  return useQuery({
    queryKey: ['vendor-products', vendorId],
    queryFn: () => fetchVendorProducts(vendorId!),
    enabled: !!vendorId,
  })
}

export function useCreateProduct(vendorId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: ProductFormData) => createProduct(vendorId, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-products'] })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useUpdateProduct(productId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: Partial<ProductFormData>) => updateProduct(productId, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-products'] })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (productId: string) => deleteProduct(productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-products'] })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

// ---- Vendors ----

export function useVendors() {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: fetchVendors,
  })
}

export function useVendor(vendorId: string | undefined) {
  return useQuery({
    queryKey: ['vendor', vendorId],
    queryFn: () => fetchVendorById(vendorId!),
    enabled: !!vendorId,
  })
}

export function useVendorByProfile(profileId: string | undefined) {
  return useQuery({
    queryKey: ['vendor-profile', profileId],
    queryFn: () => fetchVendorByProfileId(profileId!),
    enabled: !!profileId,
  })
}

// ---- Inquiries ----

export function useVendorInquiries(vendorId: string | undefined) {
  return useQuery({
    queryKey: ['vendor-inquiries', vendorId],
    queryFn: () => fetchVendorInquiries(vendorId!),
    enabled: !!vendorId,
  })
}

export function useSubmitInquiry() {
  return useMutation({
    mutationFn: ({
      productId,
      vendorId,
      customerId,
      formData,
    }: {
      productId: string
      vendorId: string
      customerId: string | null
      formData: InquiryFormData
    }) => submitInquiry(productId, vendorId, customerId, formData),
  })
}

// ---- Orders ----

export function useVendorOrders(vendorId: string | undefined) {
  return useQuery({
    queryKey: ['vendor-orders', vendorId],
    queryFn: () => fetchVendorOrders(vendorId!),
    enabled: !!vendorId,
  })
}

export function useCustomerOrders(customerId: string | undefined) {
  return useQuery({
    queryKey: ['customer-orders', customerId],
    queryFn: () => fetchCustomerOrders(customerId!),
    enabled: !!customerId,
  })
}

export function usePlaceOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      productId,
      vendorId,
      customerId,
      unitPrice,
      formData,
    }: {
      productId: string
      vendorId: string
      customerId: string
      unitPrice: number
      formData: OrderFormData
    }) => placeOrder(productId, vendorId, customerId, unitPrice, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer-orders'] })
    },
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      updateOrderStatus(orderId, status as Parameters<typeof updateOrderStatus>[1]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-orders'] })
    },
  })
}
