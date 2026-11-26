import type { UserRole } from '@/types'

/**
 * OAuth providers bounce the browser away from the app, so any choice the
 * user made before clicking "Continue with Google" (e.g. "I want to sell")
 * is lost unless we persist it. sessionStorage is scoped to the tab and
 * cleared when it closes, which is exactly the lifetime we need.
 *
 * This value is only a *request* — the database decides whether to honour it
 * (see the claim_vendor_role() RPC). Never trust it for authorization.
 */
export type SignupRole = Extract<UserRole, 'customer' | 'vendor'>

const KEY = 'enermo.oauth.intent'

export interface OAuthIntent {
  role: SignupRole
}

export function saveOAuthIntent(intent: OAuthIntent): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(intent))
  } catch {
    // Storage can be unavailable (private mode, quota). Falling back to the
    // default "customer" role is acceptable.
  }
}

/** Reads and clears the intent so it can only be applied once. */
export function consumeOAuthIntent(): OAuthIntent | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    sessionStorage.removeItem(KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'role' in parsed &&
      (parsed.role === 'customer' || parsed.role === 'vendor')
    ) {
      return { role: parsed.role }
    }
    return null
  } catch {
    return null
  }
}
