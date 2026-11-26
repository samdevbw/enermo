import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { SignupRole } from '@/lib/oauthIntent'

interface GoogleSignInButtonProps {
  /** Role to request if this Google sign-in creates a new account. */
  role?: SignupRole
  label?: string
  onError?: (message: string) => void
}

export function GoogleSignInButton({
  role = 'customer',
  label = 'Continue with Google',
  onError,
}: GoogleSignInButtonProps) {
  const { signInWithGoogle } = useAuth()
  const [redirecting, setRedirecting] = useState(false)

  async function handleClick() {
    try {
      setRedirecting(true)
      await signInWithGoogle(role)
      // On success the browser navigates away, so we intentionally leave
      // the button in its loading state.
    } catch (e: unknown) {
      setRedirecting(false)
      onError?.(e instanceof Error ? e.message : 'Google sign-in failed')
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={redirecting}
      aria-busy={redirecting}
      className="w-full inline-flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 shadow-sm transition-colors duration-150 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <GoogleLogo />
      {redirecting ? 'Redirecting to Google…' : label}
    </button>
  )
}

export function AuthDivider() {
  return (
    <div className="relative my-6" role="separator">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-3 text-xs uppercase tracking-wide text-gray-400">or</span>
      </div>
    </div>
  )
}

// Google's standard multi-colour "G" mark (per Google sign-in branding guidelines)
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}
