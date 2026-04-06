import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sun } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button, Input } from '@/components/ui'
import type { UserRole } from '@/types'

// ============================================================
// Sign In
// ============================================================
const signInSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type SignInForm = z.infer<typeof signInSchema>

export function SignIn() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
  })

  async function onSubmit(data: SignInForm) {
    try {
      setError('')
      await signIn(data.email, data.password)
      navigate('/')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Sign in failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-display font-bold text-2xl text-gray-900 mb-2">
            <div className="w-9 h-9 bg-primary-400 rounded-xl flex items-center justify-center">
              <Sun size={18} className="text-white" />
            </div>
            Ener<span className="text-primary-500">mo</span>
          </Link>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-600 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Sign Up
// ============================================================
const signUpSchema = z.object({
  full_name: z.string().min(2, 'Full name required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['customer', 'vendor']),
})

type SignUpForm = z.infer<typeof signUpSchema>

export function SignUp() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')

  const defaultRole = (searchParams.get('role') === 'vendor' ? 'vendor' : 'customer') as UserRole

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { role: defaultRole as "customer" | "vendor"},
  })

  const selectedRole = watch('role')

  async function onSubmit(data: SignUpForm) {
    try {
      setError('')
      await signUp(data.email, data.password, data.full_name, data.role)
      // Redirect based on role
      navigate(data.role === 'vendor' ? '/vendor/dashboard' : '/')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Sign up failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-display font-bold text-2xl text-gray-900 mb-2">
            <div className="w-9 h-9 bg-primary-400 rounded-xl flex items-center justify-center">
              <Sun size={18} className="text-white" />
            </div>
            Ener<span className="text-primary-500">mo</span>
          </Link>
          <p className="text-gray-500 mt-1">Create your Enermo account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Role selector */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">I want to...</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'customer', label: '🛒 Buy Products', desc: 'Browse and purchase solar solutions' },
                { value: 'vendor', label: '📦 Sell Products', desc: 'List and sell your energy products' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`
                    relative flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-colors
                    ${selectedRole === opt.value
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <input
                    type="radio"
                    value={opt.value}
                    className="sr-only"
                    {...register('role')}
                  />
                  <span className="text-sm font-semibold text-gray-800">{opt.label}</span>
                  <span className="text-xs text-gray-500 mt-0.5">{opt.desc}</span>
                </label>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="Kefilwe Mokoena"
              error={errors.full_name?.message}
              {...register('full_name')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              hint="At least 8 characters"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/signin" className="text-primary-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
