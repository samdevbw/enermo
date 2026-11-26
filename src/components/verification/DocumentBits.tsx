import { useState } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui'
import { getDocumentUrl, type DocStatus } from '@/services/verification'

const STATUS: Record<DocStatus | 'missing', { label: string; variant: 'green' | 'yellow' | 'red' | 'gray' }> = {
  approved: { label: 'Approved', variant: 'green' },
  pending: { label: 'In review', variant: 'yellow' },
  rejected: { label: 'Rejected', variant: 'red' },
  missing: { label: 'Not uploaded', variant: 'gray' },
}

export function DocStatusBadge({ status }: { status: DocStatus | undefined }) {
  const s = STATUS[status ?? 'missing']
  return <Badge variant={s.variant}>{s.label}</Badge>
}

/**
 * Opens a private document via a 5-minute signed URL. The tab is opened
 * synchronously (before the await) so popup blockers don't stop it.
 */
export function ViewDocumentButton({ filePath, fileName }: { filePath: string; fileName: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function open() {
    const tab = window.open('', '_blank')
    try {
      setError('')
      setLoading(true)
      const url = await getDocumentUrl(filePath)
      if (tab) tab.location.href = url
      else window.location.href = url
    } catch (e: unknown) {
      tab?.close()
      setError(e instanceof Error ? e.message : 'Could not open file')
    } finally {
      setLoading(false)
    }
  }

  return (
    <span className="inline-flex items-center gap-2 min-w-0">
      <button
        type="button"
        onClick={open}
        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline min-w-0"
        title={fileName}
      >
        {loading ? <Loader2 size={14} className="animate-spin shrink-0" /> : <ExternalLink size={14} className="shrink-0" />}
        <span className="truncate">{fileName}</span>
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  )
}

export function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-BW', { day: 'numeric', month: 'short', year: 'numeric' })
}
