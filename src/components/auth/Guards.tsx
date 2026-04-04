import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/ui'
import type { UserRole } from '@/types'

// ============================================================
// AuthGuard — requires any authenticated user
// ============================================================
export function AuthGuard() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/signin" replace />
  return <Outlet />
}

// ============================================================
// RoleGuard — requires specific role(s)
// ============================================================
interface RoleGuardProps {
  roles: UserRole[]
}

export function RoleGuard({ roles }: RoleGuardProps) {
  const { user, profile, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/signin" replace />
  if (!profile || !roles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
