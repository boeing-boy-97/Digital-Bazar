# Setup, Testing, Deployment - Digital Bazar

## Setup Instructions

### 1. Install
```bash
npm install
```

### 2. Environment
```bash
cp .env.example .env
# Edit:
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-this-super-secret-jwt-key-min-32-chars-long-for-digital-bazar"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
OTP_TEST_CODE="123456"
OTP_ENABLED="true"
RAZORPAY_KEY_ID="rzp_test_demo"
RAZORPAY_KEY_SECRET="demo_secret_key"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_demo"
OPENAI_API_KEY="" # optional, fallback works without
```

### 3. Database
```bash
npm run db:push
npm run db:seed
```

### 4. Run Dev
```bash
npm run dev
# http://localhost:3000
```

### 5. Build Prod
```bash
npm run build
npm start
```

## Environment Variables

See `.env.example` - includes:
- DATABASE_URL, JWT_SECRET, NEXT_PUBLIC_APP_URL
- OTP_TEST_CODE, OTP_ENABLED
- RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, NEXT_PUBLIC_RAZORPAY_KEY_ID
- OPENAI_API_KEY, OPENAI_MODEL
- MAPS_API_KEY, NEXT_PUBLIC_MAPS_API_KEY
- EMAIL_API_KEY, EMAIL_FROM, SMS_API_KEY, SMS_SENDER_ID
- STORAGE_PROVIDER, STORAGE_BUCKET, REGION, ACCESS_KEY, SECRET_KEY
- VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
- FEATURE_AI_ASSISTANT, FEATURE_IMAGE_SEARCH, FEATURE_VOICE_SHOPPING, FEATURE_ONLINE_PAYMENT, FEATURE_DELIVERY, FEATURE_PUSH_NOTIFICATIONS
- PLATFORM_COMMISSION_DEFAULT

Validate on startup, fail fast in prod if missing required.

## Seed / Demo Accounts

```bash
npm run db:seed
```

Creates:
- **Customer:** 9876543210 / password123 (Rahul Sharma)
- **Shop Owner:** owner@ganesh.com / owner123 (Ganesh Patil) - owns Shree Ganesh Hardware (APPROVED) + Patel Building Mart
- **Employee:** 9876543212 / password123 (Picker Kumar) - permission picker
- **Admin:** admin@digitalbazar.com / admin123

Shops:
- Shree Ganesh Hardware - Hardware & Building Material, Nanded, 4.8 rating, 15 products, 5 zones (A Building, B Plumbing, C Paint, D Hardware, E Electrical)
- Patel Building Mart - Cement & Bricks

Products (15 realistic):
- Ultratech Cement 50kg ₹380, Ambuja Cement ₹370, Red Brick ₹8, AAC Block ₹45
- Finolex PVC Pipe 1" ₹180, Astral CPVC Elbow 1" ₹25, T-Joint ₹30, Brass Valve ₹220
- Asian Paints Exterior 4L ₹1450, Wall Putty 20kg ₹450
- SS Screw 100pcs ₹120, Hinges 4" ₹180
- Havells Wire 1.5mm 90m ₹1650, Anchor Switch 6A ₹45, Bosch Drill 13mm ₹3500

OTP Test Code: 123456 (when OTP_ENABLED=true)

## Test Instructions

### Unit Tests
```bash
npm run test
# Tests:
# - inventory calculations, cart totals, oversell prevention
# - order state machine valid/invalid transitions
# - tax, discount, commission
# - auth hash, JWT, QR security
```

### Integration Tests (Manual via API)
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"name":"Test","phone":"9999999999","password":"test123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"phone":"9876543210","password":"password123"}' -c cookies.txt

# List shops
curl http://localhost:3000/api/shops

# Search products
curl http://localhost:3000/api/products?q=PVC

# Add to cart (needs auth cookie)
curl -X POST http://localhost:3000/api/cart/add -H "Content-Type: application/json" -b cookies.txt -d '{"shopId":"SHOP_ID","productId":"PRODUCT_ID","quantity":1}'

# Place order
curl -X POST http://localhost:3000/api/orders -H "Content-Type: application/json" -b cookies.txt -d '{"shopId":"SHOP_ID","paymentMethod":"PAY_AT_STORE","pickupType":"PICKUP"}'

