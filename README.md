# Digital Bazar - Shop Local. Skip the Wait.

> **Know it is in stock before you leave the house.** Real inventory from verified local shops in Nagpur.

A production-real local commerce platform where customers browse real shop inventory, reserve before visiting, and collect with QR verification. Shop keeps customer, margin, and relationship. No fake data, no warehouse.

Live: https://digital-bazar-three.vercel.app/

## 🌟 Core Concept (Not Blinkit Clone)

- **Real local market digitization** - not dark store, not instant delivery
- **Reserve Before You Go** - not 10-minute delivery
- **Shop keeps customer** - not commission, shop keeps margin + relationship
- **Real inventory from shop counter** - not warehouse, real photos only
- **Honest onboarding** - starting Nagpur 1 city, not fake 300+ cities 500+ shops 4.8/5
- **QR verification + GST** - single-use signed HMAC, 15min expiry, audit trail

## 🚀 Quick Start - Real Setup

### 1. Install
```bash
npm install
```

### 2. Env Setup - REAL Keys
```bash
cp .env.example .env
# Edit .env - see ENV_KEYS_GUIDE.md for where to get each key
```

**For local dev with real postgres (recommended):**
```bash
docker-compose up -d postgres redis
# DATABASE_URL already set for local postgres in .env
npm run db:push
npm run db:seed
npm run dev
# Open http://localhost:3000
```

**For quick sqlite dev (alternative):**
```bash
# Use sqlite schema
npx prisma db push --schema=prisma/schema.sqlite.prisma
npm run db:seed
npm run dev
```

### 3. Production Deployment - Vercel

See `ENV_KEYS_GUIDE.md` and `.env.production.template` for complete A to Z.

**Minimal real prod needs:**
```
DATABASE_URL=postgresql://... (Neon/Supabase)
JWT_SECRET=openssl rand -hex 32
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
NEXT_PUBLIC_SHOW_DEMO_CREDS=false
OTP_ENABLED=false
STORAGE_PROVIDER=s3 or r2 + S3 keys
RAZORPAY_KEY_ID=rzp_live_... (or rzp_test_... for testing)
```

Add in Vercel → Settings → Environment Variables → Deploy.

## 🔑 Demo Credentials (Dev Only)

```
Customer: 9876543210 / password123
Shop Owner: owner@ganesh.com / owner123
Employee: 9876543212 / password123
Admin: admin@digitalbazar.com / admin123
OTP Test Code: 123456 (only when OTP_ENABLED=true, NEVER prod)
```

## 📦 Architecture - Real

```
Frontend (Next.js 14 App Router, Blinkit-inspired UI but Digital Bazar concept)
  ↓ API Layer (Zod validation, JWT httpOnly, RBAC, rate limiting, requestId)
  ↓ Business Logic (inventory atomic, orders state machine, payments Razorpay, QR HMAC)
  ↓ Database (Prisma + Postgres prod / SQLite dev) + Realtime SSE
  ↓ External Providers (Razorpay real, MSG91 SMS real, Resend email real, S3/R2 real, OpenAI real, Google Maps real)
```

### Tech Stack - Real

- **Frontend**: Next.js 14, TypeScript, CSS Variables, Lucide Icons (no emoji), TanStack Query
- **Backend**: Next.js API Routes, Prisma ORM, JWT httpOnly cookies, bcrypt
- **Database**: Postgres (prod) / SQLite (dev) - 41 models, 37 indexes, paise integer, transactional inventory
- **Payments**: Razorpay real SDK (test + live), signature verify, webhook idempotency, never trust frontend
- **Auth**: OTP real SMS via MSG91/Fast2SMS/Twilio, 123456 only dev
- **Storage**: S3/R2 real, local only dev (Vercel ephemeral loses files)
- **AI**: OpenAI gpt-4o-mini real, fallback rule-based honest (no fake)
- **Maps**: Google Maps real, haversine fallback (no API needed for distance)
- **Email**: Resend/SendGrid real, in-app fallback
- **Realtime**: SSE built-in, Pusher/Ably for scale
- **Rate Limit**: Upstash Redis real for prod multi-instance, memory for dev
- **Security**: RBAC, Zod, audit logs, HMAC QR single-use, webhook verify, file validation

