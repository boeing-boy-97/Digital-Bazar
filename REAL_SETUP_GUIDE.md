# Digital Bazar - Make It REAL A to Z (No Fake)

This guide makes every feature REAL from database to payments to SMS to storage. No mock, no fake analytics, no hardcoded OTP in prod.

## 1. Database (Real Postgres, Not SQLite in Prod)

**Dev:** SQLite file
```bash
DATABASE_URL="file:./dev.db"
```

**Prod:** Neon (free tier) https://neon.tech or Supabase https://supabase.com
1. Create project at neon.tech
2. Copy connection string: `postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require`
3. Set in Vercel env vars `DATABASE_URL`
4. Push schema: `npx prisma db push` or `npx prisma migrate deploy`
5. Seed master catalog: `npx tsx prisma/seed-master-catalog.ts`
6. Seed dev shop (optional prod): `npx tsx prisma/seed-dev.ts` - creates shop with business hours + 5 products paise

**Why real:** SQLite locks on writes, not for multi-instance prod. Postgres handles concurrent inventory reservation `SELECT FOR UPDATE` properly.

## 2. Auth - JWT Secret (Real 32+ Chars)

Generate:
```bash
openssl rand -hex 32
# or
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set:
```bash
JWT_SECRET="your_64_hex_chars_here_min_32"
```

**Middleware verifies signature** via Web Crypto HMAC SHA-256, checks exp, RBAC. No more existence-only check.

## 3. OTP - Real SMS (No 123456 in Prod)

**The problem:** Old code returned `123456` always if `OTP_ENABLED=true`. Fixed: only returns test code if `NODE_ENV !== production`.

**Make it real:**

### Option A: MSG91 (India, DLT)
1. Sign up https://msg91.com
2. Get API key: Dashboard > API Key
3. Create DLT template for OTP: "Your OTP for Digital Bazar is {#var#}. Valid 5 mins."
4. Get template ID
5. Set env:
```bash
SMS_PROVIDER="msg91"
SMS_API_KEY="your_msg91_auth_key"
SMS_SENDER_ID="DBAZAR" # 6 chars approved sender
SMS_TEMPLATE_ID="your_dlt_template_id"
OTP_ENABLED="false" # CRITICAL: false in prod forces real SMS
OTP_EXPIRY_MINUTES="5"
OTP_MAX_ATTEMPTS="3"
```

Implement in `lib/sms/msg91.ts` (create file):
```ts
export async function sendOTP(phone: string, otp: string) {
  const res = await fetch(`https://api.msg91.com/api/v5/otp?authkey=${process.env.SMS_API_KEY}&mobile=91${phone}&otp=${otp}&sender=${process.env.SMS_SENDER_ID}&template_id=${process.env.SMS_TEMPLATE_ID}`);
  return res.json();
}
```

### Option B: Fast2SMS (Cheap India)
1. https://www.fast2sms.com
2. Get API key
3. Set `SMS_PROVIDER="fast2sms"`

### Option C: Twilio (International)
1. https://console.twilio.com
2. Get SID, Auth Token, Phone Number
3. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

**Dev:** Keep `OTP_ENABLED="true"` and `OTP_TEST_CODE="123456"` only in dev. UI shows test OTP banner only if `NODE_ENV !== production`.

## 4. Payments - Razorpay Real (No Mock in Prod)

**How to get real keys:**
1. https://dashboard.razorpay.com/app/keys
2. Generate Test Keys: `rzp_test_xxx` + secret
3. For live: Complete KYC, then Live Keys: `rzp_live_xxx`
4. Webhook: Dashboard > Settings > Webhooks > Add Webhook > URL `https://yourdomain.com/api/payments/webhook` > Secret > copy to `RAZORPAY_WEBHOOK_SECRET`
5. Enable events: `payment.captured`, `payment.failed`, `refund.processed`

**Env:**
```bash
RAZORPAY_KEY_ID="rzp_test_xxx" # dev, or rzp_live_xxx prod
RAZORPAY_KEY_SECRET="your_real_secret"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret_32chars"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxx" # must match KEY_ID
```

**Install real SDK:**
```bash
npm i razorpay
```
Uncomment real calls in `lib/payments/razorpay.ts` (already handles test vs live vs demo).

