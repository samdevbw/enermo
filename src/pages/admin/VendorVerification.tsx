import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ShieldCheck, XCircle, Mail, Phone, FileWarning } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useReviewDocument, useVendorsForReview } from '@/hooks/useVerification'
import { Button, Card, EmptyState, Modal, Spinner, Textarea } from '@/components/ui'
import { DocStatusBadge, ViewDocumentButton, formatDate } from '@/components/verification/DocumentBits'
import {
  DOC_LABELS,
  DOC_TYPES,
  latestByType,
  type VendorDocument,
  type VendorWithDocuments,
} from '@/services/verification'

type Filter = 'review' | 'unverified' | 'verified' | 'all'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'review', label: 'Needs review' },
  { key: 'unverified', label: 'Not verified' },
  { key: 'verified', label: 'Verified' },
  { key: 'all', label: 'All vendors' },
]

function needsReview(v: VendorWithDocuments) {
  return Object.values(latestByType(v.documents)).some((d) => d?.status === 'pending')
}

function isExpired(d: VendorDocument) {
  return !!d.expires_on && new Date(d.expires_on) < new Date(new Date().toDateString())
}

export function VendorVerification() {
  const { data: vendors = [], isLoading, error } = useVendorsForReview()
  const [filter, setFilter] = useState<Filter>('review')

  const counts = useMemo(
    () => ({
      review: vendors.filter(needsReview).length,
      unverified: vendors.filter((v) => !v.verified).length,
      verified: vendors.filter((v) => v.verified).length,
      all: vendors.length,
    }),
    [vendors],
  )

  const shown = vendors.filter((v) =>
    filter === 'review' ? needsReview(v)
      : filter === 'unverified' ? !v.verified
      : filter === 'verified' ? v.verified
      : true,
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Vendor verification</h1>
        <p className="text-gray-500 text-sm mt-1">
          Review CIPA and BURS documents. A vendor is verified automatically once both are approved.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter vendors">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.key ? 'bg-primary-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label} <span className="opacity-75">({counts[f.key]})</span>
          </button>
        ))}
      </div>

      {isLoading && <Spinner />}
      {error && <p role="alert" className="text-sm text-red-600">Could not load vendors: {(error as Error).message}</p>}
      {!isLoading && shown.length === 0 && (
        <Card>
          <EmptyState
            icon={<CheckCircle2 size={40} className="text-forest-400" />}
            title={filter === 'review' ? 'All caught up' : 'No vendors here'}
            description={filter === 'review' ? 'There are no documents waiting for review.' : undefined}
          />
        </Card>
      )}

      <div className="space-y-4">
        {shown.map((v) => <VendorReviewCard key={v.id} vendor={v} />)}
      </div>
    </div>
  )
}

function VendorReviewCard({ vendor }: { vendor: VendorWithDocuments }) {
  const latest = latestByType(vendor.documents)
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link to={`/vendors/${vendor.id}`} className="font-semibold text-gray-900 hover:underline truncate">
              {vendor.business_name}
            </Link>
            {vendor.verified && <ShieldCheck size={18} className="text-forest-600 shrink-0" aria-label="Verified" />}
          </div>
          <div className="text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mt-1">
            {vendor.profile?.full_name && <span>{vendor.profile.full_name}</span>}
            {vendor.email && <a href={`mailto:${vendor.email}`} className="inline-flex items-center gap-1 hover:text-primary-600"><Mail size={14} />{vendor.email}</a>}
            {vendor.phone && <a href={`tel:${vendor.phone}`} className="inline-flex items-center gap-1 hover:text-primary-600"><Phone size={14} />{vendor.phone}</a>}
            {vendor.city && <span>{vendor.city}</span>}
          </div>
        </div>
      </div>

      <ul className="divide-y divide-gray-100 border-t border-gray-100">
        {DOC_TYPES.map((type) => (
          <li key={type} className="py-3">
            <DocumentReviewRow title={DOC_LABELS[type].title} doc={latest[type]} />
          </li>
        ))}
      </ul>
    </Card>
  )
}

function DocumentReviewRow({ title, doc }: { title: string; doc: VendorDocument | undefined }) {
  const { user } = useAuth()
  const review = useReviewDocument()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')

  async function decide(decision: 'approved' | 'rejected') {
    if (!doc || !user) return
    await review.mutateAsync({ documentId: doc.id, reviewerId: user.id, decision, reason })
    setRejectOpen(false)
    setReason('')
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-800">{title}</p>
          <DocStatusBadge status={doc?.status} />
        </div>
        {doc ? (
          <div className="text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
            <ViewDocumentButton filePath={doc.file_path} fileName={doc.file_name} />
            <span className="text-gray-400">Uploaded {formatDate(doc.uploaded_at)}</span>
            {doc.expires_on && (
              <span className={isExpired(doc) ? 'text-red-600 inline-flex items-center gap-1' : 'text-gray-400'}>
                {isExpired(doc) && <FileWarning size={14} />}
                {isExpired(doc) ? 'Expired' : 'Expires'} {formatDate(doc.expires_on)}
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Vendor hasn't uploaded this yet.</p>
        )}
        {doc?.status === 'rejected' && doc.rejection_reason && (
          <p className="text-xs text-red-600">Rejected: {doc.rejection_reason}</p>
        )}
        {review.error && <p role="alert" className="text-xs text-red-600">{(review.error as Error).message}</p>}
      </div>

      {doc && doc.status !== 'approved' && (
        <div className="flex gap-2 shrink-0">
          <Button size="sm" onClick={() => decide('approved')} loading={review.isPending && !rejectOpen}>
            <CheckCircle2 size={16} /> Approve
          </Button>
          {doc.status === 'pending' && (
            <Button size="sm" variant="ghost" onClick={() => setRejectOpen(true)}>
              <XCircle size={16} /> Reject
            </Button>
          )}
        </div>
      )}
      {doc?.status === 'approved' && (
        <Button size="sm" variant="ghost" className="shrink-0" onClick={() => setRejectOpen(true)}>
          Revoke
        </Button>
      )}

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title={`Reject ${title}`} size="sm">
        <div className="space-y-4">
          <Textarea
            label="Reason (shown to the vendor)"
            placeholder="e.g. Certificate has expired, document is unreadable, business name doesn't match"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={1000}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="danger" disabled={reason.trim().length < 5} loading={review.isPending} onClick={() => decide('rejected')}>
              Reject document
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
