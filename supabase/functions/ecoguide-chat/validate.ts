// ============================================================
// Request validation + small text helpers. Pure — no I/O.
// ============================================================

export const LIMITS = {
  messageChars: 2000,
  historyMessages: 12,
  historyMessageChars: 4000,
} as const

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  message: string
  conversationId: string | null
  /** Only used for visitors; signed-in history is loaded from the database. */
  history: ChatTurn[]
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export class ValidationError extends Error {}

export function parseChatRequest(body: unknown): ChatRequest {
  if (typeof body !== 'object' || body === null) throw new ValidationError('Invalid request body.')
  const b = body as Record<string, unknown>

  const message = typeof b.message === 'string' ? b.message.trim() : ''
  if (!message) throw new ValidationError('Please type a question.')
  if (message.length > LIMITS.messageChars) {
    throw new ValidationError(`Please keep messages under ${LIMITS.messageChars} characters.`)
  }

  let conversationId: string | null = null
  if (b.conversationId != null) {
    if (typeof b.conversationId !== 'string' || !UUID_RE.test(b.conversationId)) {
      throw new ValidationError('Invalid conversation id.')
    }
    conversationId = b.conversationId
  }

  const history: ChatTurn[] = []
  if (Array.isArray(b.history)) {
    for (const t of b.history.slice(-LIMITS.historyMessages)) {
      if (typeof t !== 'object' || t === null) continue
      const { role, content } = t as Record<string, unknown>
      if ((role === 'user' || role === 'assistant') && typeof content === 'string' && content.trim()) {
        history.push({ role, content: content.slice(0, LIMITS.historyMessageChars) })
      }
    }
  }

  return { message, conversationId, history }
}

const STOP = new Set(
  'a an and are as at be but by can could do does for from have how i if in is it me my of on or should so than that the this to want was what when where which who why will with would you your need get any some best good recommend show find looking'.split(' '),
)

/** Keywords for full-text retrieval fallback and logging. */
export function keywords(text: string, max = 8): string[] {
  const seen = new Set<string>()
  for (const w of text.toLowerCase().match(/[a-z0-9][a-z0-9.-]*/g) ?? []) {
    const t = w.replace(/[.-]+$/, '')
    if (t.length < 2 || STOP.has(t)) continue
    seen.add(t)
    if (seen.size >= max) break
  }
  return [...seen]
}

export function conversationTitle(firstMessage: string): string {
  const oneLine = firstMessage.replace(/\s+/g, ' ').trim()
  return oneLine.length > 60 ? oneLine.slice(0, 57).trimEnd() + '…' : oneLine
}