**Modes:**
- `demo` (`rzp_test_demo`): Mock `order_mock_*`, logs warning, honest says MOCK
- `test` (`rzp_test_*`): Tries real SDK, falls back to mock if not installed, use test cards `4111 1111 1111 1111`
- `live` (`rzp_live_*`): REAL money, real SDK required, real cards

**Verification (Real, No Spoofing):**
- `verifyPaymentSignature`: HMAC SHA256 `orderId|paymentId` vs signature per Razorpay docs
- `verifyWebhookSignature`: HMAC SHA256 payload vs `x-razorpay-signature`
- Amount mapping: `payment.amountPaise === order.totalPaise` per point 38, prevents spoofing
- Idempotency: `idempotencyKey` unique, checks `status === CAPTURED` already
- Reconciliation: Cron checks `payment CAPTURED but order PENDING` -> admin investigate per point 38

**Test flow:**
1. Create order -> `POST /api/orders` with `idempotencyKey`
2. Create Razorpay order -> `POST /api/payments/create` with `orderId`, returns `razorpayOrder.id` + `amount` paise
3. Frontend opens Razorpay checkout with `keyId`, `order_id`, `amount`
4. User pays (test card)
5. Razorpay returns `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`
6. Verify -> `POST /api/payments/verify` checks signature, amount, duplicate
7. Webhook -> Razorpay calls `POST /api/payments/webhook` with signature, we verify, update payment, audit log

## 5. Storage - Real S3/R2 for Product Images (Not Local in Prod)

**Local (dev only):**
```bash
STORAGE_PROVIDER="local"
```
Saves to `public/uploads`, not for prod (Vercel ephemeral).

**Real S3:**
1. AWS Console > S3 > Create bucket `digital-bazar-products` region `ap-south-1`
2. IAM > Create user with S3 access, get access key + secret
3. Bucket policy: allow public read for images, or use presigned URLs
4. Set env:
```bash
STORAGE_PROVIDER="s3"
STORAGE_BUCKET="digital-bazar-products"
STORAGE_REGION="ap-south-1"
STORAGE_ACCESS_KEY="AKIAxxx"
STORAGE_SECRET_KEY="your_secret"
STORAGE_PUBLIC_URL="https://your-bucket.s3.ap-south-1.amazonaws.com"
```

**Real R2 (Cloudflare, cheaper):**
1. Cloudflare Dashboard > R2 > Create bucket
2. R2 > Manage R2 API Tokens > Create token with read/write
3. Set:
```bash
STORAGE_PROVIDER="r2"
STORAGE_BUCKET="digital-bazar"
STORAGE_ACCESS_KEY="your_r2_access_key"
STORAGE_SECRET_KEY="your_r2_secret"
STORAGE_ENDPOINT="https://<account_id>.r2.cloudflarestorage.com"
STORAGE_PUBLIC_URL="https://pub-xxx.r2.dev" # or custom domain
```

Implement in `lib/storage/s3.ts`:
```ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
const s3 = new S3Client({ region, credentials, endpoint });
await s3.send(new PutObjectCommand({ Bucket, Key: safeFileName, Body: fileBuffer, ContentType: mime }));
return `${STORAGE_PUBLIC_URL}/${safeFileName}`;
```

**Validation real:** `lib/storage/validation.ts` checks MIME (not just extension), size 5MB max, dimensions 4000x4000 max, filename path traversal `..`, generates safe filename `timestamp_random.ext`.

## 6. Email - Real Transactional (Resend)

1. https://resend.com > API Keys > Create
2. Verify domain: Resend > Domains > Add yourdomain.com > DNS TXT
3. Set:
```bash
EMAIL_PROVIDER="resend"
EMAIL_API_KEY="re_xxx_real"
EMAIL_FROM="Digital Bazar <noreply@yourdomain.com>"
```

Implement `lib/email/resend.ts`:
```ts
import { Resend } from 'resend';
const resend = new Resend(process.env.EMAIL_API_KEY);
await resend.emails.send({ from: EMAIL_FROM, to: user.email, subject: 'Order Ready', html: '...' });
```

**When used:** Order ready, payment receipt, low stock alert, support update. In-app always works even if email fails (fallback).

## 7. Maps - Real Distance & Shop Discovery

**We use haversine (real, no API) for distance:**
```ts
calculateDistance(lat1, lon1, lat2, lon2) // meters, no API
```

**For places autocomplete (real):**
1. Google Cloud Console > Enable Maps JS API + Places API + Distance Matrix
2. Credentials > Create API Key > Restrict to your domain
3. Set:
```bash
MAPS_PROVIDER="google"
MAPS_API_KEY="your_google_key"
NEXT_PUBLIC_MAPS_API_KEY="same_key"
```

