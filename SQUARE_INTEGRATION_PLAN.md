# Square Integration Plan — Studio-Yopaw
> Goal: "Connected to Square and working to capture leads and payments"
> Stack: React 19 + TypeScript + Vite → deployed on **Vercel** (serverless functions)
> Email forwarding: **Resend** (no database; leads and payments go straight to inbox)

---

## Overview

Unlike Vagaro (which provides a bookable iframe), Square exposes raw APIs that power your own UI.
This means the **existing multi-step booking form in `PricingSection`** stays — we wire it to Square
instead of replacing it. Square handles three things:

| Layer | Square product | What it replaces |
|---|---|---|
| **Availability** | Bookings API — `SearchAvailability` | The hardcoded `SESSION_TIME_SLOTS` + `buildNextWeekendSessions()` |
| **Card capture** | Web Payments SDK (browser) | The current "Book Spot" submit (no payment today) |
| **Server events** | Webhooks | — (new: lead + payment email notifications) |

---

## Phase 0 — Square Prerequisites *(~30 minutes, no approval wait)*

> Square doesn't require manual approval — you get sandbox access instantly and production access after basic account verification.

### 0.1 Create a Square developer account
1. Go to [developer.squareup.com](https://developer.squareup.com) → **Get started**
2. Sign in with an existing Square account or create one

### 0.2 Create an application in the Developer Console
1. Developer Console → **New Application** → name it `Studio Yopaw`
2. On the **Credentials** page, note:
   - **Sandbox application ID** (`sq0idp-...`)
   - **Sandbox access token** (`EAAAl...` — only works with sandbox URLs)
   - **Production application ID**
   - **Production access token**

### 0.3 Check plan requirements
For the Bookings API with **seller-level write access** (creating bookings on behalf of the studio):
the seller account must be on **Appointments Plus — $35 CAD/month** or Premium.

> If the client is already using Square Appointments in their business, they likely already have this.
> Buyer-level scopes (`APPOINTMENTS_READ` / `APPOINTMENTS_WRITE`) work on the free plan but
> have limited visibility. Confirm with the client before building.

### 0.4 Configure the seller account in Square Dashboard
Before the API can return real data:
- Add **locations** (at least one)
- Add **services** (class types: Yin Yoga, Gentle Yoga, Corporate) with prices + durations
- Add **team members** and assign them to services
- Enable **Online Booking** for the location

### 0.5 Credentials checklist

| Variable | Where to find it |
|---|---|
| `SQUARE_APP_ID` | Developer Console → Credentials → Application ID |
| `SQUARE_ACCESS_TOKEN` | Developer Console → Credentials → Access Token |
| `SQUARE_LOCATION_ID` | Square Dashboard → Account → Business locations, or `GET /v2/locations` |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | Developer Console → Webhooks → your endpoint → Signature key (Phase 5) |
| `VITE_SQUARE_APP_ID` | Same as `SQUARE_APP_ID` — safe to expose in browser for Web Payments SDK |
| `VITE_SQUARE_LOCATION_ID` | Same as `SQUARE_LOCATION_ID` — needed by Web Payments SDK |

---

## Phase 1 — Deploy to Vercel *(Do this now)*

Getting a live HTTPS URL early lets us register the webhook endpoint in Square's Developer Console.

### 1.1 Connect the repo to Vercel
1. Push to GitHub (already done).
2. [vercel.com](https://vercel.com) → **New Project** → import `Studio-Yopaw`.
3. Framework preset: **Vite** (auto-detected). Deploy.
4. Note the assigned URL: `studio-yopaw.vercel.app`

### 1.2 Add environment variables
`Project → Settings → Environment Variables`. Add all vars from Phase 0.5 plus:

| Variable | Value |
|---|---|
| `SQUARE_ENVIRONMENT` | `sandbox` (change to `production` when going live) |
| `RESEND_API_KEY` | From [resend.com](https://resend.com) (free: 3,000 emails/month) |
| `LEAD_NOTIFY_EMAIL` | Studio inbox for new booking notifications |
| `PAYMENT_NOTIFY_EMAIL` | Studio inbox for payment confirmations (can be the same) |

### 1.3 Add `vercel.json`

```json
{
  "functions": {
    "api/**/*.ts": {
      "memory": 256,
      "maxDuration": 15
    }
  }
}
```

---

## Phase 2 — Install Dependencies

```bash
npm install square resend @vercel/node
npm install react-square-web-payments-sdk
```

| Package | Purpose |
|---|---|
| `square` | Official Square TypeScript SDK — Bookings API, Payments API, Customers API |
| `react-square-web-payments-sdk` | React wrapper for Square Web Payments SDK (card tokenization in browser) |
| `resend` | Email delivery for lead + payment notifications |
| `@vercel/node` | Types for Vercel serverless function handlers |

---

## Phase 3 — Vercel Serverless Functions

Three API routes, each a `.ts` file in the `api/` folder at the project root.

### 3.1 Square client helper `api/_square.ts`

Shared client — import this in every other API function. The underscore prefix tells Vercel not to expose it as an HTTP route.

```typescript
import { SquareClient, SquareEnvironment } from 'square'

export const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment:
    process.env.SQUARE_ENVIRONMENT === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
})
```

---

### 3.2 Availability endpoint `api/availability.ts`

Called by the frontend to populate the date/time picker with real Square availability instead of the current hardcoded sessions.

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { square } from './_square'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const { serviceVariationId, startDate, endDate } = req.query as Record<string, string>

  const result = await square.bookings.searchAvailability({
    query: {
      filter: {
        startAtRange: {
          startAt: `${startDate}T00:00:00Z`,
          endAt: `${endDate}T23:59:59Z`,
        },
        locationId: process.env.SQUARE_LOCATION_ID!,
        segmentFilters: [
          {
            serviceVariationId,
            // Omit teamMemberIdFilter to return any available team member
          },
        ],
      },
    },
  })

  return res.status(200).json({ availabilities: result.availabilities ?? [] })
}
```

---

### 3.3 Booking + payment endpoint `api/booking.ts`

The core function. Called on form submit. Creates (or finds) the Square customer, creates the booking, and processes the payment using the card nonce from the browser.

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomUUID } from 'crypto'
import { Resend } from 'resend'
import { square } from './_square'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const {
    givenName,
    familyName,
    email,
    phone,
    serviceVariationId,
    serviceVariationVersion,
    teamMemberId,
    startAt,
    cardNonce,          // token from Square Web Payments SDK
    amountCents,        // e.g. 3500 for $35.00 CAD
  } = req.body as {
    givenName: string
    familyName: string
    email: string
    phone: string
    serviceVariationId: string
    serviceVariationVersion: number
    teamMemberId: string
    startAt: string
    cardNonce: string
    amountCents: number
  }

  // 1. Find or create customer (avoids duplicates)
  const searchResult = await square.customers.search({
    query: { filter: { emailAddress: { exact: email } } },
  })

  let customerId = searchResult.customers?.[0]?.id
  if (!customerId) {
    const { customer } = await square.customers.create({
      idempotencyKey: randomUUID(),
      givenName,
      familyName,
      emailAddress: email,
      phoneNumber: phone,
    })
    customerId = customer!.id!
  }

  // 2. Create the booking
  const { booking } = await square.bookings.create({
    idempotencyKey: randomUUID(),
    booking: {
      locationId: process.env.SQUARE_LOCATION_ID!,
      customerId,
      startAt,
      appointmentSegments: [
        {
          serviceVariationId,
          serviceVariationVersion: BigInt(serviceVariationVersion),
          teamMemberId,
        },
      ],
    },
  })

  // 3. Process payment
  const { payment } = await square.payments.create({
    idempotencyKey: randomUUID(),
    sourceId: cardNonce,
    amountMoney: { amount: BigInt(amountCents), currency: 'CAD' },
    locationId: process.env.SQUARE_LOCATION_ID!,
    customerId,
    referenceId: booking!.id,
  })

  // 4. Send lead notification email
  await resend.emails.send({
    from: 'Studio Yopaw <noreply@studio-yopaw.com>',
    to: process.env.LEAD_NOTIFY_EMAIL!,
    subject: `New Booking — ${givenName} ${familyName}`,
    html: `
      <h2>New booking confirmed</h2>
      <p><strong>Customer:</strong> ${givenName} ${familyName} (${email})</p>
      <p><strong>Start:</strong> ${startAt}</p>
      <p><strong>Booking ID:</strong> ${booking!.id}</p>
      <p><strong>Payment:</strong> $${(amountCents / 100).toFixed(2)} CAD — ${payment!.status}</p>
    `,
  })

  return res.status(200).json({ bookingId: booking!.id, paymentStatus: payment!.status })
}
```

---

### 3.4 Webhook receiver `api/square-webhook.ts`

Receives Square server events. Validates the HMAC-SHA256 signature (Square's algorithm: `base64(hmac(signatureKey, notificationUrl + rawBody))`).

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const NOTIFICATION_URL = 'https://studio-yopaw.vercel.app/api/square-webhook'

function isValidSignature(rawBody: string, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', process.env.SQUARE_WEBHOOK_SIGNATURE_KEY!)
  hmac.update(NOTIFICATION_URL + rawBody)
  const expected = hmac.digest('base64')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const signature = (req.headers['x-square-hmacsha256-signature'] as string) ?? ''
  const rawBody = JSON.stringify(req.body) // Vercel parses JSON — re-stringify for verification

  if (!isValidSignature(rawBody, signature)) {
    return res.status(403).json({ error: 'Invalid signature' })
  }

  // Acknowledge immediately — Square retries on non-2xx
  res.status(200).send('OK')

  const event = req.body as { type: string; event_id: string; data: Record<string, unknown> }

  if (event.type === 'payment.completed') {
    const payment = (event.data as { object: { payment: Record<string, unknown> } }).object.payment
    await resend.emails.send({
      from: 'Studio Yopaw <noreply@studio-yopaw.com>',
      to: process.env.PAYMENT_NOTIFY_EMAIL!,
      subject: 'Payment Completed',
      html: `
        <h2>Payment completed</h2>
        <p><strong>Amount:</strong> $${Number((payment.amount_money as { amount: number }).amount) / 100} CAD</p>
        <p><strong>Payment ID:</strong> ${payment.id}</p>
        <p><strong>Reference:</strong> ${payment.reference_id ?? '—'}</p>
      `,
    })
  }

  if (event.type === 'customer.created') {
    const customer = (event.data as { object: { customer: Record<string, unknown> } }).object.customer
    await resend.emails.send({
      from: 'Studio Yopaw <noreply@studio-yopaw.com>',
      to: process.env.LEAD_NOTIFY_EMAIL!,
      subject: 'New Customer in Square',
      html: `
        <h2>New customer created</h2>
        <p><strong>Name:</strong> ${customer.given_name} ${customer.family_name}</p>
        <p><strong>Email:</strong> ${customer.email_address ?? '—'}</p>
        <p><strong>Phone:</strong> ${customer.phone_number ?? '—'}</p>
      `,
    })
  }
}
```

> **Raw body note:** Square's signature is computed over the raw request body string. Vercel's JSON body parser re-serializes slightly differently than the original bytes. For production, configure Vercel to pass raw body bytes, or use `express.raw` in a custom server setup. The `JSON.stringify(req.body)` approach works for most payloads but may fail on edge cases with Unicode or key ordering. The safest fix is to read the raw stream directly — see [Vercel raw body docs](https://vercel.com/docs/functions/runtimes/node-js#advanced-usage).

---

## Phase 4 — Frontend: Wire the Booking Form to Square

The existing multi-step UI in `PricingSection` (`App.tsx`) is kept almost entirely intact.
Only the **data layer** changes — real Square availability replaces hardcoded sessions,
and a card tokenization step replaces the mock submit.

### 4.1 Service ID mapping `src/lib/squareServices.ts`

Create a lookup that maps the existing UI class choices to Square catalog IDs.
Fill in the real IDs after configuring services in Square Dashboard.

```typescript
// Fill these in from Square Dashboard → Items → your services
export const SQUARE_SERVICE_VARIATIONS: Record<string, {
  serviceVariationId: string
  serviceVariationVersion: number
  teamMemberId: string
  amountCents: number
}> = {
  yin: {
    serviceVariationId: 'XXXXXXXXXXXXXXXXX',
    serviceVariationVersion: 0,
    teamMemberId:   'XXXXXXXXXXXXXXXXX',
    amountCents: 3500,
  },
  gentle: {
    serviceVariationId: 'XXXXXXXXXXXXXXXXX',
    serviceVariationVersion: 0,
    teamMemberId:   'XXXXXXXXXXXXXXXXX',
    amountCents: 3500,
  },
  corporate: {
    serviceVariationId: 'XXXXXXXXXXXXXXXXX',
    serviceVariationVersion: 0,
    teamMemberId:   'XXXXXXXXXXXXXXXXX',
    amountCents: 15000,
  },
}
```

### 4.2 Availability fetch `src/hooks/useSquareAvailability.ts`

Replaces `buildNextWeekendSessions()` with a live API call.

```typescript
import { useEffect, useState } from 'react'

export interface SquareSlot {
  startAt: string  // ISO 8601
}

export function useSquareAvailability(serviceVariationId: string, startDate: string, endDate: string) {
  const [slots, setSlots] = useState<SquareSlot[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!serviceVariationId) return
    setLoading(true)
    fetch(`/api/availability?serviceVariationId=${serviceVariationId}&startDate=${startDate}&endDate=${endDate}`)
      .then(r => r.json())
      .then(data => setSlots(data.availabilities ?? []))
      .finally(() => setLoading(false))
  }, [serviceVariationId, startDate, endDate])

  return { slots, loading }
}
```

### 4.3 Payment step — Square Web Payments SDK

Add a payment card step after the contact form. When the user clicks "Book Spot", tokenize the card in the browser, then POST the nonce + booking details to `/api/booking`.

```tsx
import { CreditCard, PaymentForm } from 'react-square-web-payments-sdk'

const APP_ID       = import.meta.env.VITE_SQUARE_APP_ID as string
const LOCATION_ID  = import.meta.env.VITE_SQUARE_LOCATION_ID as string

function PaymentStep({ onToken }: { onToken: (nonce: string) => void }) {
  return (
    <PaymentForm
      applicationId={APP_ID}
      locationId={LOCATION_ID}
      cardTokenizeResponseReceived={(token) => {
        if (token.status === 'OK') onToken(token.token!)
      }}
    >
      <CreditCard />
    </PaymentForm>
  )
}
```

### 4.4 Changes to `PricingSection` in `App.tsx`

| Current behaviour | After Square integration |
|---|---|
| `buildNextWeekendSessions()` — static dates | `useSquareAvailability(serviceVariationId, ...)` — live Square slots |
| `SESSION_TIME_SLOTS` — hardcoded times | Slots come from `SearchAvailability` response |
| `SPOTS_PER_TIME_SLOT = 20` — static | Square tracks capacity via `max_seats` on the service |
| Contact form → `setFlow('publicSuccess')` | Contact form → payment card step → `POST /api/booking` → success |
| No payment collection | Square Web Payments SDK tokenizes card → server charges via Payments API |

The multi-step flow gains one new step between `contact` and success:

```
chooseClass → mat/people → date → contact → payment → success
```

---

## Phase 5 — Register Webhooks in Square Developer Console

### 5.1 Confirm Vercel deployment is live
Check that `https://studio-yopaw.vercel.app/api/square-webhook` returns `405` on a GET (expected).

### 5.2 Create the webhook subscription
1. Developer Console → your app → **Webhooks** → **Add notification URL**
2. **URL:** `https://studio-yopaw.vercel.app/api/square-webhook`
3. **API version:** `2025-01-23` (or latest)
4. **Events to subscribe:**
   - `booking.created`
   - `booking.cancelled`
   - `payment.completed`
   - `payment.failed`
   - `customer.created`
5. Save → copy the **Signature key**
6. Add it as `SQUARE_WEBHOOK_SIGNATURE_KEY` in Vercel environment variables
7. Redeploy on Vercel to pick up the new var

---

## Phase 6 — Sandbox Testing

### 6.1 Local development with ngrok
```bash
npx vercel dev          # local functions on :3000
ngrok http 3000         # exposes https://xxxx.ngrok.io
```
Temporarily register the ngrok URL as the webhook notification URL in Developer Console.

### 6.2 Test a payment end-to-end
Use the Square sandbox test card in the Web Payments SDK card form:

| Card | Number | CVV | Expiry |
|---|---|---|---|
| Visa (success) | `4111 1111 1111 1111` | `111` | any future |
| Visa (declined) | `4000 0000 0000 0002` | `111` | any future |

Complete a booking on the local site → check that:
- `/api/booking` returns `{ bookingId, paymentStatus: 'COMPLETED' }`
- Lead notification email arrives at `LEAD_NOTIFY_EMAIL`
- Square Developer Console → **Events** shows the `booking.created` event delivered

### 6.3 Verify webhook signature
In Developer Console → Webhooks → your endpoint → **Send test event**.
Check the `api/square-webhook` Vercel function logs for a valid `200 OK`.

---

## Phase 7 — Go Live

1. In Vercel, update:
   - `SQUARE_ENVIRONMENT` → `production`
   - `SQUARE_ACCESS_TOKEN` → production token
   - `SQUARE_APP_ID` → production app ID
   - `VITE_SQUARE_APP_ID` → production app ID
2. Redeploy.
3. Update the webhook notification URL in Developer Console to the production Vercel URL (already set if you used `studio-yopaw.vercel.app`).
4. Run one real $0.01 test transaction to confirm end-to-end.

---

## Phase 8 — Security Checklist

| Item | Notes |
|---|---|
| Validate `x-square-hmacsha256-signature` on every webhook | Implemented in `api/square-webhook.ts` |
| Use `crypto.timingSafeEqual` for signature compare | Prevents timing attacks |
| Use raw body bytes for HMAC (not re-serialized JSON) | See raw body note in Phase 3.4 |
| `SQUARE_ACCESS_TOKEN` server-only, never in `VITE_*` | Token stays in Vercel env, never in browser bundle |
| `VITE_SQUARE_APP_ID` / `VITE_SQUARE_LOCATION_ID` are safe to expose | Square App ID is public; location ID is not sensitive |
| Always use `randomUUID()` idempotency keys per operation | Square deduplicates — prevents double-charges on retries |
| Check `event.event_id` for duplicate webhook deliveries | Square retries on non-2xx; process each event once |
| Return `200` immediately, process async | Square retries on timeout; keep handler fast |
| Never log full card data | Square Web Payments SDK tokenizes — raw card numbers never reach your server |

---

## Environment Variables Summary

`.env.local` for local development (never commit):

```env
# Square API
SQUARE_ENVIRONMENT=sandbox
SQUARE_APP_ID=sq0idp-xxxxxxxxxxxxxxxxxxxx
SQUARE_ACCESS_TOKEN=EAAAl...
SQUARE_LOCATION_ID=LXXXXXXXXXXXXXXXXX
SQUARE_WEBHOOK_SIGNATURE_KEY=

# Square — safe to expose in browser (VITE_ prefix)
VITE_SQUARE_APP_ID=sq0idp-xxxxxxxxxxxxxxxxxxxx
VITE_SQUARE_LOCATION_ID=LXXXXXXXXXXXXXXXXX

# Email forwarding
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
LEAD_NOTIFY_EMAIL=hello@studio-yopaw.com
PAYMENT_NOTIFY_EMAIL=hello@studio-yopaw.com
```

---

## Delivery Sequence

```
Phase 0  ──── Create Square dev account, configure Dashboard, collect credentials (~30 min)
Phase 1  ──── Deploy to Vercel → get live HTTPS URL
Phase 2  ──── npm install square react-square-web-payments-sdk resend @vercel/node
Phase 3  ──── Write api/_square.ts, api/availability.ts, api/booking.ts, api/square-webhook.ts
Phase 4  ──── Update PricingSection: availability hook, service ID map, payment step
               ↓ (needs live Vercel URL)
Phase 5  ──── Register webhook in Developer Console, add signature key to Vercel
Phase 6  ──── Sandbox test: full booking + payment + email confirmation
Phase 7  ──── Flip SQUARE_ENVIRONMENT=production, redeploy, live test
Phase 8  ──── Security review checklist
```

---

## Key Square Constraints to Keep in Mind

| Constraint | Impact |
|---|---|
| Appointments Plus required ($35 CAD/mo) for seller-level write | Confirm with client before building — buyer-level works free but has limited visibility |
| Team members must be assigned to services via Dashboard, not API | Studio staff setup is manual |
| All money amounts are integers (cents) — `$35.00 = 3500` | Use `BigInt` in the new Square SDK |
| Idempotency key must be a fresh UUID per logical operation | Reusing a key with different data throws an error |
| `booking_version` required on update/cancel | Retrieve booking first, then update with current version |
| Web Payments SDK App ID must match the location's owner | Sandbox App ID ≠ Production App ID — keep both env vars |
| Square webhook signature uses `base64(hmac(key, url + body))` — not hex | Different from most other platforms |

---

## What is NOT in scope

- Storing bookings in a database (email-only per client direction)
- OAuth multi-seller flow (single business account — Personal Access Token is correct)
- Refund UI (Square Dashboard handles refunds natively)
- Loyalty points or gift cards (Square supports both — can be added later)
- Pet custom attributes on customer profiles (Square supports this — worth adding in a v2)
