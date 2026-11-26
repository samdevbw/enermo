import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Sun } from 'lucide-react'

interface AuthShellProps {
  subtitle: string
  children: ReactNode
}

/** Centered logo + card layout shared by the standalone auth pages. */
export function AuthShell({ subtitle, children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-display font-bold text-2xl text-gray-900 mb-2">
            <div className="w-9 h-9 bg-primary-400 rounded-xl flex items-center justify-center">
              <Sun size={18} className="text-white" />
            </div>
            <span>Ener<span className="text-primary-500">mo</span></span>
          </Link>
          <p className="text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">{children}</div>
      </div>
    </div>
  )
}

export function FormAlert({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  const styles =
    tone === 'error'
      ? 'bg-red-50 border-red-200 text-red-700'
      : 'bg-forest-50 border-forest-200 text-forest-800'
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`mb-4 px-4 py-3 rounded-lg border text-sm ${styles}`}>
      {children}
    </div>
  )
}
