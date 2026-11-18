# KR Workspace — Frontend UI (`kr-erp-ui`)

Production-oriented, responsive web interface for **KR Workspace** internal ERP and CRM, built with Next.js 15 (App Router), React 19, Tailwind CSS v4, and Lucide icons.

---

## 1. Technical Stack

- **Framework:** [Next.js](https://nextjs.org/) 15.2+ (App Router)
- **UI Library:** [React](https://react.dev/) 19
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/postcss`)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Data Fetching:** Native fetch API with typed client wrapper & TanStack Query v5
- **Type Checking:** TypeScript 5+ (Strict mode)
- **Authentication:** `httpOnly` secure cookies with client `AuthProvider` context

---

## 2. Directory Structure

```text
kr-erp-ui/
├── app/
│   ├── (dashboard)/              # Authenticated AppShell layout group
│   │   ├── app/                  # Executive Dashboard (/app)
│   │   ├── clients/              # Client directory & client detail views
│   │   │   ├── [id]/page.tsx
│   │   │   └── page.tsx
│   │   ├── crm/
│   │   │   └── leads/            # Leads management & conversion
│   │   │       ├── [id]/page.tsx
│   │   │       ├── new/page.tsx
│   │   │       └── page.tsx
│   │   ├── finance/
│   │   │   └── invoices/         # Invoices, invoice builder, & printable view
│   │   │       ├── [id]/page.tsx
│   │   │       ├── new/page.tsx
│   │   │       └── page.tsx
│   │   ├── projects/             # Project tracking & worker assignments
│   │   │   ├── [id]/page.tsx
│   │   │   └── page.tsx
│   │   ├── profile/              # User profile & session credentials
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── company/          # Founder settings (Company, SMTP, Users, Templates)
│   │           └── page.tsx
│   ├── forgot-password/          # Password reset request page
│   ├── login/                    # Primary login page with demo role quick-fill
│   ├── reset-password/           # Signed JWT password reset page
│   ├── layout.tsx                # Root layout with Providers & metadata
│   ├── page.tsx                  # Root landing page (redirects to /app or /login)
│   └── globals.css               # Tailwind CSS v4 root stylesheet
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx          # Main layout container (desktop sidebar + topbar)
│   │   ├── MobileNav.tsx         # Slide-out drawer navigation for mobile screens
│   │   └── Sidebar.tsx           # Fixed 240px role-filtered sidebar
│   ├── shared/
│   │   ├── Providers.tsx         # QueryClientProvider & AuthProvider wrapper
│   │   └── RoleGate.tsx          # Conditional UI component for role access
│   └── ui/                       # Reusable UI primitives (Buttons, Badges, Inputs, Modals)
├── lib/
│   ├── api/
│   │   ├── client.ts             # Typed HTTP client with credentials: 'include'
│   │   └── endpoints.ts          # Backend API URL constants
│   ├── auth/
│   │   └── AuthContext.tsx       # AuthProvider, useAuth hook, route protection
│   ├── nav.ts                    # Single source of truth for navigation & roles
│   └── types/
│       └── index.ts              # Unified TypeScript interfaces
├── public/                       # Static brand assets (KR logo, icons)
├── .env.local                    # Environment configuration
├── next.config.mjs               # Next.js build configuration & rewrites
├── package.json                  # Dependencies & npm scripts
└── tsconfig.json                 # TypeScript compiler settings
```

---

## 3. Brand Identity & Design System

The application strictly adheres to the official **KR Web Solution** brand language:

- **Typography:** [Inter](https://fonts.google.com/specimen/Inter) font family exclusively.
- **Brand Colors:**
  - **KR Red:** `#FD322E` (Action buttons, active highlights, badges)
  - **KR Yellow:** `#FCDD59` (Role accents, secondary branding)
  - **KR Burgundy:** `#620C13` (Sidebar background, primary headers, invoice titles)
  - **Neutral Dark:** `#191919` / `#0F172A` (Headings and high-contrast text)
  - **Background Light:** `#F8F9FB` (Dashboard workspace canvas)
- **Spacing:** Strict 4px rhythm system (4px, 8px, 12px, 16px, 24px, 32px).
- **Navigation:**
  - Desktop: Fixed 240px left sidebar with collapsible branding and active indicators.
  - Mobile: Smooth backdrop-filtered drawer triggered via the topbar hamburger menu.

---

## 4. Screen Catalog & Features

### 1. Authentication
- **`/login`**: Clean branded login card. Includes quick-fill buttons for development testing (`Founder CEO`, `Worker`, `Client`).
- **`/forgot-password`**: Request link via email. In development, provides a one-click reset link on screen.
- **`/reset-password`**: Verifies 15-minute signed token from URL parameter and applies new password.

### 2. Executive Dashboard (`/app`)
- Single consolidated overview page.
- **4 Key Performance Indicators (KPIs):**
  - Running Projects count
  - Open Leads count (Founder only)
  - Unpaid Invoices total (formatted in Indian Rupees `₹`)
  - Overdue Invoices count
- **Recent Activity:** Displays the latest 5 records (Projects, Leads, Invoices) with direct links.

### 3. Projects (`/projects` & `/projects/[id]`)
- **Directory (`/projects`):** Filter by status (`All`, `Running`, `On Hold`, `Stopped`, `Completed`) and search query. Includes "+ New Project" modal for Founder CEO.
- **Detail (`/projects/[id]`):** Scope description, schedule, assigned worker chips, real-time status switcher, and linked invoices.
  - *Worker View:* The project budget (`budget_paise`) is automatically scrubbed and hidden.

### 4. Invoices & Billing (`/finance/invoices`, `/new`, `/[id]`)
- **List (`/finance/invoices`):** Filter by status (`All`, `Draft`, `Sent`, `Paid`, `Overdue`) and type (`Project`, `Maintenance`).
- **Builder (`/finance/invoices/new`):**
  - Dynamic Client and Project pickers.
  - Dynamic line items editor (Description, Quantity, Unit Rate in ₹, Auto-calculated Amount).
  - Live calculations for Subtotal, 18% GST component, and Net Total.
  - Generates atomic sequential invoice numbers.
- **Detail (`/finance/invoices/[id]`):**
  - High-fidelity tax invoice document preview.
  - "Download PDF" button (streams vector PDF directly from the backend).
  - "Send via Email" button (asynchronously dispatches email with attached PDF).
  - "Mark as Paid" button (records payment timestamp).

### 5. Sales Leads (`/crm/leads`, `/new`, `/[id]`)
- **List (`/crm/leads`):** Status tabs (`All`, `New`, `Contacted`, `Proposal`, `Won`, `Lost`), search, and intake date tracking.
- **Intake Form (`/crm/leads/new`):** Clean, validated form capturing opportunity title, company, contact details, acquisition source, and notes.
- **Detail (`/crm/leads/[id]`):** Shared conversation notes and a one-click **"Convert to Client & Project"** button that executes an atomic transaction and redirects to the newly created client.

### 6. Clients (`/clients` & `/clients/[id]`)
- **Directory (`/clients`):** Company name, primary contact person, email, phone, linked projects count, and linked invoices count. Includes "+ Add Client" modal.
- **Profile (`/clients/[id]`):** Detailed 360-degree account view with company metadata, GSTIN, linked projects, linked invoices, and shared client activity notes.

### 7. Settings (`/settings/company` — Founder Only)
Tabbed administration workspace:
1. **Company & Invoices:** Legal company name, registered address, GSTIN, invoice prefix, next sequence number, default tax rate, and bank/UPI coordinates.
2. **SMTP & Email Dispatch:** SMTP server host, port, username, password (encrypted at rest), STARTTLS toggle, and a live "Send Test Email" utility.
3. **User Management:** Invite people for any role (`admin`, `founder_ceo`, `worker`, `client`, `lead`) via set-password email. Staff must use `@krwebsolution.com`; clients/leads must not.
4. **Email Templates:** Live editor for transactional templates including `user_invite`, `password_reset`, invoice/payment notices.

---

## 5. Configuration & Environment Variables

Create `kr-erp-ui/.env.local`:

```env
# Empty = same-origin via Next rewrite
NEXT_PUBLIC_API_URL=
API_INTERNAL_URL=http://127.0.0.1:8000
```

Google / Microsoft OAuth client IDs are configured on the **API** only (`GOOGLE_CLIENT_ID`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_TENANT_ID`). The UI loads them from `GET /api/v1/auth/oauth-providers` (public IDs only — secrets never leave the API).

After login, incomplete profiles are gated at `/onboarding/profile` until required fields are filled.

---

## 6. Setup & Development Commands

### 1. Install Dependencies
```bash
cd kr-erp-ui
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Validate TypeScript Types
```bash
npx tsc --noEmit
```

### 4. Build for Production
```bash
npm run build
```

### 5. Run Production Server
```bash
npm run start
```
