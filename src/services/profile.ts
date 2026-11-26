import { supabase } from '@/lib/supabase'

const BUCKET = 'profile-images'

// Keep in sync with the bucket limits in migration 004
export const IMAGE_MAX_BYTES = 2 * 1024 * 1024
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export interface ProfileUpdate {
  full_name: string
  phone: string | null
  avatar_url: string | null
}

export async function updateProfile(userId: string, update: ProfileUpdate): Promise<void> {
  // Never include `role` here — it's locked by a DB trigger (migration 003)
  const { error } = await supabase.from('profiles').update(update).eq('id', userId)
  if (error) throw error
}

/** Returns a user-facing problem with the file, or null if it's acceptable. */
export function validateImage(file: File): string | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return 'Please choose a JPG, PNG or WebP image.'
  if (file.size > IMAGE_MAX_BYTES) return 'Image must be 2 MB or smaller.'
  return null
}

/**
 * Uploads to profile-images/{userId}/{kind}-{timestamp}.{ext} and returns the public URL.
 * The folder must be the user's id — storage RLS rejects anything else.
 * A new filename each time avoids browsers/CDNs showing a cached old image.
 */
export async function uploadProfileImage(
  userId: string,
  file: File,
  kind: 'avatar' | 'logo',
): Promise<string> {
  const problem = validateImage(file)
  if (problem) throw new Error(problem)

  const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1]
  const path = `${userId}/${kind}-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: '31536000' })
  if (error) throw error

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}
