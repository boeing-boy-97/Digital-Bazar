# Database - Digital Bazar

## Provider
- Dev: SQLite file:./dev.db
- Prod: Postgres (Supabase) - change provider to postgresql and DATABASE_URL

## Models

### Users & Auth
- users: id, phone unique, email unique, passwordHash, role, isActive
- profiles: userId unique, avatar, bio, gstin
- shop_members: shopId, userId unique together, permission enum, isActive

### Shops
- shops: ownerId, name, slug unique, category, address, city, lat/lng, status enum PENDING_REVIEW/APPROVED/REJECTED/SUSPENDED/CLOSED, isPickupEnabled, isDeliveryEnabled, rating, reviewCount, gstin
- storage_zones: shopId, name, code unique per shop, sortOrder
- categories: shopId nullable (platform category if null), name, slug unique per shop, parentId self-ref

### Products
- products: shopId indexed, categoryId, storageZoneId, name, slug, sku unique, barcode, description, brand, unit, size, weight, price, compareAtPrice, discount, taxRate, hsnCode, stock, reservedStock, minOrderQty, maxOrderQty, lowStockThreshold, isActive, searchableText, embedding JSON
- product_variants: productId, name, sku unique, price, stock, attributes JSON
- product_images: productId, url, alt, sortOrder
- inventory: productId unique, available, reserved, sold, incoming, damaged
- inventory_transactions: shopId, productId, type IN/OUT/RESERVE/RELEASE/ADJUSTMENT/DAMAGE, quantity, previousQty, newQty, reason, actorId, orderId

### Cart & Orders
- carts: userId + shopId unique
- cart_items: cartId + productId + variantId unique, quantity, notes
- orders: orderNumber unique, customerId indexed, shopId indexed, status enum, subtotal, discount, tax, total, paymentMethod, paymentStatus, pickupType, pickupTime, deliveryAddress JSON, notes, qrToken unique, preparationProgress
- order_items: orderId, productId, productName snapshot, sku snapshot, variantName, quantity, unit, unitPrice snapshot, discount, taxRate, subtotal, storageZone, isPicked, pickedAt, pickedBy
- order_status_history: orderId, fromStatus, toStatus, actorId, reason
- invoices: orderId unique, invoiceNumber unique, data JSON snapshot, pdfUrl

### Payments
- payments: orderId, amount, method, status, provider, providerOrderId, providerPaymentId, signature, idempotencyKey unique
- payment_events: paymentId, type, data JSON

### Others
- addresses, favorites (userId+productId unique, userId+shopId unique), reviews, support_tickets, commissions, promotions, notifications, audit_logs, ai_conversations, ai_messages, ai_tool_calls, forecasts, platform_settings

## Indexes
- products shopId, name
- orders shopId+status, customerId
- audit_logs entity+entityId

## Constraints
- Foreign keys with Cascade where appropriate
- Unique: user phone, email, product sku, shop slug, orderNumber, qrToken, invoiceNumber, etc.

## Transactions
- Inventory reserve/release/confirm in $transaction
- Order creation: reserve all items → create order → clear cart in transaction (simplified as sequential with rollback on error)

## Seed Data
- 2 shops, 5 zones, 5 categories, 15 products with realistic Indian hardware data
- Users: customer, owner, employee, admin
- Zones: Building Material, Plumbing, Paint, Hardware, Electrical
