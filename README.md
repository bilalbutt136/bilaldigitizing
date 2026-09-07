# B Digitizing Studio - Production Platform

A high-performance, full-stack digital digitizing and vector tracing platform built with Next.js 15 (App Router), Supabase (PostgreSQL, Realtime, Storage, SSR Auth), Stripe, BoltPayouts, Google Gemini AI, and Resend.

---

## 🚀 System Architecture Overview

- **Frontend**: Next.js 15 App Router with React 19, Tailwind CSS, Lucide icons, and server/client components.
- **Backend**: Next.js Route Handlers (`app/api/`) with strict server-side authentication (`@supabase/ssr` cookies & Bearer tokens).
- **Database & Storage**: Supabase PostgreSQL with Row Level Security (RLS), real-time publications (`supabase_realtime`), and Supabase Storage for artwork/machine files.
- **Payments**: 
  - Dual payment gateways: Stripe Checkout with webhooks & BoltPayouts (Crypto, CashApp, Apple Pay, Google Pay).
  - Studio Wallet ledger with atomic deposit/deduct transactions.
- **AI Automation**: Google Gemini multi-model fallback pipeline for automated 24/7 help desk replies and admin copy refinement.
- **Security & Hardening**:
  - In-memory token-bucket rate limiting on AI, email, and payment creation endpoints.
  - Server-Side Request Forgery (SSRF) protection on asset proxy endpoints.
  - Strict auth session isolation preventing unauthenticated enumeration of orders or private messages.
  - Full HTTP security response headers (`HSTS`, `X-XSS-Protection`, `X-Frame-Options`, `Permissions-Policy`, `X-Content-Type-Options`).

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 15.5+ (App Router) |
| **Language** | JavaScript (ESM, React 19) |
| **Database** | PostgreSQL via Supabase |
| **Auth** | Supabase SSR Auth, Google OAuth, Apple Sign-In |
| **Payments** | Stripe API, BoltPayouts API |
| **AI** | Google Gemini SDK (`@google/genai`) |
| **Email** | Resend API |
| **Storage** | Supabase Storage & Cloudinary CDN |
| **Testing** | Node.js Test Runner (`node:test`, `node:assert`) |
| **Linting** | Oxlint |

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js 18+ (Node 20+ recommended)
- Supabase project credentials (URL, Anon Key, Service Role Key)

### 2. Installation
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local` and populate the required credentials:
```bash
cp .env.example .env.local
```

Refer to `.env.example` for comprehensive documentation on each variable.

### 4. Running Database Migrations
Execute the migration runner to apply SQL migrations from `supabase/migrations/`:
```bash
npm run migrate
```

### 5. Running the Application
```bash
# Development server (Turbopack)
npm run dev

# Production build test
npm run build

# Start production server
npm start
```

---

## 🧪 Automated Testing & Quality Checks

Run the automated test suite (verifying state machine, SSRF validator, rate limiter, and formatters):
```bash
npm run test
```

Run Oxlint:
```bash
npm run lint
```

---

## 📡 Key API Routes & Health Check

- **Health Check**: `GET /api/health` — Returns application status, uptime, Supabase connection ping, and configured services.
- **Orders**: `GET /api/orders?action=fetchAll` & `POST /api/orders` — Authenticated order CRUD and tracking.
- **Messages & Chat**: `GET /api/messages` & `POST /api/messages` — Real-time live support and customer inbox.
- **Email & Order Notifications**: `POST /api/send-notification` — Automated webhook endpoint triggered by PostgreSQL triggers / Supabase webhooks for instant email alerts on new chat messages and orders.
- **Transactional Email Dispatch**: `POST /api/email` — Client and admin email routing with Resend fallback.
- **Custom Offers**: `POST /api/offers` — Admin offer dispatch & customer checkout acceptance.
- **Stripe Webhook**: `POST /api/checkout/webhook` — Secure Stripe event verification.
- **BoltPayouts Webhook**: `POST /api/boltpayouts/webhook` — Payout confirmation and wallet deposit.
- **AI Automation**: `POST /api/ai/generate-reply` & `POST /api/ai/refine-message`.
- **Download Proxy**: `GET /api/download?url=...` — SSRF-protected media file proxy.

---

## 📧 Automated Email Notification Pipeline

1. **Triggers (`trg_notify_new_message` & `trg_notify_new_order`)**:
   - PostgreSQL triggers automatically fire on `INSERT` events in `public.messages` and `public.orders`.
   - Dispatches an asynchronous non-blocking HTTP POST via `pg_net` to `/api/send-notification`.
2. **Security & Rate Limiting**:
   - Requests are verified using `x-webhook-secret` (`NOTIFICATION_WEBHOOK_SECRET`).
   - Anti-spam sliding window limiter and 2-minute chat message debounce prevent spam flooding.
3. **Responsive HTML Templates**:
   - Modern branded templates for Chat Message alerts (with direct link to in-app chat) and Order Notifications (dual: admin production ticket + client order receipt).
4. **Audit & Queue (`email_notification_logs`)**:
   - Every delivery attempt, resend ID, and transient error is logged to `public.email_notification_logs` and synced with `public.notifications`.

---

## 🚀 Production Launch Checklist

- [x] Environment variables configured on hosting provider (Vercel)
- [x] Database migrations synchronized in Supabase
- [x] Production build passes with 0 errors (`npm run build`)
- [x] Automated test suite passes (`npm run test`)
- [x] Security headers and rate limiting active
- [x] SSRF URL validation active
- [x] Health check endpoint operational (`/api/health`)
- [x] Zero mock data in codebase; live Supabase connection verified
- [x] Auto-commit and push to `main` branch