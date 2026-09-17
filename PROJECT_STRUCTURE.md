# Project Structure - Digital Bazar

```
digital-bazar/
├── app/
│   ├── layout.tsx (root layout with design system)
│   ├── page.tsx (landing - hero, categories, nearby shops, benefits)
│   ├── auth/
│   │   ├── login/page.tsx (password + OTP 123456)
│   │   └── register/page.tsx (customer/shop_owner)
│   ├── shops/
│   │   ├── page.tsx (shop discovery with filters)
│   │   └── [id]/page.tsx (shop profile + catalog + zones)
│   ├── products/
│   │   └── [id]/page.tsx (product detail + related)
│   ├── cart/page.tsx (persistent cart, totals, place order)
│   ├── orders/
│   │   ├── page.tsx (order history with status filter)
│   │   └── [id]/page.tsx (tracking timeline + QR + zone-sorted)
│   ├── search/page.tsx (keyword + AI semantic + voice + image)
│   ├── ai/page.tsx (AI shopping assistant - Hinglish)
│   ├── profile/page.tsx (user profile + role links)
│   ├── favorites/page.tsx (regular items, fav shops/products)
│   ├── notifications/page.tsx (order notifications)
│   ├── customer/
│   │   └── onboarding/page.tsx (location, language en/hi/mr, categories)
│   ├── shopkeeper/
│   │   ├── layout.tsx (sidebar nav, RBAC)
│   │   ├── page.tsx (dashboard - today's orders, sales, AI assistant)
│   │   ├── orders/
│   │   │   ├── page.tsx (queue NEW/ACCEPTED/PREPARING/READY/COMPLETED)
│   │   │   └── [id]/page.tsx (pick list auto zone-sorted + QR verify)
│   │   ├── products/page.tsx (CRUD + AI categorize)
│   │   ├── inventory/page.tsx (stock, reserved, forecast ~4 days)
│   │   ├── zones/page.tsx (storage zones A-E + auto sorting explanation)
│   │   ├── analytics/page.tsx (sales trend + demand forecasting)
│   │   ├── customers/page.tsx (customer aggregation)
│   │   ├── billing/page.tsx (invoices GSTIN/HSN)
│   │   ├── promotions/page.tsx (promotion engine)
│   │   ├── pick-lists/page.tsx (mobile optimized picker mode)
│   │   ├── employees/page.tsx (granular permissions)
│   │   └── settings/page.tsx (shop settings)
│   └── admin/
│       ├── layout.tsx (admin nav)
│       ├── page.tsx (platform overview)
│       ├── shops/page.tsx (approval PENDING_REVIEW→APPROVED)
│       ├── users/page.tsx (user management)
│       ├── orders/page.tsx (all orders)
│       ├── products/page.tsx (platform products)
│       ├── payments/page.tsx (revenue + commission)
│       ├── settings/page.tsx (commission + feature flags)
│       └── system-health/page.tsx (API/DB/payment/notification/realtime/AI health)
│   └── api/
│       ├── auth/ (register, login, otp, me, logout)
│       ├── shops/ (list with distance, create with auto zones, detail)
│       ├── products/ (search, create, detail, related)
│       ├── cart/ (get, add with inventory check, update, delete)
│       ├── orders/ (list RBAC, create with reserve+snapshot, detail with zone sort, status with canTransition, verify QR)
│       ├── payments/ (create Razorpay server-side, verify HMAC, webhook with signature)
│       ├── ai/ (assistant shopping list + business, search natural language, categorize, vision)
│       ├── realtime/ (SSE for orders)
│       └── admin/ (shops approval)
├── components/
│   ├── common/ Logo, Header, BottomNav
│   ├── customer/ ShopCard, ProductCard
│   ├── shopkeeper/ OrderPickList (checkbox + progress)
│   ├── billing/ Invoice (GST invoice)
│   └── ... (Button, Input, Card, Badge, Table reusable via CSS)
├── lib/
│   ├── auth/ jwt (hash, sign, verify, OTP, orderNumber, QR token, invoiceNumber), session (getSession, requireAuth)
│   ├── db/ prisma client
│   ├── validation/ schemas (Zod) + validTransitions map
│   ├── inventory/ manager (check, reserve, release, confirm, restock, totals) transaction-safe
│   ├── payments/ razorpay service (createOrder mock for dev, verify signature, webhook, refund)
│   ├── notifications/ service (abstraction in_app/push/email/SMS, templates)
│   ├── ai/ service (OpenAI with fallback, shopping list, search parse, categorize, description, business assistant, vision)
│   ├── search/ semantic (keyword fallback, pgvector ready, embedding mock)
│   ├── jobs/ queue (BullMQ architecture, invoice, notification, forecasting)
│   ├── analytics/ events (unified event model, conversion funnel, shop metrics)
│   ├── feature-flags/ flags (gradual rollout)
│   ├── i18n/ translations (en/hi/mr, t() function)
│   └── utils/ helpers (currency INR, date, distance, slugify, initials, zone sort, QR data)
├── styles/
│   ├── variables.css (design tokens)
│   ├── globals.css (reset + base)
│   ├── layout.css (header, sidebar, bottom-nav, grid, flex, stack)
│   ├── components.css (buttons, cards, badges, alerts, product-card, shop-card, skeletons, modal, tabs)
│   ├── forms.css (inputs, search, quantity selector, checkbox)
│   └── tables.css (table, pagination)
├── hooks/
│   ├── useAuth (user, loading, logout)
│   └── useRealtimeOrders (SSE)
├── types/
│   └── index.ts (UserRole, ShopStatus, OrderStatus, etc.)
├── tests/
│   ├── inventory.test.ts (cart totals, oversell prevention, state machine, tax, commission)
│   └── auth.test.ts (hash, JWT, QR security)
├── prisma/
│   └── schema.prisma (30+ models, indexes, unique constraints, SQLite dev/Postgres prod)
├── scripts/
│   └── seed.ts (2 shops, 5 zones, 5 categories, 15 products, 4 users - realistic Indian hardware)
├── public/
│   └── manifest.json (PWA)
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── AUTH.md
│   ├── PAYMENTS.md
│   ├── NOTIFICATIONS.md
│   ├── AI.md
│   ├── ML.md
│   ├── SECURITY.md
│   ├── DEPLOYMENT.md
│   └── TESTING.md
├── .env.example (all placeholders)
├── .env (dev with test keys)
├── .gitignore
├── package.json (scripts dev, build, db:push, db:seed, test)
├── tsconfig.json (strict)
├── next.config.js
├── middleware.ts (protects shopkeeper/admin/orders/cart/profile)
├── README.md (overview, business model, architecture, setup, env, testing, deployment)
├── FINAL_DELIVERABLE.md (95-point checklist)
├── ADVANCED_PRODUCTION_GRADE_SUMMARY.md (163-point)
├── PROJECT_STRUCTURE.md (this file)
├── LICENSE (MIT)
└── CONTRIBUTING.md
```

## Key Files Count
- 51 routes (app)
- 80+ TS/TSX files
- 11 docs
- 6 style files
- 1 Prisma schema with 30+ models

## Design Tokens
- --background #F8FAFC, --surface #FFFFFF, --text-primary #172033, --text-secondary #64748B, --border #E2E8F0, --brand #0F766E, --success #059669, --warning #D97706, --danger #DC2626, --info #2563EB
- --radius-sm 6px, --radius-md 8px, --radius-lg 12px, --shadow-xs/sm/md/lg
- --space-1..12 (8px system)

## Build
```
✓ Compiled successfully
51 routes
First Load JS 87.3 kB shared
```
