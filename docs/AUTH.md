# Auth - Digital Bazar

## Overview
Real authentication with JWT httpOnly cookies, bcrypt, OTP, RBAC, tenant isolation.

## Flows

### Register
```
POST /api/auth/register {name, phone?, email?, password?, role}
→ Zod validation
→ Check existing phone/email
→ bcrypt hash 12 rounds
→ Create user + profile
→ Audit log USER_REGISTERED
→ signToken({userId, role, phone, email}) 7d expiry
→ Set cookie auth-token httpOnly, secure in prod, SameSite lax
```

### Login Password
```
POST /api/auth/login {phone?, email?, password}
→ Find user by phone/email
→ Check isActive
→ verifyPassword
→ signToken
→ Set cookie
→ Audit log USER_LOGIN
```

### OTP
```
POST /api/auth/otp {phone, action: send}
→ generateOTP() → if OTP_ENABLED=true returns test code 123456
→ Store in memory Map phone→{otp, expires 5min}
→ In prod, send via SMS provider (abstracted)

POST /api/auth/otp {phone, otp, action: verify, name?}
→ Check stored otp or test code
→ Find or create user
→ signToken + cookie
```

### Me & Logout
```
GET /api/auth/me → reads cookie, verifyToken, fetch user
POST /api/auth/logout → delete cookie
```

## JWT
- lib/auth/jwt.ts: signToken, verifyToken, hashPassword, verifyPassword, generateOTP, generateOrderNumber, generateQRToken, generateInvoiceNumber
- Secret: JWT_SECRET env, min 32 chars, fail fast in prod if missing
- Payload: userId, role, phone, email

## Session
- lib/auth/session.ts: getSession() reads cookies(), verifyToken, fetch user + profile, check isActive
- requireAuth(allowedRoles) throws Unauthorized/Forbidden

## RBAC
- Roles: customer, shop_owner, shop_employee, admin, super_admin
- Middleware: checks auth-token exists for /shopkeeper, /admin, /orders, /cart, /profile
- API: each route verifies role, shop ownership via ownerId or shopMember
- Tenant isolation: every product/order query scoped by shopId, shopId checked against user's owned shops or memberships

## Security
- Passwords never stored plaintext, bcrypt 12
- OTP rate limiting ready (in-memory store should be Redis in prod)
- Session expiration 7d, logout clears cookie
- No secrets in frontend, .env.example
- Audit logs for register, login

## Future
- Device/session management
- 2FA
- OAuth (Google)
- Refresh tokens
