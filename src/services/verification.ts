// ============================================================
// VENDOR VERIFICATION SERVICE — CIPA + BURS documents
// ============================================================
import { supabase } from '@/lib/supabase'
import type { Vendor } from '@/types'

const BUCKET = 'vendor-documents'

// Keep in sync with migration 005 (CHECK constraint + bucket limits)
export const DOC_TYPES = ['cipa_certificate', 'burs_tax_clearance'] as const
export type DocType = (typeof DOC_TYPES)[number]
export type DocStatus = 'pending' | 'approved' | 'rejected'

export const DOC_LABELS: Record<DocType, { title: string; description: string; hasExpiry: boolean }> = {
  cipa_certificate: {
    title: 'CIPA Certificate',
    description: 'Certificate of Incorporation or Business Name Registration from CIPA.',
    hasExpiry: false,
  },
  burs_tax_clearance: {
    title: 'BURS Tax Clearance Certificate',
    description: 'A current Tax Clearance Certificate issued by BURS.',
    hasExpiry: true,
  },
}

export const DOC_MAX_BYTES = 5 * 1024 * 1024
export const DOC_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const

export interface VendorDocument {
  id: string
  vendor_id: string
  doc_type: DocType
  file_path: string
  file_name: string
  expires_on: string | null
  status: DocStatus
  rejection_reason: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  uploaded_at: string
}

export interface VendorWithDocuments extends Vendor {
  documents: VendorDocument[]
}

/** Latest document per type — older rows are history. Input must be newest-first. */
export function latestByType(docs: VendorDocument[]): Partial<Record<DocType, VendorDocument>> {
  const out: Partial<Record<DocType, VendorDocument>> = {}
  for (const d of docs) if (!out[d.doc_type]) out[d.doc_type] = d
  return out
}

export function validateDocument(file: File): string | null {
  if (!(DOC_MIME_TYPES as readonly string[]).includes(file.type)) return 'Please upload a PDF, JPG or PNG file.'
  if (file.size > DOC_MAX_BYTES) return 'File must be 5 MB or smaller.'
  return null
}

// ---------- Vendor side ----------

export async function fetchMyDocuments(vendorId: string): Promise<VendorDocument[]> {
  const { data, error } = await supabase
    .from('vendor_documents')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('uploaded_at', { ascending: false })
  if (error) throw error
  return data as VendorDocument[]
}

export async function uploadVendorDocument(params: {
  userId: string
  vendorId: string
  docType: DocType
  file: File
  expiresOn: string | null
}): Promise<void> {
  const { userId, vendorId, docType, file, expiresOn } = params
  const problem = validateDocument(file)
  if (problem) throw new Error(problem)

  const ext = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg'
  // Folder = user id: required by storage RLS and by the insert policy
  const path = `${userId}/${docType}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type })
  if (uploadError) throw uploadError

  const { error } = await supabase.from('vendor_documents').insert({
    vendor_id: vendorId,
    doc_type: docType,
    file_path: path,
    file_name: file.name.slice(0, 255),
    expires_on: expiresOn,
  })
  // The file stays in storage if this fails; it's private and harmless,
  // and keeping it avoids needing a delete policy on an audit bucket.
  if (error) throw error
}

/** Private bucket → short-lived link (5 min) instead of a public URL. */
export async function getDocumentUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(filePath, 300)
  if (error) throw error
  return data.signedUrl
}

// ---------- Admin side ----------

export async function fetchVendorsForReview(): Promise<VendorWithDocuments[]> {
  const { data, error } = await supabase
    .from('vendors')
    .select('*, profile:profiles(full_name, phone), documents:vendor_documents(*)')
    .order('created_at', { ascending: false })
    .order('uploaded_at', { referencedTable: 'vendor_documents', ascending: false })
  if (error) throw error
  return data as VendorWithDocuments[]
}

export async function reviewDocument(params: {
  documentId: string
  reviewerId: string
  decision: 'approved' | 'rejected'
  reason?: string
}): Promise<void> {
  const { documentId, reviewerId, decision, reason } = params
  const { error } = await supabase
    .from('vendor_documents')
    .update({
      status: decision,
      rejection_reason: decision === 'rejected' ? reason?.trim() || null : null,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', documentId)
  if (error) throw error
}
