import { useRef, useState } from 'react'
import { ShieldCheck, Upload } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useMyDocuments, useUploadDocument } from '@/hooks/useVerification'
import { Button, Card, Input, Spinner } from '@/components/ui'
import {
  DOC_LABELS,
  DOC_MIME_TYPES,
  DOC_TYPES,
  latestByType,
  validateDocument,
  type DocType,
  type VendorDocument,
} from '@/services/verification'
import { DocStatusBadge, ViewDocumentButton, formatDate } from './DocumentBits'
import type { Vendor } from '@/types'

/** Vendor-facing: upload CIPA + BURS documents and see their review status. */
export function VerificationSection({ vendor }: { vendor: Vendor }) {
  const { data: docs = [], isLoading } = useMyDocuments(vendor.id)
  const latest = latestByType(docs)

  return (
    <Card>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-gray-900">Verification documents</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Upload both documents to earn the <strong>Verified</strong> badge on your profile and products.
            Our team reviews uploads within 2 working days.
          </p>
        </div>
        {vendor.verified && (
          <span className="inline-flex items-center gap-1 shrink-0 text-sm font-medium text-forest-700">
            <ShieldCheck size={18} /> Verified
          </span>
        )}
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <ul className="divide-y divide-gray-100">
          {DOC_TYPES.map((type) => (
            <DocumentRow key={type} vendorId={vendor.id} docType={type} current={latest[type]} />
          ))}
        </ul>
      )}
    </Card>
  )
}

function DocumentRow({
  vendorId,
  docType,
  current,
}: {
  vendorId: string
  docType: DocType
  current: VendorDocument | undefined
}) {
  const { user } = useAuth()
  const upload = useUploadDocument()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [expiresOn, setExpiresOn] = useState('')
  const [error, setError] = useState('')
  const meta = DOC_LABELS[docType]

  // Approved/pending docs don't need replacing unless the vendor chooses to
  const [replacing, setReplacing] = useState(false)
  const showForm = !current || current.status === 'rejected' || replacing

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    e.target.value = ''
    if (!f) return
    const problem = validateDocument(f)
    setError(problem ?? '')
    setFile(problem ? null : f)
  }

  async function submit() {
    if (!file || !user) return
    if (meta.hasExpiry && !expiresOn) {
      setError('Please enter the expiry date shown on the certificate.')
      return
    }
    try {
      setError('')
      await upload.mutateAsync({ userId: user.id, vendorId, docType, file, expiresOn: expiresOn || null })
      setFile(null)
      setExpiresOn('')
      setReplacing(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    }
  }

  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <p className="font-medium text-gray-900">{meta.title}</p>
        <DocStatusBadge status={current?.status} />
      </div>
      <p className="text-sm text-gray-500 mt-0.5">{meta.description}</p>

      {current && (
        <div className="mt-2 text-sm text-gray-600 flex flex-wrap items-center gap-x-3 gap-y-1">
          <ViewDocumentButton filePath={current.file_path} fileName={current.file_name} />
          <span className="text-gray-400">Uploaded {formatDate(current.uploaded_at)}</span>
          {current.expires_on && <span className="text-gray-400">Expires {formatDate(current.expires_on)}</span>}
          {!showForm && (
            <button type="button" onClick={() => setReplacing(true)} className="text-gray-500 hover:text-gray-800 hover:underline">
              Replace
            </button>
          )}
        </div>
      )}

      {current?.status === 'rejected' && current.rejection_reason && (
        <p role="alert" className="mt-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          <strong>Reason:</strong> {current.rejection_reason} — please upload a new copy.
        </p>
      )}

      {showForm && (
        <div className="mt-3 flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1 min-w-0">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-primary-400 hover:bg-primary-50"
            >
              <Upload size={16} className="shrink-0" />
              <span className="truncate">{file ? file.name : 'Choose file (PDF, JPG or PNG, max 5 MB)'}</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={DOC_MIME_TYPES.join(',')}
              className="sr-only"
              tabIndex={-1}
              onChange={pick}
              aria-label={`${meta.title} file`}
            />
          </div>
          {meta.hasExpiry && (
            <div className="sm:w-44">
              <Input
                label="Expiry date"
                type="date"
                value={expiresOn}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setExpiresOn(e.target.value)}
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button type="button" onClick={submit} disabled={!file} loading={upload.isPending}>
              Submit
            </Button>
            {replacing && (
              <Button type="button" variant="ghost" onClick={() => { setReplacing(false); setFile(null); setError('') }}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    </li>
  )
}
