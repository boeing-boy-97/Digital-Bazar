# Payments - Digital Bazar

## Provider
- Razorpay for India (UPI, Cards, NetBanking, Pay at Store)
- Official SDK: razorpay npm package (server-side only)
- Test mode: keys containing 'test' or 'demo' → mock responses, no real charge
- Prod: requires live keys, webhook secret

## Architecture
```
Customer Checkout → POST /api/payments/create {orderId}
  → Server validates order belongs to customer, not already paid
  → razorpayService.createOrder(amount, receipt) → providerOrderId
  → Create payment record status CREATED, idempotencyKey
  → payment_event ORDER_CREATED
  → Return {payment, razorpayOrder, keyId, amount*100}

Frontend: Razorpay Checkout with keyId, amount, order_id
  → User pays via UPI/Card
  → Razorpay returns {razorpay_order_id, razorpay_payment_id, razorpay_signature}

Frontend → POST /api/payments/verify {order_id, payment_id, signature, orderId}
  → verifyPaymentSignature: HMAC SHA256 order_id|payment_id with key_secret
  → If valid: update payment CAPTURED, providerPaymentId, signature
  → payment_event PAYMENT_CAPTURED
  → Update order paymentStatus CAPTURED
  → notifyCustomer payment_received

Webhook: POST /api/payments/webhook (raw body)
  → Header x-razorpay-signature
  → verifyWebhookSignature: HMAC SHA256 payload with webhook_secret
  → Idempotency: check if already processed
  → Handle payment.captured → update payment CAPTURED, order CAPTURED
  → Handle payment.failed → update FAILED
  → Return {status: ok}
```

## States
- Payment: CREATED, PENDING, AUTHORIZED, CAPTURED, FAILED, CANCELLED, REFUND_PENDING, REFUNDED, PARTIALLY_REFUNDED
- Order paymentStatus separate from order status
- Never trust client "success" flag

## Security
- Secrets only server: RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
- Public key: NEXT_PUBLIC_RAZORPAY_KEY_ID exposed to frontend (safe)
- Signature verification server-side
- IdempotencyKey unique per payment attempt
- Webhook replay protection via idempotency check
- Audit logs

## Refunds
```
POST refund via razorpayService.refundPayment(paymentId, amount?, notes?)
→ In test mode returns mock rfnd_*
→ In prod: instance.payments.refund(paymentId, {amount, notes})
→ Update payment REFUNDED, order REFUND_PENDING → REFUNDED
→ payment_event REFUND_PROCESSED
→ notifyCustomer refund_processed
```

## Testing
- Use Razorpay test keys: rzp_test_xxx
- Test cards: 4111 1111 1111 1111
- Test UPI: success@razorpay
- Webhook testing via Razorpay dashboard
- Mock provider when keys contain demo/test → no real network call

## Edge Cases
- Payment succeeds but browser closes → webhook still updates order via providerOrderId
- Webhook arrives twice → idempotency check prevents duplicate
- Payment fails → order remains PENDING, customer can retry
- Duplicate order submission → idempotencyKey prevents double charge
- Refund requested after completion → creates REFUND_PENDING, admin approves

## Future
- Partial payments, advance payments
- COD, Pay at Store already supported
- Subscription for shop owners
- Reconciliation job daily
