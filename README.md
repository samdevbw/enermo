# Enermo — Clean Energy Marketplace (MVP)

A multi-vendor solar & clean energy marketplace for Botswana and Africa.

## Stack
- **Frontend:** Vite + React + TypeScript
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **Data Fetching:** TanStack Query (React Query)
- **Backend/Auth/DB:** Supabase
- **Forms:** React Hook Form + Zod
- **Icons:** lucide-react

## Project Structure

```
enermo/
├── public/
│   └── enermo-logo.svg
├── src/
│   ├── components/
│   │   ├── ui/               # Reusable UI primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── Modal.tsx
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── DashboardLayout.tsx
│   │   ├── products/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── ProductFilters.tsx
│   │   │   └── ProductForm.tsx
│   │   ├── vendors/
│   │   │   ├── VendorCard.tsx
│   │   │   └── VendorBadge.tsx
│   │   └── auth/
│   │       ├── AuthGuard.tsx
│   │       └── RoleGuard.tsx
│   ├── pages/
│   │   ├── public/
│   │   │   ├── Landing.tsx
│   │   │   ├── Marketplace.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   ├── Vendors.tsx
│   │   │   ├── VendorProfile.tsx
│   │   │   ├── About.tsx
│   │   │   └── Contact.tsx
│   │   ├── auth/
│   │   │   ├── SignIn.tsx
│   │   │   └── SignUp.tsx
│   │   ├── vendor/
│   │   │   ├── VendorDashboard.tsx
│   │   │   ├── VendorProducts.tsx
│   │   │   ├── VendorProductForm.tsx
│   │   │   ├── VendorOrders.tsx
│   │   │   └── VendorInquiries.tsx
│   │   ├── customer/
│   │   │   ├── CustomerDashboard.tsx
│   │   │   └── CustomerOrders.tsx
│   │   └── admin/
│   │       └── AdminDashboard.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProducts.ts
│   │   ├── useVendors.ts
│   │   └── useInquiries.ts
│   ├── services/
│   │   ├── products.ts
│   │   ├── vendors.ts
│   │   ├── inquiries.ts
│   │   └── orders.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── queryClient.ts
│   ├── types/
│   │   └── index.ts
│   ├── data/
│   │   └── sampleData.ts
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Setup

1. Clone the repo and install:
```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. Run SQL schema in Supabase SQL editor (see `schema.sql`)

4. Start dev server:
```bash
npm run dev
```
