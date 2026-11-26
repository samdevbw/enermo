import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchMyDocuments,
  fetchVendorsForReview,
  reviewDocument,
  uploadVendorDocument,
} from '@/services/verification'

export function useMyDocuments(vendorId: string | undefined) {
  return useQuery({
    queryKey: ['vendor-documents', vendorId],
    queryFn: () => fetchMyDocuments(vendorId!),
    enabled: !!vendorId,
  })
}

export function useUploadDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: uploadVendorDocument,
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['vendor-documents', vars.vendorId] })
      // A new pending upload can switch the verified badge off
      qc.invalidateQueries({ queryKey: ['vendor-profile'] })
    },
  })
}

export function useVendorsForReview() {
  return useQuery({ queryKey: ['admin-vendor-review'], queryFn: fetchVendorsForReview })
}

export function useReviewDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: reviewDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-vendor-review'] })
      qc.invalidateQueries({ queryKey: ['vendors'] })
    },
  })
}
