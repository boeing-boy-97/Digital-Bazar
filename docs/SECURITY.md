# Security - Digital Bazar

## Authentication
- JWT httpOnly cookies, SameSite lax, secure in prod, 7d expiry
- bcrypt 12 rounds, never plaintext
- OTP: 6-digit, 5min expiry, in-memory Map (should be Redis), rate limiting ready, test code 123456 only when OTP_ENABLED=true
- Session: getSession() checks isActive, profile
- Logout clears cookie

## Authorization & Tenant Isolation
- RBAC: customer, shop_owner, shop_employee, admin, super_admin
- Middleware protects /shopkeeper, /admin, /orders, /cart, /profile
- API checks: role + shop ownership via ownerId or shopMember table
- Every product/order/inventory query scoped by shopId
- Shop owner can NEVER access another shop's private data - enforced via where clause + FK
- Employee permissions granular: picker, inventory_manager, billing_employee, delivery_employee, manager - never auto owner
- Admin explicit and audited

## Validation
- Zod schemas: register, login, shopCreate, productCreate, cartAdd, orderCreate, orderStatusUpdate, storageZone
- Client + server validation, never rely only on client
- Valid transitions map for order state machine, enforced server-side

## Payments Security
- Secrets only server: RAZORPAY_KEY_SECRET, WEBHOOK_SECRET
- Public key only in NEXT_PUBLIC_
- Signature verification HMAC SHA256 for payment and webhook
- IdempotencyKey unique
- Never trust client "payment successful" flag
- Webhook replay protection

## QR Security
- Secure random QR token QR- + 12 chars alphanumeric
- QR data: JSON {orderNumber, token, shopId, timestamp}
- Server validates: order exists, shop matches, status READY_FOR_PICKUP or OUT_FOR_DELIVERY, not COMPLETED, token matches
- Token does not expose sensitive data

## File Upload
- Validate MIME type, extension, file size, dimensions
- Never trust filename alone
- Store outside public filesystem where possible (S3)
- Ready for S3-compatible storage

## API Security
- Rate limiting ready for auth, OTP, AI, search, checkout, payment, upload
- Input validation via Zod
- SQL injection prevention via Prisma ORM (parameterized)
- XSS protection via React escaping, no dangerouslySetInnerHTML
- CSRF via SameSite lax cookies
- Secure cookies: httpOnly, secure in prod
- Secret management via .env, .env.example, .gitignore .env

## Audit Logging
- audit_logs: actorId, action, entity, entityId, metadata JSON, timestamp
- Tracked: USER_REGISTERED, USER_LOGIN, SHOP_CREATED, SHOP_APPROVED, PRODUCT_CREATED, ORDER_CREATED, ORDER_STATUS_CHANGED, PAYMENT_VERIFIED, etc.
- Indexed by entity+entityId

## Privacy
- Only collect necessary data
- Separate transactional, analytics, AI conversation data
- Retention settings ready
- Do not send unnecessary PII to OpenAI - only product names, not customer phone/email unless needed
- AI conversations store messages, tool calls, timestamp, allow deletion per privacy policy

## Security Tests
- Unauthorized shop access: try to fetch another shop's orders → 403
- Cross-tenant: shop_owner A cannot access shop B products → 403
- Invalid status transition: PENDING→COMPLETED → 400
- Fake payment: client says success without signature → fails verification
- Duplicate webhook: same event twice → idempotent, no double update
- Invalid QR: wrong token → 400
- Expired session: no cookie → 401
- Permission escalation: employee tries owner action → 403

## Checklist
- [x] No secrets in frontend bundles
- [x] .env not committed
- [x] bcrypt passwords
- [x] JWT httpOnly
- [x] RBAC enforced
- [x] Tenant isolation via DB queries
- [x] Zod validation
- [x] Audit logs
- [x] Webhook signature verification
- [x] QR server-side validation
- [x] File validation ready
- [ ] Rate limiting implementation (ready, needs Redis)
- [ ] 2FA (future)
- [ ] CSP headers (future)
