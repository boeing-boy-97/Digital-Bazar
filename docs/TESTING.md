# Testing - Digital Bazar

## Unit Tests

### Inventory
- calculateCartTotals: subtotal, discount, tax, total
- Prevent overselling: available = stock - reserved, reject if requested > available
- Reserve, release, confirm deduction in transaction

### Cart
- Add item, update qty, remove, clear
- Stock validation, price revalidation
- One shop per cart

### Order State Machine
- Valid transitions: PENDING→ACCEPTED→PREPARING→READY_FOR_PICKUP→COMPLETED
- Invalid: PENDING→COMPLETED blocked, COMPLETED→PENDING blocked
- Cancellation allowed from early states

### Tax & Discount
- GST calculation, discount before tax, commission per category

### Auth
- Hash passwords, verify, JWT sign/verify, reject invalid tokens
- QR secure tokens, server-side validation only

## Integration Tests

### Order Creation
- Customer cart → POST /api/orders → inventory reserved → order created → cart cleared → notifications

### Payment
- Create Razorpay order server-side → verify signature → webhook → order paymentStatus CAPTURED

### Notifications
- Order events trigger in_app + push

### Auth
- Register, login, OTP, me, logout

## E2E Tests

### Customer
```
Login → /shops → /shops/[id] → /products/[id] → Add to cart → /cart → Place order → /orders/[id] → Track realtime → Ready notification → QR → Pay → Invoice
```

### Shopkeeper
```
Login → /shopkeeper → Receive realtime new order → Accept → View auto zone-sorted pick list → Pick items (checklist) → Mark ready → Customer notified → Scan QR → Complete → Inventory updated → Invoice
```

### Admin
```
Login → /admin/shops → Review pending → Approve → Shop becomes public
```

## Security Tests

- Unauthorized shop access → 403
- Cross-tenant: shop_owner A cannot access shop B → 403
- Invalid status update → 400
- Fake payment success without signature → fails
- Duplicate webhook → idempotent
- Duplicate order → idempotencyKey prevents double
- Malicious file upload → MIME validation
- Rate limit bypass → 429 (when implemented)
- Invalid QR → 400
- Expired session → 401
- Permission escalation: employee tries owner action → 403

## Running Tests

```bash
npm run test          # vitest run
npm run test:watch    # watch mode
```

## Test Data
- Seed creates realistic data: 2 shops, 15 products, 4 users
- Use test OTP 123456
- Use Razorpay test keys

## Coverage Goals
- Unit: 80%+ for inventory, cart, state machine, tax
- Integration: critical paths order, payment, auth
- E2E: full customer, shopkeeper, admin flows