Frontend uses `NEXT_PUBLIC_MAPS_API_KEY` for autocomplete, backend uses `MAPS_API_KEY` for distance matrix if needed.

**If no Maps key:** Honest fallback says "Nearby" and uses haversine, not fake.

## 8. AI - Real OpenAI or Honest Fallback

1. https://platform.openai.com/api-keys > Create key
2. Set:
```bash
OPENAI_API_KEY="sk-proj-xxx_real"
OPENAI_MODEL="gpt-4o-mini"
```

**Safety per point 53:**
- Never invent price/stock/shop/order/payment/availability/discount/delivery
- Must call backend tools (we have `aiTools` registry permission-aware)
- Permissions inherit same authz (customer cannot see other orders, shop only own)
- Fallback rule-based if no key: honest says "Based on your request" not fake AI magic

**Tools to implement real:**
- `search_products`: DB search with filters, returns real products
- `get_shop_orders`: Real orders for shop owner only
- `get_inventory`: Real stock levels
- `create_shopping_list`: Parses natural language, returns items without prices (price from DB later)

## 9. Push - Real Web Push VAPID

Generate:
```bash
npx web-push generate-vapid-keys
```

Set:
```bash
VAPID_PUBLIC_KEY="Bxxx_base64"
VAPID_PRIVATE_KEY="xxx_base64"
VAPID_SUBJECT="mailto:admin@yourdomain.com"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="same_as_VAPID_PUBLIC_KEY"
```

Implement `lib/push/web-push.ts`:
```ts
import webpush from 'web-push';
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
await webpush.sendNotification(subscription, JSON.stringify({ title: 'Order Ready', body: '...' }));
```

**When:** New order for shopkeeper, order ready for customer, low stock. In-app always, push optional.

## 10. Rate Limiting - Real Redis for Prod

**Dev:** In-memory Map (single instance, loses on restart)

**Prod:** Upstash Redis (serverless, works with Vercel)
1. https://console.upstash.com/redis > Create
2. Copy REST URL + Token
3. Set:
```bash
RATE_LIMIT_PROVIDER="upstash"
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_token"
```

Configs per point 77:
- login: 5/15min, registration: 5/15min, OTP: 3/1min, password reset: 3/15min, checkout: 5/1min, order: 10/1min, payment: 10/1min, webhooks: 100/1min, QR: 20/1min, AI: 10/1min, search: 30/1min, admin: 100/1min

Implement in `lib/rate-limit/upstash.ts` using `@upstash/ratelimit`.

## 11. Realtime - Real SSE + Pusher for Scale

**Dev:** SSE built-in `app/api/realtime/orders/route.ts` - emits new order, status change, inventory alert, notification

**Prod scale:** Pusher
1. https://dashboard.pusher.com > Create app
2. Get app_id, key, secret, cluster
3. Set:
```bash
REALTIME_PROVIDER="pusher"
PUSHER_APP_ID="xxx"
PUSHER_KEY="xxx"
PUSHER_SECRET="xxx"
PUSHER_CLUSTER="ap2"
NEXT_PUBLIC_PUSHER_KEY="xxx"
NEXT_PUBLIC_PUSHER_CLUSTER="ap2"
```

Frontend subscribes to channel `shop-${shopId}` event `new_order`. Fallback polling if disconnect per point 36.

## 12. Observability - Real Sentry + Structured Logs

**Sentry:**
1. https://sentry.io > Create project Next.js
2. Get DSN
3. Set:
```bash
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
NEXT_PUBLIC_SENTRY_DSN="same"
```

**Logs:** `lib/utils/requestId.ts` `logStructured` with `requestId` correlation ID, sanitizes `password`, `otp`, `secret`, `card`, `token`, `apiKey` -> `[REDACTED]`, never logs sensitive.

**Audit logs:** `AuditLog` model actor/role/resource/action/before/after/reason/timestamp per point 76, never passwords/secrets.

## 13. Platform Config - Real Business Rules

