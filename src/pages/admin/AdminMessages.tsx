import { useState } from 'react'
import { Archive, CheckCheck, Inbox, Mail, Reply } from 'lucide-react'
import { useContactMessages, useSetMessageStatus } from '@/hooks/useAdmin'
import { Badge, Button, Card, EmptyState, Spinner } from '@/components/ui'
import type { ContactMessage, MessageStatus } from '@/services/admin'

const TABS: { key: MessageStatus | 'all'; label: string }[] = [
  { key: 'new', label: 'New' },
  { key: 'read', label: 'Read' },
  { key: 'replied', label: 'Replied' },
  { key: 'archived', label: 'Archived' },
  { key: 'all', label: 'All' },
]

const STATUS_BADGE: Record<MessageStatus, 'yellow' | 'gray' | 'green'> = {
  new: 'yellow', read: 'gray', replied: 'green', archived: 'gray',
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-BW', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function AdminMessages() {
  const [tab, setTab] = useState<MessageStatus | 'all'>('new')
  const { data: messages = [], isLoading, error } = useContactMessages(tab)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Contact messages</h1>
        <p className="text-gray-500 text-sm mt-1">Messages sent through the Contact page.</p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter messages">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-primary-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && <Spinner />}
      {error && <p role="alert" className="text-sm text-red-600">{(error as Error).message}</p>}
      {!isLoading && messages.length === 0 && (
        <Card><EmptyState icon={<Inbox size={40} />} title="Nothing here" description="No messages in this folder." /></Card>
      )}

      <div className="space-y-3">
        {messages.map((m) => <MessageCard key={m.id} message={m} />)}
      </div>
    </div>
  )
}

function MessageCard({ message: m }: { message: ContactMessage }) {
  const setStatus = useSetMessageStatus()
  const [open, setOpen] = useState(false)

  function toggle() {
    setOpen((o) => !o)
    if (!open && m.status === 'new') setStatus.mutate({ id: m.id, status: 'read' })
  }

  const replyHref =
    `mailto:${encodeURIComponent(m.email)}` +
    `?subject=${encodeURIComponent(`Re: ${m.subject}`)}` +
    `&body=${encodeURIComponent(`Hi ${m.name.split(' ')[0]},\n\n\n\n— Enermo\n\n> ${m.message.replace(/\n/g, '\n> ')}`)}`

  return (
    <Card padding="none">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="w-full text-left p-4 sm:p-5 flex items-start gap-3 hover:bg-gray-50 rounded-xl"
      >
        <Mail size={18} className={`mt-0.5 shrink-0 ${m.status === 'new' ? 'text-primary-600' : 'text-gray-300'}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className={`truncate ${m.status === 'new' ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>{m.subject}</p>
            <span className="text-xs text-gray-400 shrink-0">{formatDateTime(m.created_at)}</span>
          </div>
          <p className="text-sm text-gray-500 truncate">{m.name} · {m.email}</p>
          {!open && <p className="text-sm text-gray-400 truncate mt-1">{m.message}</p>}
        </div>
        <Badge variant={STATUS_BADGE[m.status]}>{m.status}</Badge>
      </button>

      {open && (
        <div className="px-4 sm:px-5 pb-5 sm:pl-12 space-y-4">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{m.message}</p>
          <div className="flex flex-wrap gap-2">
            <a href={replyHref} onClick={() => setStatus.mutate({ id: m.id, status: 'replied' })}>
              <Button size="sm"><Reply size={16} /> Reply by email</Button>
            </a>
            {m.status !== 'replied' && (
              <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: m.id, status: 'replied' })}>
                <CheckCheck size={16} /> Mark replied
              </Button>
            )}
            {m.status !== 'archived' && (
              <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: m.id, status: 'archived' })}>
                <Archive size={16} /> Archive
              </Button>
            )}
          </div>
          {setStatus.error && <p role="alert" className="text-xs text-red-600">{(setStatus.error as Error).message}</p>}
        </div>
      )}
    </Card>
  )
}
