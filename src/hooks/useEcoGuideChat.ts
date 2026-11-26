import { useCallback, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import {
  EcoGuideError,
  fetchConversationMessages,
  sendEcoGuideMessage,
  type EcoMessage,
} from '@/services/ecoguide'

let localId = 0
const nextId = () => `local-${++localId}`

/**
 * Chat state for EcoGuide.
 * - Visitors: history lives in memory and is sent with each request.
 * - Signed-in users: the server stores the conversation; we keep its id.
 */
export function useEcoGuideChat() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [messages, setMessages] = useState<EcoMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<{ message: string; code: string; retry?: string } | null>(null)
  const inFlight = useRef(false)

  const send = useCallback(async (text: string) => {
    const message = text.trim()
    if (!message || inFlight.current) return
    inFlight.current = true
    setError(null)
    setPending(true)

    const history = messages.map(({ role, content }) => ({ role, content }))
    setMessages((m) => [...m, { id: nextId(), role: 'user', content: message }])

    try {
      const res = await sendEcoGuideMessage({ message, conversationId: user ? conversationId : null, history: user ? [] : history })
      if (res.conversationId && res.conversationId !== conversationId) {
        setConversationId(res.conversationId)
        qc.invalidateQueries({ queryKey: ['ecoguide-conversations'] })
      }
      setMessages((m) => [...m, {
        id: nextId(), role: 'assistant', content: res.reply,
        products: res.products, vendors: res.vendors, estimate: res.estimate, sources: res.sources,
      }])
    } catch (e) {
      // Remove the optimistic user message so "Try again" doesn't duplicate it
      setMessages((m) => m.slice(0, -1))
      setError({
        message: e instanceof Error ? e.message : 'Something went wrong.',
        code: e instanceof EcoGuideError ? e.code : 'unknown',
        retry: message,
      })
    } finally {
      setPending(false)
      inFlight.current = false
    }
  }, [messages, conversationId, user, qc])

  const reset = useCallback(() => {
    setMessages([])
    setConversationId(null)
    setError(null)
  }, [])

  const open = useCallback(async (id: string) => {
    setError(null)
    setPending(true)
    try {
      setMessages(await fetchConversationMessages(id))
      setConversationId(id)
    } catch {
      setError({ message: 'Could not load that conversation.', code: 'load_failed' })
    } finally {
      setPending(false)
    }
  }, [])

  return { messages, conversationId, pending, error, send, reset, open, dismissError: () => setError(null) }
}