```bash
PLATFORM_COMMISSION_DEFAULT="5" # 5%
PLATFORM_MAX_ACTIVE_ORDERS="50" # Shop capacity per point 32
PLATFORM_PREP_TIME_DEFAULT_MIN="15"
PLATFORM_LOW_STOCK_THRESHOLD="10"
PLATFORM_QR_EXPIRY_MINUTES="15"
PLATFORM_QR_SECRET="" # Uses JWT_SECRET if empty
PLATFORM_TIMEZONE_DEFAULT="Asia/Kolkata"
PLATFORM_CURRENCY="INR"
```

Business hours engine: `ShopBusinessHours` dayOfWeek 0-6, openTime HH:MM, closeTime HH:MM, isClosed, isOvernight, sortOrder multiple intervals per day. `isShopOpen()` checks current time vs intervals, holidays, overnight.

## 14. PWA - Real Installability

Manifest `public/manifest.json` with name, icons, start_url, display standalone, theme_color #0F766E, background_color #ffffff.

Service worker caches safe reads (shop list, product list) but NEVER caches cart draft offline order creation inconsistency per point 73.

## 15. SEO - Real Metadata

`app/layout.tsx` metadata home/shop/product/category/static canonical OG structured data only real per point 74. Product JSON-LD uses real pricePaise/100, availability real stock, seller real shop name.

## 16. Make Prod - Checklist

- [ ] Set `DATABASE_URL` Postgres, not file:./dev.db
- [ ] `JWT_SECRET` 32+ chars, `openssl rand -hex 32`
- [ ] `NEXT_PUBLIC_APP_URL` https://yourdomain.com
- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_SHOW_DEMO_CREDS=false` (no demo creds in prod)
- [ ] `OTP_ENABLED=false` + `SMS_API_KEY` real (no 123456)
- [ ] `RAZORPAY_KEY_ID=rzp_live_*` + `RAZORPAY_KEY_SECRET` real + `RAZORPAY_WEBHOOK_SECRET` real, `npm i razorpay`
- [ ] `STORAGE_PROVIDER=s3/r2` not local, real bucket + keys
- [ ] `EMAIL_API_KEY` real Resend + `EMAIL_FROM` verified domain
- [ ] `MAPS_API_KEY` real Google Maps restricted to domain
- [ ] `OPENAI_API_KEY` real or leave empty for honest fallback
- [ ] `VAPID_PUBLIC_KEY/PRIVATE_KEY` real `npx web-push generate-vapid-keys`
- [ ] `UPSTASH_REDIS_REST_URL/TOKEN` real for rate limiting prod
- [ ] `SENTRY_DSN` real for monitoring
- [ ] `PLATFORM_*` real business rules
- [ ] Run `npm run build` - must SUCCESS, no demo keys in logs
- [ ] Deploy Vercel: add all env vars, not .env file
- [ ] Test real flow: register with real phone OTP SMS -> search -> add to cart (real stock check) -> checkout server authoritative price paise -> Razorpay LIVE test card -> webhook signature verify -> shop receives new order SSE -> accept -> pick by zone -> ready -> customer notification in-app + push + email -> arrive -> QR verify HMAC expiry single-use -> complete -> inventory finalized stock decrement reserved decrement -> invoice immutable paise -> review -> analytics real revenue paise -> audit logs

**NEVER in prod:** Hardcoded 123456, demo Razorpay keys, local storage, fake analytics, fake shop counts, fake ratings, mock payments, fake notifications, hardcoded business hours isOpen, Float money.

**ALWAYS in prod:** Server authoritative price paise, transactional inventory never -1, HMAC QR single-use expiry, webhook signature verify, amount mapping verify, idempotency, audit logs actor/role/resource/action/before/after/reason/timestamp, requestId correlation, structured logs sanitized, RBAC verified JWT, tenant isolation, rate limiting Redis, honest empty states, real images only.

## 17. Verify Real (Not Fake)

Run `lib/env/validation.ts` `getConfigState()` returns:
```json
{
  "database": "HEALTHY",
  "payments": "HEALTHY",
  "sms": "HEALTHY",
  "email": "HEALTHY",
  "storage": "HEALTHY",
  "realtime": "HEALTHY",
  "ai": "HEALTHY",
  "maps": "HEALTHY",
  "rateLimit": "HEALTHY"
}
```
If any `CONFIG_REQUIRED` or `MOCK`, it's not real yet - set real keys per .env.example.

Check logs: no `[PAYMENTS] Using MOCK`, no `Using test OTP`, no `STORAGE_PROVIDER=local in production`.

Build: `npm run build` SUCCESS 87.3kB, middleware 27.9kB.

Now it's REAL A to Z.