# Update status (shop owner)
curl -X POST http://localhost:3000/api/orders/ORDER_ID/status -H "Content-Type: application/json" -b cookies.txt -d '{"status":"ACCEPTED"}'
```

### E2E Tests (Manual UI)

**Customer Flow:**
1. Open http://localhost:3000
2. Login 9876543210 / password123 or OTP 123456
3. /shops → Shree Ganesh Hardware
4. Search "PVC pipe" → Add 20 → Add Cement 10 → /cart → Place Order
5. /orders/[id] → See timeline, QR token, zone-sorted items
6. SSE realtime: status updates without refresh

**Shopkeeper Flow:**
1. Login owner@ganesh.com / owner123 → /shopkeeper
2. See Today's Orders, Pending, Preparing, Ready
3. /shopkeeper/orders → New order appears instantly (SSE)
4. Accept → View pick list auto sorted by Zone A-E with checkboxes
5. Check items as picked → Progress 6/8 → Mark Ready
6. Customer gets Ready notification
7. /shopkeeper/orders/[id] → Paste QR token from customer → Verify → Complete
8. Inventory updated, invoice generated

**Admin Flow:**
1. Login admin@digitalbazar.com / admin123 → /admin
2. /admin/shops → See PENDING_REVIEW → Approve → Shop becomes public

**AI Flow:**
1. /ai → Type "Mujhe 2 bathroom ke liye plumbing material chahiye" → See structured list with qty, reason, confidence
2. /search → Enable AI Semantic Search → "waterproof outdoor wall paint" → See parsed filters
3. /shopkeeper/products → Add Product → Enter "Astral CPVC Elbow 1 inch" → Click AI Categorize → See category suggestion
4. Voice: /search → Click Mic → Say "Mujhe 500 bricks aur 10 cement chahiye" → Transcript → Search

## Deployment Instructions

### Vercel (Frontend)
1. Push to GitHub
2. Import project in Vercel
3. Set env vars in Vercel dashboard (from .env.example, real values)
4. Build command: `npm run build` (runs prisma generate)
5. Deploy

### Supabase (Postgres)
1. Create Supabase project
2. Get DATABASE_URL postgres://...
3. Change prisma/schema.prisma provider to postgresql (currently sqlite for dev)
4. Set DATABASE_URL in Vercel
5. Run `npx prisma migrate deploy` or `npx prisma db push`
6. Optional seed (don't seed prod with demo creds)

### Razorpay
1. Create Razorpay account
2. Get live keys rzp_live_*
3. Set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET in Vercel
4. Configure webhook URL in Razorpay dashboard: https://yourdomain.com/api/payments/webhook
5. Test with test keys first rzp_test_*

### OpenAI
1. Get API key from OpenAI
2. Set OPENAI_API_KEY, OPENAI_MODEL=gpt-4o-mini in Vercel
3. Without key, fallback rule-based works

### Storage
1. For product images: use S3 or Supabase Storage
2. Set STORAGE_* vars
3. Implement upload in lib/storage (currently local)

### Maps
1. Google Maps or Mapbox
2. Server-side API key in MAPS_API_KEY, public in NEXT_PUBLIC_MAPS_API_KEY
3. Never expose private key

## Known Limitations

- SQLite dev (should be Postgres prod for enums, pgvector, concurrency)
- OTP store in-memory Map (should be Redis)
- Realtime SSE polling 3s (should be Redis PubSub + WebSockets/Pusher/Ably)
- File upload local (should be S3)
- No rate limiting implemented yet, only architecture ready
- ML forecasting baseline only, Python service future
- No PWA service worker yet, only manifest
- Tests have path alias issues in vitest (needs tsconfig paths config)
- No dark mode yet, light theme first
- Delivery architecture ready but not fully UI implemented (pickup primary)

## Recommended Next Steps

1. Migrate to Supabase Postgres + pgvector for semantic search embeddings
2. Add Redis for OTP, cache, queue, realtime pubsub
3. Implement BullMQ for background jobs (invoice PDF, notifications, forecasting)
4. Add S3/Supabase Storage for images with optimization
5. Add rate limiting via Upstash Redis
6. Add Sentry for error monitoring + PostHog for analytics
7. Add Python ML service with scikit-learn/Prophet for advanced forecasting
8. Add i18n provider next-intl with en/hi/mr translations
9. Add E2E tests with Playwright
10. Add CI/CD GitHub Actions (lint, test, build)
11. Add monitoring dashboards for system health
12. Add shop capacity, pause mode, preparation estimation ML
13. Add barcode scanning, delivery driver app
14. Add refund workflow UI, promotion engine UI
15. Add customer address book, support ticket UI

## Troubleshooting

- **Prisma generate fails:** Use `npx prisma@5.17.0 generate` (version pinned)
- **Build fails mode insensitive:** Fixed via sed removal - SQLite doesn't support mode insensitive
- **useSearchParams error:** Wrapped in Suspense boundary
- **No shops:** Run `npm run db:seed`
- **Auth fails:** Check JWT_SECRET min 32 chars, cookie httpOnly
- **Cart not updating:** Check localStorage db_cart_count + event cart-updated
- **Realtime not working:** Check SSE /api/realtime/orders?orderId= - polls every 3s
- **AI not working:** Without OPENAI_API_KEY, fallback rule-based works - set key for full AI
- **Payments fail:** In dev, use test_signature for mock verification
- **QR verify fails:** Ensure status READY_FOR_PICKUP, token matches, shop matches
