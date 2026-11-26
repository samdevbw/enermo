import { supabase } from '@/lib/supabase'

export interface ContactMessageInput {
  name: string
  email: string
  subject: string
  message: string
}

/**
 * Saves a contact-form submission. Messages are readable only by admins
 * (RLS), so we don't `.select()` the inserted row back — that would fail for
 * anonymous visitors.
 */
export async function submitContactMessage(
  input: ContactMessageInput,
  userId: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('contact_messages')
    .insert({ ...input, user_id: userId })

  if (error) throw error
}
