# 🔑 Digital Bazar - Complete ENV Keys Guide (Real, No Fake)

This guide tells you exactly where to get each API key and how to add it. All env vars are in `.env.example` and `.env.production.template`.

## Quick Start - 5 Minutes

```bash
# 1. Copy template
cp .env.example .env

# 2. For local dev with postgres (recommended)
docker-compose up -d postgres redis
# DATABASE_URL is already set for local postgres

# 3. Generate JWT secret
openssl rand -hex 32
# Copy output to JWT_SECRET

# 4. Run
npm run db:push
npm run db:seed
npm run dev
```

## Production - Vercel Deployment

### 1. Database (Required) - Postgres
**Where to get:** Neon (https://neon.tech) or Supabase (https://supabase.com) or Railway

- Neon: Create project → Connection string → Copy `postgresql://...`
- Supabase: Project → Settings → Database → Connection string
- Set `DATABASE_URL` in Vercel env vars

**Local alternative:** `docker-compose up -d` gives you `postgresql://digital_bazar:digital_bazar_dev_password@localhost:5432/digital_bazar`

### 2. JWT Secret (Required)
```bash
openssl rand -hex 32
```
Copy to `JWT_SECRET` - must be 32+ chars. Used for auth + QR HMAC.

### 3. Razorpay (Required for real payments)
**Where:** https://dashboard.razorpay.com/app/keys

- Create account → Keys → Generate Test keys `rzp_test_...` for dev
- For production: Complete KYC → Get Live keys `rzp_live_...`
- Webhook secret: Settings → Webhooks → Add webhook `https://yourdomain.com/api/payments/webhook` → Copy secret
- Set:
  ```
  RAZORPAY_KEY_ID=rzp_live_xxx
  RAZORPAY_KEY_SECRET=xxx
  RAZORPAY_WEBHOOK_SECRET=xxx
  NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxx (same as KEY_ID)
  ```
- Install SDK is already done: `razorpay` package included
- Test cards: https://razorpay.com/docs/payments/payments/test-card-details/

**Mode detection:** Code auto-detects `demo` / `test` / `live` from KEY_ID. For real payments, use `rzp_live_`.

### 4. SMS OTP - Real OTP (Required for production, not 123456)
**Where:** MSG91 (https://msg91.com) or Fast2SMS (https://www.fast2sms.com)

**MSG91:**
- Sign up → Get Auth Key from dashboard
- Create DLT template for OTP: "Your OTP for Digital Bazar is {#var#}. Valid for 5 mins."
- Get Template ID after DLT approval
- Set:
  ```
  SMS_PROVIDER=msg91
  SMS_API_KEY=your_msg91_auth_key
  SMS_SENDER_ID=DBAZAR (approved sender ID)
  SMS_TEMPLATE_ID=your_dlt_template_id
  OTP_ENABLED=false (critical - false in prod to force real SMS)
  ```

**Fast2SMS:**
- Sign up → Dev API → Copy API key
- DLT sender ID approval needed
- Set `SMS_PROVIDER=fast2sms` + `SMS_API_KEY`

**Twilio (alternative):**
- https://console.twilio.com → Get Account SID, Auth Token, Phone Number
- Set `TWILIO_*` vars + `SMS_PROVIDER=twilio`

**Dev mode:** `OTP_ENABLED=true` + `OTP_TEST_CODE=123456` allows hardcoded OTP only in non-production (lib/auth/jwt.ts checks NODE_ENV).

### 5. Email - Real Transactional (Optional, in-app fallback)
**Where:** Resend (https://resend.com) - recommended, or SendGrid

**Resend:**
- Sign up → API Keys → Create key
- Verify domain: Settings → Domains → Add domain → Add DNS records
- Set:
  ```
  EMAIL_PROVIDER=resend
  EMAIL_API_KEY=re_xxx
  EMAIL_FROM=Digital Bazar <noreply@yourdomain.com>
  ```

**SendGrid:**
- https://app.sendgrid.com/settings/api_keys → Create key
- Set `EMAIL_PROVIDER=sendgrid` + `EMAIL_API_KEY`

If not set, notifications work in-app only (honest fallback).

### 6. Storage - Real S3/R2 (Required for prod, local loses files on Vercel)
**Where:** AWS S3 or Cloudflare R2 (S3 compatible, cheaper)

**AWS S3:**
- AWS Console → IAM → Create user with S3 access → Get Access Key + Secret
- S3 → Create bucket `digital-bazar-products` → Region `ap-south-1`
- Set:
  ```
  STORAGE_PROVIDER=s3
  STORAGE_BUCKET=digital-bazar-products
  STORAGE_REGION=ap-south-1
  STORAGE_ACCESS_KEY=AKIA...
  STORAGE_SECRET_KEY=xxx
  ```

**Cloudflare R2 (recommended, free tier):**
- Cloudflare Dashboard → R2 → Create bucket → Get S3 API keys
- Set:
  ```
  STORAGE_PROVIDER=r2
  STORAGE_BUCKET=digital-bazar-products
  STORAGE_ACCESS_KEY=...
  STORAGE_SECRET_KEY=...
  STORAGE_ENDPOINT=https://<account>.r2.cloudflarestorage.com
  STORAGE_PUBLIC_URL=https://pub-xxx.r2.dev (or custom domain)
  ```

**Dev:** `STORAGE_PROVIDER=local` saves to `public/uploads` - OK for dev, NEVER prod (Vercel ephemeral).

### 7. Maps - Google Maps (Optional, haversine fallback)
**Where:** https://console.cloud.google.com/apis/credentials

- Enable APIs: Maps JavaScript API + Places API + Distance Matrix API
- Create API key → Restrict to your domain
- Set:
  ```
  MAPS_PROVIDER=google
  MAPS_API_KEY=your_google_maps_key
  NEXT_PUBLIC_MAPS_API_KEY=same_key (public for frontend)
  ```

If not set, distance uses haversine formula (real, no API needed).

### 8. AI - OpenAI (Optional, rule-based fallback)
**Where:** https://platform.openai.com/api-keys

- Create key `sk-proj-...`
- Set:
  ```
  OPENAI_API_KEY=sk-proj-xxx
  OPENAI_MODEL=gpt-4o-mini
  ```

If not set, AI features use honest rule-based fallback (no fake magic).

### 9. Push Notifications - VAPID (Optional)
**Generate:**
```bash
npx web-push generate-vapid-keys
```
Set:
```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@yourdomain.com
```

### 10. Redis - Upstash (Required for prod rate limiting multi-instance)
**Where:** https://console.upstash.com/redis

- Create Redis → Copy REST URL + Token
- Set:
  ```
  UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
  UPSTASH_REDIS_REST_TOKEN=xxx
  RATE_LIMIT_PROVIDER=upstash
  ```

Dev uses in-memory Map - OK for dev, not prod.

### 11. App URL (Required)
```
NEXT_PUBLIC_APP_URL=https://digital-bazar-three.vercel.app (your Vercel URL)
NEXT_PUBLIC_APP_URL=http://localhost:3000 (local dev)
```
Must be https in prod for secure httpOnly cookies.

### 12. Admin
```
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_INITIAL_PASSWORD=strong_random_password_32chars
```
Change immediately after first login.

## Vercel Deployment Checklist

1. **Add env vars in Vercel dashboard:**
   - Go to Project → Settings → Environment Variables
   - Add all from `.env.production.template`
   - Set `DATABASE_URL` to Neon/Supabase postgres URL
   - Set `JWT_SECRET` to `openssl rand -hex 32` output
   - Set `NEXT_PUBLIC_APP_URL` to your Vercel URL `https://...vercel.app`
   - Set `NODE_ENV=production`
   - Set `NEXT_PUBLIC_SHOW_DEMO_CREDS=false`
   - Set `OTP_ENABLED=false`
   - Set `STORAGE_PROVIDER=s3` or `r2` (not local)
   - Set real Razorpay live keys if you want real payments, or test keys for testing

2. **Deploy:**
   ```bash
   git push origin main
   # Vercel auto-deploys
   ```

3. **Database:**
   ```bash
   # Locally with prod DATABASE_URL
   DATABASE_URL="your_prod_postgres_url" npx prisma db push
   DATABASE_URL="your_prod_postgres_url" npx prisma db seed
   ```

4. **Verify:**
   - `https://yourdomain.com/api/admin/health` should show HEALTHY for database
   - Register → Search → Add to cart → Checkout → Razorpay → Order → Shop accept → QR → Complete
   - No `123456` in prod, no demo keys, no mock payments in prod logs

## Local Dev with Docker (Recommended Real)

```bash
# Start postgres + redis
docker-compose up -d

# Push schema
npm run db:push

# Seed
npm run db:seed

# Dev
npm run dev
```

## Env Files Explained

- `.env` - Local dev (postgres docker, demo Razorpay, OTP_ENABLED=true for 123456)
- `.env.example` - Template with all vars + comments (copy to .env)
- `.env.production.template` - Production template with REPLACE_WITH_REAL placeholders (copy to Vercel)
- `prisma/schema.prisma` - Postgres for prod (default)
- `prisma/schema.sqlite.prisma` - Sqlite for quick dev (alternative)

## Security Notes

- NEVER commit `.env` - it's in `.gitignore`
- NEVER use `123456` in production - set `OTP_ENABLED=false`
- NEVER use `rzp_test_` or `demo` keys in production for real payments
- NEVER use `local` storage in production - Vercel filesystem is ephemeral, files lost on deploy
- ALWAYS verify Razorpay signature server-side (already done in `lib/payments/razorpay.ts`)
- ALWAYS use paise integer for money (already done, no Float)
- ALWAYS HMAC QR single-use (already done)

## Support

- See `REAL_SETUP_GUIDE.md` for detailed A to Z
- See `docs/` for architecture, API, auth, database, etc.
- See `.env.example` for all vars with comments

## Quick Env Template for Copy-Paste to Vercel

Copy from `.env.production.template` and fill REAL values. All vars listed there with `REPLACE_WITH_REAL` placeholders.

For minimal real prod, you need at least:
```
DATABASE_URL=postgresql://...
JWT_SECRET=openssl_rand_hex_32
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
NEXT_PUBLIC_SHOW_DEMO_CREDS=false
OTP_ENABLED=false
STORAGE_PROVIDER=s3 (or r2) + S3 keys
RAZORPAY_KEY_ID=rzp_live_... + secrets (or rzp_test_... for testing)
```

Others optional with honest fallbacks.
