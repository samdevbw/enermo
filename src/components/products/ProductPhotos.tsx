import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Loader2, Star, Trash2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import {
  MAX_PRODUCT_PHOTOS,
  PRODUCT_IMAGE_TYPES,
  deleteProductPhoto,
  fetchProductImages,
  setPrimaryPhoto,
  uploadProductPhoto,
  validateProductPhoto,
} from '@/services/productImages'
import type { ProductImage } from '@/types'

interface ProductPhotosProps {
  productId: string
  productTitle: string
}

/**
 * Photo manager for a saved product. Changes apply immediately (no Save
 * button) — same as most marketplace seller tools — so vendors can't lose
 * uploads by closing the form.
 */
export function ProductPhotos({ productId, productTitle }: ProductPhotosProps) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(0)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const queryKey = ['product-images', productId]
  const { data: images = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchProductImages(productId),
  })

  function refresh() {
    qc.invalidateQueries({ queryKey })
    qc.invalidateQueries({ queryKey: ['vendor-products'] })
    qc.invalidateQueries({ queryKey: ['products'] })
    qc.invalidateQueries({ queryKey: ['product'] })
  }

  const hasPrimary = images.some((i) => i.is_primary)
  const slotsLeft = MAX_PRODUCT_PHOTOS - images.length

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!user || picked.length === 0) return

    const problems: string[] = []
    if (picked.length > slotsLeft) problems.push(`You can add ${slotsLeft} more photo${slotsLeft === 1 ? '' : 's'} (max ${MAX_PRODUCT_PHOTOS}).`)
    const files = picked.slice(0, Math.max(0, slotsLeft)).filter((f) => {
      const p = validateProductPhoto(f)
      if (p) problems.push(p)
      return !p
    })

    setErrors(problems)
    setUploading(files.length)
    let order = images.reduce((m, i) => Math.max(m, i.sort_order), -1) + 1
    let primaryTaken = hasPrimary

    // Sequential: predictable order, and gentle on slow connections
    for (const file of files) {
      try {
        await uploadProductPhoto({
          userId: user.id,
          productId,
          file,
          alt: productTitle,
          isPrimary: !primaryTaken,
          sortOrder: order++,
        })
        primaryTaken = true
      } catch (err: unknown) {
        problems.push(err instanceof Error ? err.message : `${file.name}: upload failed`)
        setErrors([...problems])
      } finally {
        setUploading((n) => n - 1)
        refresh()
      }
    }
  }

  async function makePrimary(img: ProductImage) {
    try {
      setBusyId(img.id)
      await setPrimaryPhoto(productId, img.id)
      refresh()
    } catch (err: unknown) {
      setErrors([err instanceof Error ? err.message : 'Could not change the main photo'])
    } finally {
      setBusyId(null)
    }
  }

  async function remove(img: ProductImage) {
    try {
      setBusyId(img.id)
      await deleteProductPhoto(img)
      // Keep a main photo if the main one was removed
      const next = images.find((i) => i.id !== img.id)
      if (img.is_primary && next) await setPrimaryPhoto(productId, next.id)
      refresh()
    } catch (err: unknown) {
      setErrors([err instanceof Error ? err.message : 'Could not remove photo'])
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section aria-labelledby="product-photos-heading" className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="product-photos-heading" className="text-sm font-medium text-gray-700">
          Photos <span className="text-gray-400 font-normal">({images.length}/{MAX_PRODUCT_PHOTOS})</span>
        </h3>
        <p className="text-xs text-gray-500">The ★ photo is shown on listings. Changes save automatically.</p>
      </div>

      {isLoading ? (
        <Loader2 className="animate-spin text-gray-400" size={20} />
      ) : (
        <ul className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((img) => (
            <li key={img.id} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
              <img src={img.url} alt={img.alt ?? ''} className="w-full h-full object-cover" loading="lazy" />
              {img.is_primary && (
                <span className="absolute top-1.5 left-1.5 bg-primary-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                  MAIN
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 p-1.5 bg-gradient-to-t from-black/50 to-transparent">
                {busyId === img.id ? (
                  <Loader2 className="animate-spin text-white" size={18} />
                ) : (
                  <>
                    {!img.is_primary && (
                      <button
                        type="button"
                        onClick={() => makePrimary(img)}
                        className="p-1 rounded bg-white/90 text-gray-700 hover:text-primary-600"
                        aria-label="Make main photo"
                        title="Make main photo"
                      >
                        <Star size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(img)}
                      className="p-1 rounded bg-white/90 text-gray-700 hover:text-red-600"
                      aria-label="Remove photo"
                      title="Remove photo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}

          {Array.from({ length: uploading }).map((_, i) => (
            <li key={`up-${i}`} className="aspect-square rounded-lg bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary-500" size={22} aria-label="Uploading" />
            </li>
          ))}

          {slotsLeft > uploading && (
            <li>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full aspect-square rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors"
              >
                <ImagePlus size={22} />
                Add photos
              </button>
            </li>
          )}
        </ul>
      )}

      <input
        ref={fileRef}
        type="file"
        multiple
        accept={PRODUCT_IMAGE_TYPES.join(',')}
        className="sr-only"
        tabIndex={-1}
        aria-label="Choose product photos"
        onChange={handleFiles}
      />

      {images.length === 0 && !isLoading && uploading === 0 && (
        <p className="text-xs text-gray-500">
          Listings with real photos get far more enquiries. Use clear, well-lit photos of the actual product.
        </p>
      )}
      {errors.length > 0 && (
        <ul role="alert" className="text-xs text-red-600 space-y-0.5">
          {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}
    </section>
  )
}
