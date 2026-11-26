import { useId, useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { IMAGE_TYPES } from '@/services/profile'

interface ImageUploadFieldProps {
  label: string
  value: string | null
  /** Placeholder content when there is no image (e.g. initials). */
  fallback: string
  shape?: 'circle' | 'rounded'
  /** Uploads the file and resolves with its URL. */
  onUpload: (file: File) => Promise<string>
  onChange: (url: string | null) => void
}

export function ImageUploadField({
  label,
  value,
  fallback,
  shape = 'circle',
  onUpload,
  onChange,
}: ImageUploadFieldProps) {
  const inputId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-xl'

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow picking the same file again after an error
    if (!file) return
    try {
      setError('')
      setUploading(true)
      onChange(await onUpload(file))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className={`relative w-20 h-20 shrink-0 overflow-hidden bg-primary-100 ${radius} flex items-center justify-center`}>
        {value ? (
          <img src={value} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="text-2xl font-bold text-primary-600" aria-hidden="true">{fallback}</span>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary-600" size={22} />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-700" id={`${inputId}-label`}>{label}</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-describedby={`${inputId}-label`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:underline disabled:opacity-50"
          >
            <Camera size={16} /> {value ? 'Change' : 'Upload'}
          </button>
          {value && !uploading && (
            <button type="button" onClick={() => onChange(null)} className="text-sm text-gray-500 hover:text-red-600">
              Remove
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500">JPG, PNG or WebP, up to 2 MB</p>
        {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
      </div>

      <input
        ref={fileRef}
        id={inputId}
        type="file"
        accept={IMAGE_TYPES.join(',')}
        className="sr-only"
        tabIndex={-1}
        onChange={handleFile}
      />
    </div>
  )
}
