import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Leaf, Send, Plus, History, Trash2, X, AlertCircle, RotateCcw, BookOpen } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { deleteConversation, fetchConversations, type EcoMessage } from '@/services/ecoguide'
import { MessageContent } from './MessageContent'
import { EstimateCard, ProductResults, VendorResults } from './ResultCards'
import type { useEcoGuideChat } from '@/hooks/useEcoGuideChat'

export const INTRODUCTION =
  "Hello! I'm ENERMO EcoGuide, your intelligent guide to renewable energy and green technology. I can help you understand energy solutions, assess your requirements, discover products and connect with service providers through ENERMO."

const QUICK_QUESTIONS = [
  'What size solar system do I need for my house?',
  'What is the difference between lithium and lead-acid batteries?',
  'Recommend a hybrid inverter for a 5kW system',
  'Is biogas suitable for a cattle farm?',
]

type Chat = ReturnType<typeof useEcoGuideChat>

interface ChatPanelProps {
  chat: Chat
  draft: string
  onDraftChange: (v: string) => void
  inputRef: React.RefObject<HTMLTextAreaElement>
}

export function ChatPanel({ chat, draft, onDraftChange, inputRef }: ChatPanelProps) {
  const { user } = useAuth()
  const [historyOpen, setHistoryOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Keep the newest message in view (scroll the panel, not the page)
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [chat.messages.length, chat.pending])

  // Grow the input with its content (up to max-h-40)
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [draft, inputRef])

  function submit(e?: FormEvent) {
    e?.preventDefault()
    if (!draft.trim() || chat.pending) return
    chat.send(draft)
    onDraftChange('')
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <section
      aria-label="EcoGuide conversation"
      className="relative bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[min(72vh,680px)] min-h-[460px] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-forest-50 text-forest-700 flex items-center justify-center">
          <Leaf size={17} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">EcoGuide</p>
          <p className="text-xs text-gray-500 truncate">AI energy advisor · answers may contain mistakes</p>
        </div>
        {user && (
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
          >
            <History size={16} /> <span className="hidden sm:inline">History</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => { chat.reset(); onDraftChange(''); inputRef.current?.focus() }}
          disabled={chat.messages.length === 0 && !chat.error}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Plus size={16} /> <span className="hidden sm:inline">New conversation</span>
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-5" aria-live="polite" aria-busy={chat.pending}>
        <AssistantBubble>
          <MessageContent text={INTRODUCTION} />
          {chat.messages.length === 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => chat.send(q)}
                  disabled={chat.pending}
                  className="text-left text-sm px-3 py-1.5 rounded-full border border-gray-200 text-gray-700 hover:border-forest-300 hover:bg-forest-50 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </AssistantBubble>

        {chat.messages.map((m) => (m.role === 'user' ? <UserBubble key={m.id} text={m.content} /> : <AssistantMessage key={m.id} message={m} />))}

        {chat.pending && (
          <AssistantBubble>
            <span className="inline-flex items-center gap-2 text-sm text-gray-500">
              <span className="flex gap-1" aria-hidden="true">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-500 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-forest-500 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-forest-500 animate-bounce" />
              </span>
              EcoGuide is thinking…
            </span>
          </AssistantBubble>
        )}

        {chat.error && (
          <div role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{chat.error.message}</p>
              {chat.error.code === 'rate_limited' && !user && (
                <Link to="/signin" className="font-medium underline">Sign in for a higher limit</Link>
              )}
            </div>
            {chat.error.retry && chat.error.code !== 'rate_limited' && chat.error.code !== 'not_configured' && (
              <button type="button" onClick={() => chat.send(chat.error!.retry!)} className="inline-flex items-center gap-1 font-medium hover:underline shrink-0">
                <RotateCcw size={14} /> Try again
              </button>
            )}
            <button type="button" onClick={chat.dismissError} aria-label="Dismiss" className="shrink-0 hover:text-red-900"><X size={16} /></button>
          </div>
        )}
      </div>

      {/* Composer */}
      <form onSubmit={submit} className="border-t border-gray-100 p-3">
        <div className="flex items-end gap-2">
          <label htmlFor="ecoguide-input" className="sr-only">Ask EcoGuide</label>
          <textarea
            id="ecoguide-input"
            ref={inputRef}
            rows={1}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={onKeyDown}
            maxLength={2000}
            placeholder="Ask about solar, batteries, biogas, products or vendors…"
            className="flex-1 resize-none max-h-40 px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-400 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!draft.trim() || chat.pending}
            aria-label="Send"
            className="h-[42px] w-[42px] shrink-0 rounded-xl bg-forest-600 text-white flex items-center justify-center hover:bg-forest-700 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-forest-400 focus:ring-offset-2"
          >
            <Send size={17} />
          </button>
        </div>
        <p className="mt-2 text-[11px] text-gray-400 px-1">
          Estimates are preliminary — confirm with a qualified installer. Questions are logged anonymously to improve EcoGuide.
          {!user && <> <Link to="/signin" className="underline">Sign in</Link> to save conversations.</>}
        </p>
      </form>

      {historyOpen && user && (
        <HistoryDrawer
          activeId={chat.conversationId}
          onClose={() => setHistoryOpen(false)}
          onOpen={(id) => { chat.open(id); setHistoryOpen(false) }}
          onDeletedActive={() => chat.reset()}
        />
      )}
    </section>
  )
}

function AssistantBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 shrink-0 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center mt-0.5" aria-hidden="true">
        <Leaf size={14} />
      </div>
      <div className="min-w-0 flex-1 text-gray-700">{children}</div>
    </div>
  )
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[85%] whitespace-pre-wrap text-sm leading-relaxed bg-gray-100 text-gray-900 rounded-2xl rounded-br-md px-4 py-2.5">
        {text}
      </p>
    </div>
  )
}

function AssistantMessage({ message: m }: { message: EcoMessage }) {
  return (
    <AssistantBubble>
      <MessageContent text={m.content} />
      <div className="mt-3 space-y-3 empty:hidden">
        {m.estimate && <EstimateCard estimate={m.estimate} />}
        {m.products && <ProductResults products={m.products} />}
        {m.vendors && <VendorResults vendors={m.vendors} />}
        {m.sources && m.sources.length > 0 && (
          <p className="text-xs text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1">
            <BookOpen size={13} className="text-gray-400" aria-hidden="true" />
            <span>Sources:</span>
            {m.sources.slice(0, 3).map((s) => (
              <Link key={s.slug} to={`/ecoguide/learn/${s.slug}`} className="underline underline-offset-2 hover:text-gray-800">{s.title}</Link>
            ))}
          </p>
        )}
      </div>
    </AssistantBubble>
  )
}

function HistoryDrawer({ activeId, onClose, onOpen, onDeletedActive }: {
  activeId: string | null
  onClose: () => void
  onOpen: (id: string) => void
  onDeletedActive: () => void
}) {
  const qc = useQueryClient()
  const { data = [], isLoading } = useQuery({ queryKey: ['ecoguide-conversations'], queryFn: fetchConversations })
  const del = useMutation({
    mutationFn: deleteConversation,
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ['ecoguide-conversations'] })
      if (id === activeId) onDeletedActive()
    },
  })

  useEffect(() => {
    const onEsc = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [onClose])

  return (
    <div className="absolute inset-0 z-10 flex">
      <button type="button" aria-label="Close history" className="flex-1 bg-black/20" onClick={onClose} />
      <aside role="dialog" aria-label="Conversation history" className="w-full max-w-xs bg-white border-l border-gray-200 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Your conversations</p>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 rounded hover:bg-gray-100"><X size={16} /></button>
        </div>
        <ul className="flex-1 overflow-y-auto p-2">
          {isLoading && <li className="p-3 text-sm text-gray-400">Loading…</li>}
          {!isLoading && data.length === 0 && <li className="p-3 text-sm text-gray-500">No saved conversations yet.</li>}
          {data.map((c) => (
            <li key={c.id} className={`group flex items-center rounded-lg ${c.id === activeId ? 'bg-forest-50' : 'hover:bg-gray-50'}`}>
              <button type="button" onClick={() => onOpen(c.id)} className="flex-1 min-w-0 text-left px-3 py-2">
                <p className="text-sm text-gray-800 truncate">{c.title}</p>
                <p className="text-xs text-gray-400">{new Date(c.updated_at).toLocaleDateString('en-BW', { day: 'numeric', month: 'short' })}</p>
              </button>
              <button
                type="button"
                onClick={() => del.mutate(c.id)}
                aria-label={`Delete ${c.title}`}
                className="p-2 mr-1 rounded text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}
