# Digital Bazar - Select Before You Arrive

> **Avoid the crowd. Select your products before you arrive. We prepare while you travel.**

A complete production-style local commerce platform where customers browse real shop catalogs, place orders, and receive notifications when orders are ready for pickup.

## 🌟 Core Features

### Customer Experience
- **Shop Discovery**: Find nearby shops by category, rating, distance, open status
- **Real Catalog**: Browse actual shop inventory with live stock
- **Smart Search**: Keyword + AI semantic search ("waterproof outdoor paint")
- **Cart & Orders**: Persistent cart, immutable order snapshots, real-time tracking
- **QR Pickup**: Secure QR token verification at shop counter
- **AI Assistant**: "Mujhe 2 bathroom ke liye plumbing material chahiye" → structured shopping list
- **Voice Shopping**: "Mujhe 500 bricks aur 10 cement chahiye" → cart
- **Image Search**: Upload product photo → vision AI → matching products

### Shopkeeper Dashboard
- **Real-time Orders**: Instant notification when order arrives
- **Auto Zone Sorting**: CORE FEATURE - Orders automatically sorted by storage zones
  - Example: Cement ×10 + Bricks ×500 + PVC Pipe ×20 → Zone A (Building), Zone B (Plumbing)
- **Picking Workflow**: Check items as collected, progress tracking
- **Inventory**: Real stock with reserved/sold tracking, transaction-safe operations
- **Low Stock Prediction**: "May run out in 4 days at current sales rate"
- **Business Assistant**: "Which products sold most this month?" → actual DB queries
- **Employee Management**: Role-based permissions (picker, inventory_manager, etc.)

### Admin Panel
- Shop approval workflow (PENDING_REVIEW → APPROVED)
- User management, order oversight, platform analytics
- Commission configuration, audit logs

### Payments
- Razorpay integration (test + production architecture)
- Server-side order creation, signature verification, webhook handling, idempotency
- Pay at store + online (UPI, Card, NetBanking)

### Billing
- GST-compliant invoices with HSN, GSTIN
- PDF generation, configurable tax

## 🏗️ Architecture

```
Frontend (Next.js App Router) 
  ↓ API Layer (server-side validation, RBAC)
  ↓ Business Logic (inventory, orders, payments, AI)
  ↓ Database (Prisma + SQLite/Postgres) + Realtime (SSE)
  ↓ External Providers (Razorpay, OpenAI, Maps, Email/SMS)
```

### Tech Stack
- **Frontend**: Next.js 14, TypeScript, CSS Variables, Lucide Icons, TanStack Query
- **Backend**: Next.js API Routes, Prisma ORM, JWT auth (httpOnly cookies)
- **Database**: SQLite (dev) / Postgres (prod) - 30+ models with relations, indexes, constraints
- **AI**: OpenAI SDK (gpt-4o-mini, vision), permission-aware tools, RAG with embeddings
- **Payments**: Razorpay with mock for dev
- **Realtime**: Server-Sent Events (polling fallback, ready for WebSockets)
- **Security**: RBAC, Zod validation, audit logs, webhook verification, rate limiting ready

## 📦 Database Models (Key)

```
users, profiles, shops, shop_members, categories, storage_zones,
products, product_variants, product_images, inventory, inventory_transactions,
addresses, carts, cart_items, orders, order_items, order_status_history,
payments, payment_events, invoices, notifications, favorites, reviews,
support_tickets, commissions, promotions, audit_logs, ai_conversations,
ai_messages, ai_tool_calls, forecasts, platform_settings
```

### Order State Machine
```
PENDING → ACCEPTED → PREPARING → READY_FOR_PICKUP → COMPLETED
  ↓         ↓           ↓
REJECTED  CANCELLED   PARTIALLY_READY → READY_FOR_PICKUP
```

Valid transitions enforced server-side.

## 🚀 Quick Start

### 1. Install
```bash
npm install
```

### 2. Env Setup
```bash
cp .env.example .env
# Edit DATABASE_URL, JWT_SECRET, etc.
```

### 3. Database
```bash
npm run db:push
npm run db:seed
```

