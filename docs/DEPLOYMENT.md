# Deployment - Digital Bazar

## Local Development
```bash
npm install
cp .env.example .env
# Set DATABASE_URL="file:./dev.db" and JWT_SECRET
npm run db:push
npm run db:seed
npm run dev
```

## Environment Variables
See .env.example:
- DATABASE_URL: file:./dev.db for dev, postgres://... for prod (Supabase)
- JWT_SECRET: min 32 chars
- RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, NEXT_PUBLIC_RAZORPAY_KEY_ID
- OPENAI_API_KEY, OPENAI_MODEL
- MAPS_API_KEY, NEXT_PUBLIC_MAPS_API_KEY
- EMAIL_API_KEY, SMS_API_KEY, etc.
- FEATURE flags: AI_ASSISTANT, IMAGE_SEARCH, VOICE_SHOPPING, ONLINE_PAYMENT, etc.

## Production

### Frontend: Vercel
1. Push to GitHub
2. Import in Vercel
3. Set env vars in Vercel dashboard (same as .env.example, but real values)
4. Build command: `npm run build` (runs prisma generate)
5. Output: Next.js

### Database: Supabase
1. Create Supabase project
2. Get DATABASE_URL (postgres)
3. Set in Vercel env
4. Run migrations: `npx prisma migrate deploy` or `prisma db push` for initial
5. Seed: optional, don't seed prod with demo credentials

### Auth
- JWT_SECRET must be strong random in prod
- OTP_ENABLED=false in prod, use real SMS provider
- Implement rate limiting for OTP

### Payments
- Set RAZORPAY_KEY_ID to live key (rzp_live_...)
- Set webhook secret and configure webhook URL in Razorpay dashboard: https://yourdomain.com/api/payments/webhook
- Test with Razorpay test mode first (rzp_test_...)

### AI
- Set OPENAI_API_KEY to real key
- Monitor usage, set rate limits

### Storage
- For product images, shop logo: use S3 or Supabase Storage
- Set STORAGE_* vars, implement upload in lib/storage

### Maps
- Use Google Maps or Mapbox via server-side API
- Never expose private key, use NEXT_PUBLIC_ for public key only

## Security Checklist
- [ ] JWT_SECRET strong
- [ ] .env not committed
- [ ] RAZORPAY secrets only server
- [ ] OPENAI_API_KEY only server
- [ ] CORS configured
- [ ] Rate limiting on auth, OTP, payments
- [ ] File upload validation
- [ ] Webhook signature verification enabled
- [ ] Audit logs enabled
- [ ] HTTPS only

## Monitoring
- Structured logging in API routes
- Optionally Sentry for error monitoring
- Track payment failures, inventory failures, AI failures

## Scaling
- Replace SSE polling with Redis PubSub + WebSockets (e.g., Pusher, Ably, or custom)
- Move to Postgres with connection pooling
- Use Vercel KV or Redis for OTP store (currently in-memory)
- CDN for images
