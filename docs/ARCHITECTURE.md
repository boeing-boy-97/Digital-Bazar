# Architecture - Digital Bazar

## Overview
Production-style local commerce platform with three experiences: Customer, Shopkeeper, Admin.

## Frontend
- Next.js 14 App Router, TypeScript strict
- CSS Modules + organized CSS files (variables, layout, forms, tables, components)
- Design tokens: --brand #0F766E, --background #F8FAFC, etc.
- Mobile-first, bottom nav for customer, sidebar for dashboards
- TanStack Query for data fetching, Zustand for cart (localStorage fallback)

## Backend
- Next.js API Routes as service boundary
- Prisma ORM with SQLite (dev) / Postgres (prod)
- JWT auth in httpOnly cookies, bcrypt
- RBAC middleware: customer, shop_owner, shop_employee, admin, super_admin
- Zod validation both client & server

## Core Workflows

### Order Creation (End-to-End)
```
Customer UI: Add to cart → Checkout
  ↓ POST /api/orders (server validates inventory, calculates totals, reserves stock)
  ↓ Transaction: reserve inventory + create order + snapshot items + status history + clear cart
  ↓ NotificationService: notify shopkeeper (in_app + push) + customer
  ↓ Realtime: SSE /api/realtime/orders?shopId=...
Shopkeeper UI: Receives new order instantly → Accept → status → PREPARING
```

### Automatic Zone Sorting (Core)
```ts
function sortOrderItemsByZone(items):
  group by storageZone
  sort zones by sortOrder
  sort items inside zone by category then name
  return Record<zone, items[]>
```
Shown in shopkeeper order detail as pick list with checkboxes.

### Inventory Safety
- checkInventory() before add to cart
- reserveInventory() in transaction on order create
- releaseInventory() on reject/cancel
- confirmInventoryDeduction() on completed
- All via Prisma $transaction, prevents oversell

### Payments
- POST /api/payments/create → server creates Razorpay order (never trust client amount)
- Frontend: Razorpay checkout with public key
- POST /api/payments/verify → server verifies signature HMAC SHA256
- POST /api/payments/webhook → verifies webhook signature, idempotency, updates payment + order
- Mock provider for dev when keys contain 'test' or 'demo'

### QR Verification
- Order has qrToken (secure random) + orderNumber
- Customer shows QR containing JSON {orderNumber, token, shopId}
- Shopkeeper POST /api/orders/[id]/verify → server validates token, shop matches, status is READY_FOR_PICKUP, not already completed
- Never trust client-side QR data alone

### AI Layer
- AIService class with OpenAI client lazy-loaded
- Fallback rule-based when no API key (so app works without key)
- Tools: generateShoppingList, parseSearchQuery, categorizeProduct, generateDescription, businessAssistant, identifyProductFromImage
- Permission-aware: customer tools only query allowed products, shopkeeper tools scoped to shopId
- Tool calls logged to ai_tool_calls table
- Prompt injection protection: treat product descriptions as untrusted, separate system/user/db content

## Realtime
- SSE endpoint /api/realtime/orders?orderId= or ?shopId=
- Polls DB every 3s, sends data: order_update, shop_orders, notifications
- Production upgrade: Redis PubSub + WebSockets
- Customer order detail subscribes to orderId, shopkeeper dashboard to shopId

## Notifications
- NotificationService abstraction
- Channels: in_app (always), push, email, sms
- Provider code isolated, mock logs when keys missing
- Events: order_placed, accepted, preparing, ready, completed, payment_received, etc.

## Security
- Auth: JWT, httpOnly, secure in prod, 7d expiry
- Passwords: bcrypt 12 rounds
- RBAC: middleware checks role, shop ownership via shopId
- Validation: Zod schemas
- Audit logs: actor, action, entity, metadata
- File upload: type, size, dimensions validation (ready)
- Secrets: only server, .env.example, .gitignore .env

## Performance
- Pagination (20 per page), lazy loading, debounced search
- Indexed fields: shopId, product name, order status
- Image optimization via Next.js remotePatterns
- Skeleton loaders, optimistic UI only where safe

## Testing Strategy
- Unit: inventory calculations, cart totals, state transitions, tax
- Integration: order creation + reserve, payment verify, notifications
- E2E: Customer login → shop → product → cart → order → track → complete
- Shopkeeper: receive → accept → pick → ready → complete
- Admin: review → approve
