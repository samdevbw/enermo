import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button, Input, Spinner } from '@/components/ui'
import { AuthShell, FormAlert } from '@/components/auth/AuthShell'

// ============================================================
// Forgot password — request a reset email
// ============================================================
const forgotSchema = z.object({
  email: z.string().trim().email('Valid email required'),
})
type ForgotForm = z.infer<typeof forgotSchema>

export function ForgotPassword() {
  const { requestPasswordReset } = useAuth()
  const [sentTo, setSentTo] = useState('')
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  })

  async function onSubmit({ email }: ForgotForm) {
    try {
      setError('')
      await requestPasswordReset(email)
      setSentTo(email)
    } catch (e: unknown) {
      // Rate limiting is the usual cause ("For security purposes, you can only request this after N seconds")
      setError(e instanceof Error ? e.message : 'Could not send reset email')
    }
  }

  return (
    <AuthShell subtitle="Reset your password">
      {sentTo ? (
        // Same message whether or not the account exists, so the form can't be
        // used to discover which emails are registered.
        <FormAlert tone="success">
          If an account exists for <strong>{sentTo}</strong>, you'll receive an email with a link to
          reset your password. Check your spam folder if it doesn't arrive within a few minutes.
        </FormAlert>
      ) : (
        <>
          {error && <FormAlert tone="error">{error}</FormAlert>}
          <p className="text-sm text-gray-500 mb-4">
            Enter the email you signed up with and we'll send you a reset link.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
              Send reset link
            </Button>
          </form>
        </>
      )}
      <p className="text-center text-sm text-gray-500 mt-5">
        Remembered it?{' '}
        <Link to="/signin" className="text-primary-600 font-medium hover:underline">Back to sign in</Link>
      </p>
    </AuthShell>
  )
}

// ============================================================
// Reset password — landing page from the email link
// ============================================================
const resetSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: 'Passwords do not match', path: ['confirm'] })
type ResetForm = z.infer<typeof resetSchema>

type LinkState = 'checking' | 'valid' | 'invalid'

export function ResetPassword() {
  const { updatePassword, profile } = useAuth()
  const navigate = useNavigate()
  const [linkState, setLinkState] = useState<LinkState>('checking')
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  })

  // The email link signs the user in with a short-lived recovery session.
  // supabase-js reads it from the URL on load; getSession() waits for that.
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, '') || window.location.search)
    if (params.get('error')) {
      setLinkState('invalid')
      return
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLinkState(session ? 'valid' : 'invalid')
    })
  }, [])

  async function onSubmit({ password }: ResetForm) {
    try {
      setError('')
      await updatePassword(password)
      navigate(profile?.role === 'vendor' ? '/vendor/dashboard' : '/', { replace: true })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not update password')
    }
  }

  return (
    <AuthShell subtitle="Choose a new password">
      {linkState === 'checking' && <Spinner />}

      {linkState === 'invalid' && (
        <>
          <FormAlert tone="error">
            This reset link is invalid or has expired. Links can only be used once and expire after an hour.
          </FormAlert>
          <Link to="/forgot-password">
            <Button fullWidth size="lg">Request a new link</Button>
          </Link>
        </>
      )}

      {linkState === 'valid' && (
        <>
          {error && <FormAlert tone="error">{error}</FormAlert>}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              hint="At least 8 characters"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              error={errors.confirm?.message}
              {...register('confirm')}
            />
            <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
              Update password
            </Button>
          </form>
        </>
      )}
    </AuthShell>
  )
}
