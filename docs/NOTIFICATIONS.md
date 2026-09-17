# Notifications - Digital Bazar

## Service
- lib/notifications/service.ts
- Abstraction: NotificationService with notify() method
- Channels: in_app (always), push, email, sms, whatsapp (where configured)
- Provider code isolated, mock logs when keys missing

## Events
```
order_created → customer + shopkeeper
order_accepted → customer
order_rejected → customer
order_preparing → customer
order_delayed → customer
item_unavailable → customer (WAITING_FOR_CUSTOMER_APPROVAL)
approval_required → customer
order_ready → customer (Ready for Pickup! 🎉 + QR)
payment_success → customer
payment_failure → customer
invoice_ready → customer
refund_processed → customer
new_order_shop → shopkeeper (New Order Received! 🔔)
low_stock → shopkeeper
```

## Implementation
```ts
notify({userId, orderId, type, title, message, channels, data})
→ For each channel:
  if in_app && userId: prisma.notification.create({userId, orderId, type, title, message, channel})
  if email: sendEmail() → checks EMAIL_API_KEY, else console.log mock
  if sms: sendSMS() → checks SMS_API_KEY
  if push: sendPush() → checks FEATURE_PUSH_NOTIFICATIONS
```

## Helpers
- notifyCustomer(orderId, type, customMessage?) → fetches order + shop, uses template messages
- notifyShopkeeper(shopId, type, orderId?) → fetches shop owner, notifies

## Templates
- order_placed: "Your order #XYZ placed at Shop"
- order_accepted: "Great! Shop accepted your order"
- order_ready: "Order Ready for Pickup! Show QR at counter"
- new_order_shop: "New order #XYZ - ₹total. Accept now"

## Preferences
- notification_preferences table ready (future)
- Customer controls push, email, SMS, marketing
- Transactional vs marketing distinguishable

## Realtime
- SSE /api/realtime/orders polls notifications where userId and isRead false
- Frontend shows unread count, marks read on view

## Providers (Pluggable)
- Email: SendGrid, SES, etc. - isolated in sendEmail()
- SMS: Twilio, MSG91, etc. - isolated in sendSMS()
- Push: Web Push VAPID - VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
- WhatsApp: where legally appropriate

## Testing
- Without keys, logs to console: [EMAIL MOCK], [SMS MOCK], [PUSH MOCK]
- In-app always works, visible at /notifications

## Future
- Queue via BullMQ for async sending
- Templates with i18n (English, Hindi, Marathi)
- Digest emails
- Notification preferences UI
