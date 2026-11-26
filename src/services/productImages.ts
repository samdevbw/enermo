// ============================================================
// PRODUCT PHOTOS SERVICE — vendor uploads (bucket: product-images)
// ============================================================
import { supabase } from '@/lib/supabase'
import type { ProductImage } from '@/types'

const BUCKET = 'product-images'

// Keep in sync with migration 007
export const PRODUCT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const MAX_PRODUCT_PHOTOS = 8
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const MAX_EDGE_PX = 1600 // plenty for a 4:3 card and the detail page

export async function fetchProductImages(productId: string): Promise<ProductImage[]> {
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as ProductImage[]
}

/**
 * Phone photos are often 4–12 MB. Shrinking to 1600px WebP before upload
 * keeps listings fast on mobile data and under the bucket's 5 MB limit.
 * Falls back to the original file if the browser can't decode it.
 */
async function shrinkImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size <= 1024 * 1024) {
      bitmap.close()
      return file // already small — keep original quality
    }
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', 0.85))
    return blob ?? file
  } catch {
    return file
  }
}

export function validateProductPhoto(file: File): string | null {
  if (!(PRODUCT_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return `${file.name}: please use JPG, PNG or WebP.`
  }
  return null
}

export async function uploadProductPhoto(params: {
  userId: string
  productId: string
  file: File
  alt: string
  isPrimary: boolean
  sortOrder: number
}): Promise<ProductImage> {
  const { userId, productId, file, alt, isPrimary, sortOrder } = params
  const problem = validateProductPhoto(file)
  if (problem) throw new Error(problem)

  const blob = await shrinkImage(file)
  if (blob.size > MAX_UPLOAD_BYTES) throw new Error(`${file.name}: image is too large (max 5 MB).`)

  const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg'
  // Folder = user id: required by storage RLS
  const path = `${userId}/${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: blob.type || file.type, cacheControl: '31536000' })
  if (uploadError) throw uploadError

  const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  const { data, error } = await supabase
    .from('product_images')
    .insert({ product_id: productId, url, alt, is_primary: isPrimary, sort_order: sortOrder })
    .select()
    .single()

  if (error) {
    // Don't leave an orphaned file if the DB row failed
    await supabase.storage.from(BUCKET).remove([path])
    throw error
  }
  return data as ProductImage
}

/** Our own uploads live in this bucket; older listings may use external URLs. */
function storagePathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const i = url.indexOf(marker)
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length))
}

export async function deleteProductPhoto(image: ProductImage): Promise<void> {
  const { error } = await supabase.from('product_images').delete().eq('id', image.id)
  if (error) throw error
  const path = storagePathFromUrl(image.url)
  if (path) {
    // Best effort: a leftover file is harmless, a failed row delete is not
    const { error: rmError } = await supabase.storage.from(BUCKET).remove([path])
    if (rmError) console.warn('Could not remove photo file:', rmError.message)
  }
}

export async function setPrimaryPhoto(productId: string, imageId: string): Promise<void> {
  const { error: clearError } = await supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId)
    .neq('id', imageId)
  if (clearError) throw clearError

  const { error } = await supabase.from('product_images').update({ is_primary: true }).eq('id', imageId)
  if (error) throw error
}
