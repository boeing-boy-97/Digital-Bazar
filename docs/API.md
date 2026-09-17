# API - Digital Bazar

## Auth
- POST /api/auth/register - {name, phone?, email?, password?, role}
- POST /api/auth/login - {phone?, email?, password}
- POST /api/auth/otp - {phone, action: send|verify, otp?, name?}
- GET /api/auth/me - returns user from cookie
- POST /api/auth/logout - clears cookie

## Shops
- GET /api/shops?city=&category=&search=&lat=&lng= - list approved shops, distance calc if lat/lng
- POST /api/shops - create shop (shop_owner), auto creates 5 zones, status PENDING_REVIEW
- GET /api/shops/[id] - shop detail + products + categories + zones (id or slug)

## Products
- GET /api/products?shopId=&shopSlug=&category=&search=&q=&page=&limit=&inStock= - paginated
- POST /api/products - create product (shop_owner), validates shop ownership
- GET /api/products/[id] - product detail + related
- PUT /api/products/[id] - update
- DELETE /api/products/[id] - soft deactivate

## Cart
- GET /api/cart - user's carts with items
- POST /api/cart/add - {shopId, productId, variantId?, quantity, notes?} - checks inventory
- PUT /api/cart/add - {itemId, quantity} - update qty
- DELETE /api/cart/add?itemId=&cartId= - remove item or clear cart

## Orders
- GET /api/orders?shopId=&status= - RBAC: customer sees own, shop_owner sees shop's, admin sees all
- POST /api/orders - {shopId, paymentMethod, pickupType, pickupTime?, deliveryAddress?, notes?, promotionCode?} - validates cart, reserves inventory, creates immutable snapshot, notifies
- GET /api/orders/[id] - detail + sortedByZone (auto zone sorting)
- POST /api/orders/[id]/status - {status, reason?} - validates transition via canTransition(), handles inventory release/confirm, creates history, audit log, notifies
- POST /api/orders/[id]/verify - {qrToken, orderNumber} - verifies QR, checks shop match, status READY, not already completed

## Payments
- POST /api/payments/create - {orderId} - creates Razorpay order server-side, idempotencyKey, payment record CREATED
- POST /api/payments/verify - {razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId} - verifies HMAC, updates payment CAPTURED, order paymentStatus, event
- POST /api/payments/webhook - raw body, x-razorpay-signature header - verifies webhook signature, handles payment.captured/failed, idempotent

## AI
- POST /api/ai/assistant - {message, conversationId?, shopId?} - smart shopping assistant or business assistant, creates conversation, logs tool calls, returns structured response
- GET /api/ai/assistant - list conversations for user
- POST /api/ai/search - {query, shopId?} - parse natural language to filters, search DB, never invents products
- POST /api/ai/categorize - {productName, description?} - categorize + generate description, requires shop_owner role
- POST /api/ai/vision - {imageBase64, shopId?} - identify product from image via vision model, search catalog

## Realtime
- GET /api/realtime/orders?orderId=&shopId= - SSE stream, polls every 3s, sends order_update, shop_orders, notifications

## Admin
- GET /api/admin/shops?status= - list shops, admin only
- POST /api/admin/shops - {shopId, action: approve|reject|suspend|activate, reason?} - updates status, audit log

## Validation
- All POST/PUT use Zod schemas from lib/validation/schemas.ts
- Valid transitions map for order status

## Security
- Auth via httpOnly cookie auth-token, verified with JWT_SECRET
- RBAC checks in each route
- Shop ownership checks: shop.ownerId === userId or shopMember
- No secrets in responses