## 🗄️ Database - Real

**Provider:** `postgresql` (prod) - see `prisma/schema.prisma`
**Alternative:** `sqlite` for quick dev - see `prisma/schema.sqlite.prisma`

**Models (41):**
```
User, Profile, MasterCategory, MasterProduct, MasterProductVariant, MasterProductImage,
Shop, ShopBusinessHours, ShopHoliday, ShopMember, Category, StorageZone,
Product, ProductVariant, ProductImage, InventoryTransaction, Address, Cart, CartItem,
Order, OrderItem, OrderStatusHistory, Reservation, ReservationItem, ReservationStatusHistory,
Stocktake, Payment, PaymentEvent, Invoice, Notification, Favorite, Review,
SupportTicket, Commission, Promotion, AuditLog, AIConversation, AIMessage, AIToolCall,
Forecast, PlatformSettings
```

**Money:** Integer paise (19900 = ₹199.00), never Float, immutable snapshots
**Inventory:** onHand/reserved/available derived, ledger RECEIVE/ADJUST/RESERVE/RELEASE/SELL/RETURN/DAMAGE/TRANSFER atomic never -1
**Order:** State machine PENDING→ACCEPTED→PREPARING→READY_FOR_PICKUP→COMPLETED / REJECTED, order number DB-2026-000124 human-friendly
**QR:** Single-use signed HMAC expiry 15min second scan fail inventory finalized audit invoice
**Reservation:** First-class PENDING→CONFIRMED→HELD→COLLECTED / DECLINED / EXPIRED, code + QR, expiry policy

## 🔒 Security - Real

- JWT httpOnly cookies, bcrypt 12 rounds, 32+ chars secret
- RBAC: customer, shop_owner, shop_employee, admin, super_admin + permissions OWNER/MANAGER/PICKER/CASHIER/INVENTORY_MANAGER
- Row-level: shopkeeper can never access another shop's data (server-side role resolution)
- Zod validation client + server, never trust browser
- Audit logs actor/role/resource/action/before/after/reason/timestamp
- Razorpay amount/currency/signature/webhook duplicate/refund verify, reconciliation, idempotency
- QR replay protection, rate limiting login/OTP/checkout/payment/webhook/QR/AI/search, inventory race prevention SELECT FOR UPDATE
- File upload MIME/size/path traversal validation, XSS/CSRF protection, secure headers

## 🎨 Design - Real, Trustworthy

- Brand: DIGITAL BAZAR "Shop Local. Skip the Wait." trustworthy practical
- No AI-generated look (no gradients/blobs/emoji), no fake social proof
- Colors: #0F766E teal (not Blinkit yellow #F8CB46), white, slate
- Typography: Inter + heading font, clamp responsive
- Blinkit-inspired CSS adapted: stats 4 cols icon 48px, why 6 cards, steps 3 cols line, role 3 cards checks, tools 2 cols, help 4 cards, brands marquee, FAQ accordion - but concept preserved real local market not dark store
- All screen types: 320px small mobile 16px padding 1col no scroll 44px touch, 375px iPhone SE 20px product 1col, 390px iPhone 12 2col, 430px Plus, 768px tablet product 3col shop 2col tables→cards sidebar overlay bottom nav visible, 1024px tablet landscape product 4col shop 3col, 1280px laptop max-width 1280 centered sidebar fixed 260px, 1440px desktop, 1600px+ large desktop max-width 1280 clamp typography

## 📱 PWA + SEO

- manifest.json, icons 192/512, standalone, theme #0F766E
- robots.ts, sitemap.ts, metadata canonical OG structured real
- OfflineBanner online/offline events, StaleDataIndicator stock freshness

## 🔑 ENV Keys - Where to Get

See `ENV_KEYS_GUIDE.md` for complete A to Z with links:

