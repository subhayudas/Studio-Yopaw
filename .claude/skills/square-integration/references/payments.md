# Square Payments Reference

## Options overview

| Method | Frontend needed? | Best for |
|--------|-----------------|----------|
| Web Payments SDK | Yes (browser) | Custom checkout in your React/web app |
| Checkout API | No | Quick hosted checkout page (redirect) |
| Payments API | Server-only | Card on file, server-side payment creation |
| Terminal API | Hardware | In-person Square Terminal |
| Mobile Payments SDK | iOS/Android | Native mobile apps |

---

## Web Payments SDK (React / browser)

The browser-side SDK tokenizes card data so raw card numbers never touch your server.

### Install
```bash
# No npm install needed — load via CDN in HTML/JSX
# <script src="https://web.squarecdn.com/v1/square.js"></script>

# Or for React, use the official React wrapper
npm install react-square-web-payments-sdk
```

### Initialize (vanilla JS/TS)
```typescript
const payments = window.Square.payments(APP_ID, LOCATION_ID);
// For sandbox:
// const payments = window.Square.payments(APP_ID, LOCATION_ID, { environment: 'sandbox' });
```

### Render card form
```typescript
const card = await payments.card();
await card.attach('#card-container'); // mounts iframe into this div

// On submit:
const result = await card.tokenize();
if (result.status === 'OK') {
  const nonce = result.token; // send this to your server
}
```

### Server: create payment with nonce
```bash
POST /v2/payments
{
  "idempotency_key": "uuid-here",
  "source_id": "{NONCE_FROM_FRONTEND}",
  "amount_money": {
    "amount": 5000,   // in smallest currency unit (cents for USD/CAD)
    "currency": "CAD"
  },
  "location_id": "LOCATION_ID",
  "customer_id": "CUSTOMER_ID",   // optional but recommended
  "reference_id": "booking-abc123" // your internal reference
}
```

### Digital wallets
```typescript
// Google Pay
const googlePay = await payments.googlePay(paymentRequest);
await googlePay.attach('#google-pay-button');

// Apple Pay
const applePay = await payments.applePay(paymentRequest);
await applePay.attach('#apple-pay-button');

// Payment request object:
const paymentRequest = payments.paymentRequest({
  countryCode: 'CA',
  currencyCode: 'CAD',
  total: { amount: '50.00', label: 'Yoga Class' }
});
```

---

## Checkout API (no frontend required)
Redirect customer to Square-hosted checkout page.

```bash
POST /v2/online-checkout/payment-links
{
  "idempotency_key": "uuid-here",
  "quick_pay": {
    "name": "Pet Yoga Class",
    "price_money": { "amount": 3500, "currency": "CAD" },
    "location_id": "LOCATION_ID"
  },
  "checkout_options": {
    "redirect_url": "https://yourapp.com/success",
    "ask_for_shipping_address": false
  }
}
```
Response includes `payment_link.url` — redirect customer to it.

---

## Payments API (server-side)

### Create payment
```bash
POST /v2/payments
{
  "idempotency_key": "uuid",
  "source_id": "nonce_or_card_on_file_id",
  "amount_money": { "amount": 3500, "currency": "CAD" },
  "location_id": "...",
  "autocomplete": true  // false = delayed capture
}
```

### Card on file
```bash
# Save a card (requires customer_id + nonce)
POST /v2/cards
{
  "idempotency_key": "uuid",
  "source_id": "{NONCE}",
  "card": { "customer_id": "CUSTOMER_ID" }
}
# Returns card.id — use as source_id for future payments

# Charge card on file
POST /v2/payments
{ "source_id": "card_id_from_above", ... }
```

### Retrieve payments
```bash
GET /v2/payments?location_id={LOC}&begin_time=2025-03-01T00:00:00Z&end_time=2025-03-31T23:59:59Z
```

### Refund
```bash
POST /v2/refunds
{
  "idempotency_key": "uuid",
  "payment_id": "PAYMENT_ID",
  "amount_money": { "amount": 3500, "currency": "CAD" },
  "reason": "Customer cancelled class"
}
```

---

## Amount encoding rules
- All amounts are integers in the **smallest currency unit**
- CAD/USD: cents → `$35.00 = 3500`
- JPY: yen (no decimal) → `¥500 = 500`
- Always pass `currency` explicitly

---

## Payment status lifecycle
`PENDING` → `COMPLETED` (normal)
`PENDING` → `APPROVED` (delayed capture) → `COMPLETED`
`PENDING` / `COMPLETED` → `CANCELED` / `FAILED`

---

## Sandbox test card numbers
| Card | Number |
|------|--------|
| Visa (success) | 4111 1111 1111 1111 |
| Visa (declined) | 4000 0000 0000 0002 |
| Mastercard | 5105 1051 0510 5100 |
CVV: any 3 digits. Expiry: any future date.
