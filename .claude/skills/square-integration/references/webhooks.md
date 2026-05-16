# Square Webhooks Reference

## Setup (Developer Console)
1. Developer Console → your app → Webhooks
2. Add notification URL (must be HTTPS in production; HTTP localhost OK for sandbox)
3. Select event types to subscribe to
4. Copy the **signature key** — you need it to validate incoming requests

---

## Key booking + payment event types
| Event | Trigger |
|-------|---------|
| `booking.created` | New booking created |
| `booking.updated` | Booking modified (time, service, etc.) |
| `booking.cancelled` | Booking cancelled |
| `payment.created` | Payment initiated |
| `payment.completed` | Payment successfully processed |
| `payment.failed` | Payment failed |
| `refund.created` | Refund issued |
| `customer.created` | New customer profile |
| `oauth.authorization.revoked` | Seller revoked OAuth access |

Full list: https://developer.squareup.com/docs/webhooks/v2-events

---

## Incoming event payload
```json
{
  "merchant_id": "MLXXXXXX",
  "type": "booking.created",
  "event_id": "uuid-unique-per-event",
  "created_at": "2025-03-01T10:00:00Z",
  "data": {
    "type": "booking",
    "id": "BOOKING_ID",
    "object": {
      "booking": { /* full Booking object */ }
    }
  }
}
```

---

## Signature validation (required in production)

Square sends `x-square-hmacsha256-signature` header with every request.
Validate using HMAC-SHA256 of: `{NOTIFICATION_URL}{RAW_BODY}`.

### Node.js / TypeScript
```typescript
import crypto from 'crypto';

function isValidSquareWebhook(
  body: string,           // raw request body as string
  signature: string,      // x-square-hmacsha256-signature header value
  signatureKey: string,   // from Developer Console → Webhooks
  notificationUrl: string // exact URL Square posts to
): boolean {
  const hmac = crypto.createHmac('sha256', signatureKey);
  hmac.update(notificationUrl + body);
  const expected = hmac.digest('base64');
  // Use timingSafeEqual to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}

// Express example:
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['x-square-hmacsha256-signature'] as string;
  const rawBody = req.body.toString('utf8');

  if (!isValidSquareWebhook(rawBody, sig, SIGNATURE_KEY, NOTIFICATION_URL)) {
    return res.status(403).send('Invalid signature');
  }

  const event = JSON.parse(rawBody);
  // process event...
  res.status(200).send('OK');
});
```

### Python
```python
import hmac
import hashlib
import base64

def is_valid_webhook(body: str, signature: str, sig_key: str, url: str) -> bool:
    payload = url + body
    mac = hmac.new(sig_key.encode(), payload.encode(), hashlib.sha256)
    expected = base64.b64encode(mac.digest()).decode()
    return hmac.compare_digest(expected, signature)
```

### Ruby (using SDK helper)
```ruby
require 'square'
valid = Square::WebhooksHelper.is_valid_webhook_event_signature(
  body, signature, SIGNATURE_KEY, NOTIFICATION_URL
)
```

### PHP (using SDK helper)
```php
use Square\Utils\WebhooksHelper;
$valid = WebhooksHelper::verifySignature($body, $signature, SIGNATURE_KEY, NOTIFICATION_URL);
```

---

## Idempotency for events
Use `event.event_id` as an idempotency key in your database.
Before processing, check if you've already handled this `event_id`.
This prevents duplicate processing on Square retries.

```typescript
// Pseudocode
const eventId = event.event_id;
if (await db.webhookEvents.exists({ eventId })) {
  return res.status(200).send('Already processed');
}
await db.webhookEvents.insert({ eventId, processedAt: new Date() });
// now process the event
```

---

## Retry behavior
Square retries failed webhooks (non-2xx or timeout) with exponential backoff.
Always return 200 quickly (acknowledge first, process async):

```typescript
res.status(200).send('OK'); // acknowledge immediately
setImmediate(async () => {
  await processEvent(event); // process async
});
```

---

## Production checklist
- [ ] HTTPS endpoint only (TLS 1.2+)
- [ ] Validate signature on every request
- [ ] Use `timingSafeEqual` / constant-time comparison
- [ ] Idempotency check via `event_id`
- [ ] Return 200 before processing (async processing)
- [ ] Subscribe to `oauth.authorization.revoked`
- [ ] Log all events for auditing
- [ ] Handle `booking.created`, `payment.completed`, `refund.created` at minimum
