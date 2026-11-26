import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchAdminOverview,
  fetchContactMessages,
  setMessageStatus,
  type MessageStatus,
} from '@/services/admin'

export function useAdminOverview() {
  return useQuery({ queryKey: ['admin-overview'], queryFn: fetchAdminOverview, staleTime: 30_000 })
}

export function useContactMessages(status: MessageStatus | 'all') {
  return useQuery({ queryKey: ['admin-messages', status], queryFn: () => fetchContactMessages(status) })
}

export function useSetMessageStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MessageStatus }) => setMessageStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-messages'] })
      qc.invalidateQueries({ queryKey: ['admin-overview'] })
    },
  })
}