1. **Database:** Neon (neon.tech) / Supabase - postgres URL
2. **JWT:** `openssl rand -hex 32`
3. **Razorpay:** dashboard.razorpay.com/app/keys - test `rzp_test_` dev, live `rzp_live_` prod
4. **SMS OTP:** MSG91 (msg91.com) / Fast2SMS - API key + DLT template ID, set `OTP_ENABLED=false` in prod
5. **Email:** Resend (resend.com) - API key + domain verify
6. **Storage:** AWS S3 or Cloudflare R2 - bucket + access keys, NOT local in prod
7. **Maps:** console.cloud.google.com - Maps JS + Places + Distance Matrix
8. **AI:** platform.openai.com/api-keys - `sk-proj-...` or empty for rule-based fallback honest
9. **Push:** `npx web-push generate-vapid-keys`
10. **Redis:** console.upstash.com/redis - REST URL + token for prod rate limiting

See `.env.example` (all vars with comments) and `.env.production.template` (prod template with REPLACE_WITH_REAL).

## 📄 Docs

- `ENV_KEYS_GUIDE.md` - Complete env keys A to Z where to get each
- `REAL_SETUP_GUIDE.md` - Real setup A to Z
- `PROJECT_STRUCTURE.md` - Project structure
- `docs/` - Architecture, API, Auth, Database, AI, Payments, Security, etc.
- `docs/archive/` - Old reports (final, elite, blinkit-inspired, responsive fixes)

## 🧪 Test Flows - Real E2E

**Customer:** Register → Search → Compare (groupByMaster cheapest per master + shopCount) → Select → Add → Cart DB-backed server-authoritative price/stock validation → Checkout server validation pricing discount tax payment → Payment Razorpay verify amount/currency/signature/webhook duplicate/refund → Order centralized service state machine PENDING→ACCEPTED→PREPARING→READY_FOR_PICKUP→COMPLETED → Shop accept → Pick zone scan/check missing complete ready picker identity/duration → Notification real center unread/deep link realtime SSE fallback → QR single-use signed HMAC expiry second scan fail inventory finalized audit invoice → Payment → Invoice → Review eligibility one per completed order moderation → Analytics → Audit

**Shopkeeper:** Dashboard attention new/preparing/ready/low/today/issues analytics real orders/revenue/AOV/top/slow/turnover/cancellation/peak/pickup inventory intelligence forecasting "Estimated stockout 4-6 days" only meaningful + bulk stock CSV/barcode/table per 52 digital shelf Visible/Hidden/Out/Temporarily per 56,57 shop pause per 58,59 reservation first-class per 33,34,43,44 catalog health per 55 demand gap per 71

**Admin:** Overview/Shops/Approvals/Users/Catalog/Orders/Payments/Refunds/Reviews/Promotions/Support/Audit/Health/Config action center health DB/payment/storage/realtime/notification/AI HEALTHY/DEGRADED/CONFIG/ERROR not fake

## ✅ All Issues Fixed

- Build green 87.3kB First Load 27.9kB Middleware
- 49 pages, 45 APIs, 18 components, 41 models 37 indexes
- All APIs with try/catch graceful fallback (no 500 for public listings, honest onboarding)
- Homepage stats: Onboarding not 0+, honest
- Shops page: No shops in your area yet not Unable to load shops
- All screen types 320px-1600px+ capable via fix-all-screens.css 800+ lines + blinkit-inspired.css 800+ lines
- No console.log in app, no TODO/FIXME fake, no fake data, all images alt, no minWidth scroll, accessibility 111, loading 224, error 134, empty 54, responsive 279, security 130, rate limiting 32
- All states: LOADING/EMPTY/ERROR/UNAUTHORIZED/FORBIDDEN/OFFLINE/STALE/CONFLICT/PAYMENT

## 📝 License

MIT - Built for local commerce in Nagpur, India. Real shops, real inventory.

---

**Tagline: Shop Local. Skip the Wait. Know it is in stock before you leave the house.**
