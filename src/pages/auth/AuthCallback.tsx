import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { consumeOAuthIntent } from '@/lib/oauthIntent'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/ui'
import type { UserRole } from '@/types'

function homeFor(role: UserRole | undefined): string {
  if (role === 'admin') return '/admin'
  if (role === 'vendor') return '/vendor/dashboard'
  return '/'
}

/**
 * Landing route for OAuth redirects (/auth/callback).
 *
 * supabase-js parses the tokens/code from the URL on startup
 * (detectSessionInUrl), and getSession() waits for that to finish, so by the
 * time it resolves we either have a session or the provider returned an error.
 */
export function AuthCallback() {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()
  const [error, setError] = useState('')
  // React StrictMode runs effects twice in dev; the intent must be applied once.
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    async function complete() {
      // Provider errors (e.g. user cancelled consent) arrive in the query or hash
      const params = new URLSearchParams(
        window.location.search || window.location.hash.replace(/^#/, ''),
      )
      const providerError = params.get('error_description') ?? params.get('error')
      if (providerError) {
        consumeOAuthIntent()
        setError(providerError)
        return
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        consumeOAuthIntent()
        setError(sessionError?.message ?? 'Could not complete Google sign-in. Please try again.')
        return
      }

      const intent = consumeOAuthIntent()
      if (intent?.role === 'vendor') {
        // Server decides: only upgrades customer → vendor, never anything else.
        const { error: rpcError } = await supabase.rpc('claim_vendor_role')
        if (rpcError) console.error('claim_vendor_role failed:', rpcError.message)
      }

      const profile = await refreshProfile()
      navigate(homeFor(profile?.role), { replace: true })
    }

    void complete()
  }, [navigate, refreshProfile])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        {error ? (
          <>
            <h1 className="font-display text-lg font-semibold text-gray-900 mb-2">Sign-in failed</h1>
            <p className="text-sm text-red-700 mb-6" role="alert">{error}</p>
            <Link to="/signin" className="text-primary-600 font-medium hover:underline">
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <Spinner />
            <p className="text-sm text-gray-500 mt-4" aria-live="polite">Signing you in…</p>
          </>
        )}
      </div>
    </div>
  )
}
