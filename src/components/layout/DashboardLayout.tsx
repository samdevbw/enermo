import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Sun, LayoutDashboard, Package, MessageSquare, ShoppingCart,
  Settings, LogOut, Menu, ChevronRight  } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
}

const vendorNav: NavItem[] = [
  { to: '/vendor/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/vendor/products', icon: <Package size={18} />, label: 'Products' },
  { to: '/vendor/inquiries', icon: <MessageSquare size={18} />, label: 'Inquiries' },
  { to: '/vendor/orders', icon: <ShoppingCart size={18} />, label: 'Orders' },
  { to: '/vendor/settings', icon: <Settings size={18} />, label: 'Settings' },
]

const customerNav: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Overview' },
  { to: '/orders', icon: <ShoppingCart size={18} />, label: 'My Orders' },
  { to: '/settings', icon: <Settings size={18} />, label: 'Settings' },
]

const adminNav: NavItem[] = [
  { to: '/admin', icon: <LayoutDashboard size={18} />, label: 'Overview' },
  { to: '/admin/vendors', icon: <Package size={18} />, label: 'Vendors' },
  { to: '/admin/products', icon: <Package size={18} />, label: 'Products' },
  { to: '/admin/orders', icon: <ShoppingCart size={18} />, label: 'Orders' },
]

export function DashboardLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems =
    profile?.role === 'vendor'
      ? vendorNav
      : profile?.role === 'admin'
      ? adminNav
      : customerNav

  const roleLabel =
    profile?.role === 'vendor' ? 'Vendor Portal' :
    profile?.role === 'admin' ? 'Admin Panel' : 'My Account'

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <NavLink to="/" className="flex items-center gap-2 font-display font-bold text-lg text-gray-900">
          <div className="w-8 h-8 bg-primary-400 rounded-lg flex items-center justify-center">
            <Sun size={16} className="text-white" />
          </div>
          Ener<span className="text-primary-500">mo</span>
        </NavLink>
        <p className="text-xs text-gray-500 mt-1 ml-10">{roleLabel}</p>
      </div>

      {/* Profile pill */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-gray-50">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm">
            {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{profile?.full_name}</p>
            <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.endsWith('dashboard') || item.to === '/admin' || item.to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
            onClick={() => setSidebarOpen(false)}
          >
            {item.icon}
            {item.label}
            {false && <ChevronRight size={14} className="ml-auto" />}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-white shadow-xl flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-gray-100 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-gray-500">
            <Menu size={20} />
          </button>
          <span className="font-display font-bold text-gray-900">
            Ener<span className="text-primary-500">mo</span>
          </span>
          <div className="w-9" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
