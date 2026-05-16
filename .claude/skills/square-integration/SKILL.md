---
name: square-integration
description: >
  Complete Square API integration guide for any language or framework. Use this skill
  whenever the user mentions Square, Square Appointments, Square Payments, Square Bookings
  API, Square Web Payments SDK, Square OAuth, or wants to integrate payment processing,
  class scheduling, booking management, or customer management with Square. Also trigger
  for any question about Square developer console, sandbox setup, webhooks, or SDK usage
  in Node.js, TypeScript, Python, Ruby, PHP, Java, or .NET. This skill covers everything
  needed to build, authenticate, and ship a Square integration from scratch.
---

# Square Integration Skill

Use this skill to guide any Square API integration — from initial setup to production.
Square is a commerce platform with APIs for payments, bookings, customers, catalog, orders,
loyalty, and more. Official SDKs exist for Node.js/TypeScript, Python, Ruby, PHP, Java, and .NET.

## Quick orientation — which reference to load

| Task | Read |
|------|------|
| Auth setup (OAuth or personal token) | references/auth.md |
| Bookings / class scheduling | references/bookings.md |
| Payments (online, in-person, Web SDK) | references/payments.md |
| Customers, CRM, loyalty | references/customers.md |
| Webhooks & event handling | references/webhooks.md |
| SDK setup per language | references/sdks.md |

Always read the relevant reference file(s) before writing code. For multi-feature integrations,
read all relevant files.

---

## Core concepts (always in context)

### Base URLs
- **Production:** `https://connect.squareup.com/v2`
- **Sandbox:** `https://connect.squareupsandbox.com/v2`

### Required headers (every request)
```
Authorization: Bearer {ACCESS_TOKEN}
Square-Version: {API_VERSION}          // e.g. 2025-01-23 — use latest unless pinning
Content-Type: application/json
Accept: application/json
```

### Authentication modes
- **Personal access token** — single Square account, never expires, full permissions.
  Use for: your own account, single-tenant apps, internal tools.
- **OAuth access token** — multi-seller apps, marketplace apps. Expires every 30 days.
  Use for: any app serving multiple sellers, all App Marketplace apps.

### Idempotency keys (critical)
All write operations (create/update) require an `idempotency_key`. Generate a UUID per
request. Square deduplicates: same key + same payload = same result, no duplicate charge.

```typescript
import { randomUUID } from 'crypto';
const idempotencyKey = randomUUID(); // use once per logical operation
```

### Pagination
Many list endpoints return `cursor` in the response. Pass `cursor` back to get the next page.
SDKs offer auto-pagination helpers.

### Error handling
Non-2xx responses return `{ errors: [{ category, code, detail }] }`.
Always check `errors` array. Common codes: `UNAUTHORIZED`, `NOT_FOUND`, `INVALID_REQUEST_ERROR`.

### API versioning
Each Square API version is a date string (e.g. `2025-01-23`). Each SDK version pins to one
API version. Bump SDK version to access new features. Breaking changes increment major SDK version.

---

## Account & Developer Console setup

1. Create a Square account at squareup.com
2. Go to developer.squareup.com → create an application
3. Credentials page gives you:
   - **Production** access token + app ID + app secret
   - **Sandbox** access token for the default test account
4. Sandbox: create additional test seller accounts under "Sandbox test accounts"
5. For Appointments features (Bookings API write access), the seller must be on
   **Appointments Plus ($35 CAD/mo)** or Premium

---

## Sandbox test values

- Sandbox credit card: `4111 1111 1111 1111` (Visa), CVV `111`, any future expiry
- Payments in Sandbox are never real charges
- Sandbox token format: `EAAAl...` (different from production)
- Do NOT mix Sandbox tokens with production URLs or vice versa — causes `UNAUTHORIZED`

---

## What each reference covers

- **references/auth.md** — OAuth 2.0 code flow, PKCE flow for SPAs, token refresh/revoke,
  permission scopes for Bookings + Payments, personal access token usage
- **references/bookings.md** — Bookings API full workflow: list locations → list services →
  search availability → create customer → create booking → manage (update/cancel);
  seller-level vs buyer-level permissions; class booking specifics
- **references/payments.md** — Web Payments SDK (browser card form), Payments API (server),
  Checkout API (hosted page, no frontend), card on file, refunds, disputes
- **references/customers.md** — Customers API CRUD, custom attributes, loyalty, gift cards
- **references/webhooks.md** — Subscribe to events, HMAC-SHA256 signature verification,
  idempotency for event processing, production checklist
- **references/sdks.md** — Install commands, client init, environment switching, error handling
  patterns for Node.js/TS, Python, Ruby, PHP, Java, .NET
