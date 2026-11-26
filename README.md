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

## Google Sign-In

Google login uses Supabase Auth's OAuth provider. Both `/signin` and `/signup` show a
**Continue with Google** button; after Google, users land on `/auth/callback`, which
finishes the session and routes them by role.

### One-time setup

1. **Database** — run `supabase/migrations/003_google_oauth_and_role_hardening.sql` in the
   Supabase SQL Editor. It maps Google name/photo into `profiles`, adds the
   `claim_vendor_role()` RPC used when someone picks "Sell Products" and signs up with
   Google, and blocks clients from changing their own `profiles.role`.
2. **Google Cloud Console** → APIs & Services → Credentials → *Create OAuth client ID*
   (type: Web application)
   - Authorized JavaScript origins: `https://enermo.co.bw`, `http://localhost:5173`
   - Authorized redirect URI: `https://dqrcsaxqiezfflgxokqc.supabase.co/auth/v1/callback`
   - OAuth consent screen: app name *Enermo*, support email, authorized domain `enermo.co.bw`;
     scopes `email`, `profile`, `openid`. Publish the app (otherwise only test users can log in).
3. **Supabase** → Authentication → Sign In / Providers → **Google**: enable it and paste the
   Client ID and Client Secret.
4. **Supabase** → Authentication → URL Configuration
   - Site URL: `https://enermo.co.bw`
   - Redirect URLs: `https://enermo.co.bw/auth/callback`, `http://localhost:5173/auth/callback`
     (add Netlify preview URLs too if you test there, e.g. `https://*--enermo.netlify.app/auth/callback`)

No new environment variables are needed — the Google secret lives in Supabase, never in the frontend.

### Notes
- If a Google account's email matches an existing email/password user, Supabase links them
  automatically (Google emails are verified).
- `public/_redirects` already rewrites all paths to `index.html`, so `/auth/callback` works on Netlify.