### 4. Run
```bash
npm run dev
# Open http://localhost:3000
```

## 🔑 Demo Credentials

```
Customer: 9876543210 / password123
Shop Owner: owner@ganesh.com / owner123
Employee: 9876543212 / password123
Admin: admin@digitalbazar.com / admin123
OTP Test Code: 123456 (when OTP_ENABLED=true)
```

## 🧪 Test Flows

### Customer Flow
1. Login → Find shop → Browse products → Add to cart → Place order
2. Track order realtime (SSE) → Receive Ready notification → Show QR at shop

### Shopkeeper Flow
1. Login → Receive realtime new order alert → Accept → View auto-sorted pick list by zones
2. Pick items (checklist) → Mark Ready → Customer notified → Scan QR → Complete → Inventory updated → Invoice generated

### Admin Flow
1. Login → Review pending shops → Approve → Shop becomes discoverable

## 🤖 AI Features

### 1. Smart Shopping Assistant
- Input: "Mujhe 2 bathroom ke liye plumbing material chahiye"
- Output: Structured list with quantities, clarifying questions if needed
- Never invents prices, matches actual catalog when shopId provided

### 2. Natural Language Search
- "waterproof outdoor wall paint" → category=paint, feature=waterproof, use_case=outdoor
- Queries actual product DB

### 3. Product Categorization
- "Astral CPVC Elbow 1 inch" → Category: Plumbing, Sub: CPVC Fittings, Size: 1 inch

### 4. Image Search
- Upload photo → Vision model → Attributes → Search catalog → Confidence score

### 5. Voice Shopping
- Web Speech API → Intent extraction → Cart draft → User confirmation

### 6. Business Assistant
- Tool-based: search_products, get_low_stock, get_shop_sales, etc.
- Permission-aware, audited

### 7. Forecasting
- Baseline model: recent sales + avg daily → "May run out in 4 days"
- Falls back to threshold when insufficient data

All AI respects RBAC, never exposes secrets to frontend, logs tool calls.

## 🔒 Security

- JWT in httpOnly cookies, bcrypt passwords
- Role-based access: customer, shop_owner, shop_employee, admin, super_admin
- Row-level checks: shopkeeper can never access another shop's data
- Zod validation client + server
- Audit logs for critical actions
- Razorpay signature verification, webhook idempotency
- File upload validation (type, size)
- No secrets in client bundles

## 📱 PWA

- manifest.json, responsive mobile-first, bottom navigation
- Installable, offline cart preservation

## 📄 Documentation

- `docs/ARCHITECTURE.md` - System design
- `docs/DATABASE.md` - Schema & relations
- `docs/API.md` - API endpoints
- `docs/AI.md` - AI tools & prompts
- `docs/DEPLOYMENT.md` - Vercel + Supabase guide

## 🌍 Deployment

- Frontend: Vercel
- DB: Supabase Postgres (change DATABASE_URL)
- Env vars: Set in Vercel dashboard
- Build: `npm run build` runs prisma generate

## 🧩 Project Structure

```
app/
  (customer)/, shopkeeper/, admin/, api/, auth/
components/
  customer/, shopkeeper/, admin/, common/
lib/
  auth/, db/, payments/, notifications/, ai/, inventory/, validation/, utils/
styles/
  globals.css, variables.css, layout.css, forms.css, tables.css, components.css
scripts/
  seed.ts
```

## ✅ Acceptance Criteria - Verified

- [x] Customer: Register → OTP → Set location → Find shop → Search → Product → Cart → Order → Realtime tracking → QR → Pay → Invoice
- [x] Shopkeeper: Realtime order → Accept → Inventory reserved → Auto zone-sorted pick list → Pick → Ready → Scan QR → Complete → Inventory updated → Bill
- [x] Admin: Login → Review shop → Approve → Shop public
- [x] Real DB persistence, no fake data in production paths
- [x] Secure auth, payments, QR verification
- [x] AI grounded in actual DB, permission-aware

## 📝 License

MIT - Built as production-ready demo for local commerce.

---

**Tagline: Select Before You Arrive.**
