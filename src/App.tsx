import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/queryClient'
import { AuthContext, useAuthProvider } from '@/hooks/useAuth'

// Layouts
import { PublicLayout } from '@/components/layout/PublicLayout'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

// Guards
import { AuthGuard, RoleGuard } from '@/components/auth/Guards'

// Public pages
import { Landing } from '@/pages/public/Landing'
import { Marketplace } from '@/pages/public/Marketplace'
import { ProductDetail } from '@/pages/public/ProductDetail'
import { Vendors, VendorProfile } from '@/pages/public/Vendors'
import { About, Contact } from '@/pages/public/StaticPages'

// Auth pages
import { SignIn, SignUp } from '@/pages/auth/Auth'

// Vendor pages
import {
  VendorDashboard,
  VendorProducts,
  VendorInquiries,
  VendorOrders,
} from '@/pages/vendor/VendorPages'

// Customer + Admin
import { CustomerDashboard, AdminDashboard } from '@/pages/customer/CustomerPages'

// ============================================================
// Auth Provider wrapper
// ============================================================
function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

// ============================================================
// App
// ============================================================
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter    future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}>
      
          <Routes>
            {/* ---- Public routes ---- */}
            <Route element={<PublicLayout />}>
              <Route index element={<Landing />} />
              <Route path="marketplace" element={<Marketplace />} />
              <Route path="product/:slug" element={<ProductDetail />} />
              <Route path="vendors" element={<Vendors />} />
              <Route path="vendors/:id" element={<VendorProfile />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
            </Route>

            {/* ---- Auth routes (no layout wrapper) ---- */}
            <Route path="signin" element={<SignIn />} />
            <Route path="signup" element={<SignUp />} />

            {/* ---- Customer routes ---- */}
            <Route element={<AuthGuard />}>
              <Route element={<DashboardLayout />}>
                <Route path="dashboard" element={<CustomerDashboard />} />
                <Route path="orders" element={<CustomerDashboard />} />
                <Route path="settings" element={<div className="p-4"><h1 className="font-display text-xl font-bold">Settings — Coming Soon</h1></div>} />
              </Route>
            </Route>

            {/* ---- Vendor routes ---- */}
            <Route element={<RoleGuard roles={['vendor', 'admin']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="vendor/dashboard" element={<VendorDashboard />} />
                <Route path="vendor/products" element={<VendorProducts />} />
                <Route path="vendor/inquiries" element={<VendorInquiries />} />
                <Route path="vendor/orders" element={<VendorOrders />} />
                <Route path="vendor/settings" element={<div className="p-4"><h1 className="font-display text-xl font-bold">Vendor Settings — Coming Soon</h1></div>} />
              </Route>
            </Route>

            {/* ---- Admin routes ---- */}
            <Route element={<RoleGuard roles={['admin']} />}>
              <Route element={<DashboardLayout />}>
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="admin/vendors" element={<div className="p-4"><h1 className="font-display text-xl font-bold">Vendor Management</h1></div>} />
                <Route path="admin/products" element={<div className="p-4"><h1 className="font-display text-xl font-bold">Product Moderation</h1></div>} />
                <Route path="admin/orders" element={<div className="p-4"><h1 className="font-display text-xl font-bold">All Orders</h1></div>} />
              </Route>
            </Route>

            {/* 404 fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
