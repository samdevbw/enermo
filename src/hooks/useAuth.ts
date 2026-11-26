import { useState, useEffect, createContext, useContext } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { saveOAuthIntent, type SignupRole } from '@/lib/oauthIntent'
import type { Profile, UserRole } from '@/types'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>
  /** Redirects the browser to Google. Resolves only if the redirect fails to start. */
  signInWithGoogle: (role?: SignupRole) => Promise<void>
  /** Emails a password-reset link that opens /reset-password. */
  requestPasswordReset: (email: string) => Promise<void>
  /** Sets a new password for the signed-in (or recovering) user. */
  updatePassword: (password: string) => Promise<void>
  /** Re-fetch the profile, e.g. after a server-side role change. */
  refreshProfile: () => Promise<Profile | null>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function useAuth() {
  return useContext(AuthContext)
}

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId: string): Promise<Profile | null> {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    const next = data as Profile | null
    setProfile(next)
    return next
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email: string, password: string, fullName: string, role: UserRole) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    })
    if (error) throw error
  }

  async function signInWithGoogle(role: SignupRole = 'customer') {
    saveOAuthIntent({ role })
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Must be listed under Supabase → Auth → URL Configuration → Redirect URLs
        redirectTo: `${window.location.origin}/auth/callback`,
        // Always show the account chooser — users often have work + personal Google accounts
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) throw error
  }

  async function requestPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Must be listed under Supabase → Auth → URL Configuration → Redirect URLs
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }

  async function refreshProfile() {
    const { data: { user: current } } = await supabase.auth.getUser()
    if (!current) {
      setProfile(null)
      return null
    }
    return loadProfile(current.id)
  }

const signOut = async () => {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Sign out error:', error.message)
    throw error
  }
  setUser(null)
  setSession(null)
  setProfile(null)
}

  return { user, session, profile, loading, signIn, signUp, signInWithGoogle, requestPasswordReset, updatePassword, refreshProfile, signOut }
}
