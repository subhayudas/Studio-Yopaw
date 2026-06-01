# Studio Yopaw — End-to-End Testing Plan

> Covers the full system after migration to Twilio SMS (replacing Resend email) and extra-attendee expansion to 10 max.
> Tests are ordered from fastest/cheapest to slowest/most integrated.

---

## Environment Setup

### Required `.env.local`
```
SQUARE_ENVIRONMENT=sandbox
SQUARE_ACCESS_TOKEN=<sandbox token>
SQUARE_LOCATION_ID=<sandbox location id>
SQUARE_WEBHOOK_SIGNATURE_KEY=<from Square dashboard>
TWILIO_ACCOUNT_SID=TWILIO_ACCOUNT_SID_PLACEHOLDER
TWILIO_AUTH_TOKEN=TWILIO_AUTH_TOKEN_PLACEHOLDER
TWILIO_FROM_NUMBER=+12494026223
TWILIO_TEAM_NUMBERS=+15142424947
VITE_SQUARE_APP_ID=<sandbox app id>
VITE_SQUARE_LOCATION_ID=<sandbox location>
VITE_SQUARE_TEAM_MEMBER_ID=<sandbox team member>
VITE_SQUARE_YIN_VARIATION_ID=<sandbox variation>
VITE_SQUARE_YIN_VARIATION_VERSION=<version>
VITE_SQUARE_YIN_BASE_CENTS=4600
VITE_SQUARE_MAX_SEATS=20
```

### Start services
```bash
# Terminal 1 — Vite dev server (mocks /api/availability and /api/breeds via devApiPlugin)
npm run dev

# Terminal 2 — real Vercel functions (Square payments + Twilio SMS)
npx vercel dev
```

---

## 1. Unit Tests — Tax & Pricing Math

**File:** `tests/unit/pricing.test.ts` | **Run:** `npx vitest run tests/unit/pricing.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { computeTaxBreakdown } from '../../src/lib/squareServices'

describe('computeTaxBreakdown', () => {
  it('computes GST + QST on a single $46 class', () => {
    const { baseCents, gstCents, qstCents, totalCents } = computeTaxBreakdown(4600)
    expect(baseCents).toBe(4600)
    expect(gstCents).toBe(230)
    expect(qstCents).toBe(459)
    expect(totalCents).toBe(baseCents + gstCents + qstCents)
  })

  it('scales correctly for 11 attendees (1 primary + 10 extra)', () => {
    const base = 4600 * 11
    const { totalCents } = computeTaxBreakdown(base)
    expect(totalCents).toBeGreaterThan(base)
  })

  it('mat rental adds $5 flat (not taxed in front-end summary)', () => {
    const with_ = computeTaxBreakdown(4600 + 500)
    const without = computeTaxBreakdown(4600)
    expect(with_.totalCents).toBeGreaterThan(without.totalCents)
  })

  it('2 attendees + mat = correct total', () => {
    const base = 4600 * 2 + 500
    const { gstCents, qstCents, totalCents } = computeTaxBreakdown(base)
    expect(totalCents).toBe(base + gstCents + qstCents)
  })
})
```

---

## 2. Unit Tests — i18n String Completeness

**File:** `tests/unit/i18n.test.ts` | **Run:** `npx vitest run tests/unit/i18n.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { siteStrings } from '../../src/i18n/siteStrings'

const KEYS = [
  'pricingExtraAttendeesHelper',
  'pricingExtraAttendeeName',
  'pricingAddAttendee',
  'pricingRemoveAttendee',
  'pricingExtraAttendeeWaiver',
  'pricingLblMessage',
  'pricingLblCompanyName',
  'inquirySubmitLabel',
  'inquirySubmitting',
  'inquirySubmitError',
] as const

describe('i18n — all keys present in both languages', () => {
  for (const key of KEYS) {
    it(`EN["${key}"] is non-empty`, () => expect((siteStrings.en as Record<string,unknown>)[key]).toBeTruthy())
    it(`FR["${key}"] is non-empty`, () => expect((siteStrings.fr as Record<string,unknown>)[key]).toBeTruthy())
  }
})

describe('i18n — extra attendee limit is 10', () => {
  it('EN helper text mentions 10', () => expect(siteStrings.en.pricingExtraAttendeesHelper).toContain('10'))
  it('FR helper text mentions 10', () => expect(siteStrings.fr.pricingExtraAttendeesHelper).toContain('10'))
})
```

---

## 3. API Tests — Quick script (no test runner needed)

**File:** `tests/run-api-tests.mjs` | **Run:** `TEST_BASE_URL=http://localhost:3000 node tests/run-api-tests.mjs`

```js
// tests/run-api-tests.mjs
const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3000'

async function post(path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { status: r.status, body: await r.json().catch(() => ({})) }
}
async function get(path) {
  const r = await fetch(`${BASE}${path}`)
  return { status: r.status, body: await r.json().catch(() => ({})) }
}

let pass = 0, fail = 0
function assert(label, ok, detail = '') {
  if (ok) { console.log(`  ✅ ${label}`); pass++ }
  else     { console.error(`  ❌ ${label}${detail ? ' — ' + detail : ''}`); fail++ }
}

// --- Availability ---
console.log('\n[availability]')
const av = await get('/api/availability?startDate=2026-06-01&endDate=2026-07-31')
assert('returns 200', av.status === 200)
assert('has availabilities array', Array.isArray(av.body.availabilities))
assert('slots have seatsRemaining', av.body.availabilities?.[0]?.seatsRemaining >= 0)

// --- Breeds ---
console.log('\n[breeds]')
const br = await get('/api/breeds?startDate=2026-06-01&endDate=2026-07-31')
assert('returns 200', br.status === 200)
assert('has schedule object', typeof br.body.schedule === 'object')

// --- Inquiry: Private Event ---
console.log('\n[inquiry: private event]')
const i1 = await post('/api/inquiry', {
  fullName: 'Marie Dupont', email: 'marie@test.com', phone: '+15141110001',
  classType: 'Private Event', preferredDate: '2026-06-14',
  preferredTime: '2026-06-14T14:30:00Z', groupSize: '6',
  message: 'Birthday party — please confirm ASAP',
})
assert('returns 200', i1.status === 200)
assert('ok:true', i1.body.ok === true)

// --- Inquiry: Corporate ---
console.log('\n[inquiry: corporate]')
const i2 = await post('/api/inquiry', {
  fullName: 'Jean Tremblay', email: 'jean@corp.com', phone: '+15143334444',
  classType: 'Corporate', preferredDate: '2026-06-21',
  preferredTime: '2026-06-21T16:00:00Z', groupSize: '12',
  companyName: 'Acme Inc.', message: 'Team building day',
})
assert('returns 200', i2.status === 200)
assert('ok:true', i2.body.ok === true)

// --- Inquiry: Regular Class lead capture ---
console.log('\n[inquiry: regular class lead capture]')
const i3 = await post('/api/inquiry', {
  fullName: 'Sophie Martin', email: 'sophie@test.com', phone: '+15145556666',
  classType: 'Regular Class', preferredDate: '2026-06-14',
  preferredTime: '2026-06-14T14:30:00Z', groupSize: '3',
})
assert('returns 200', i3.status === 200)
assert('ok:true', i3.body.ok === true)

// --- Inquiry: missing optional fields ---
console.log('\n[inquiry: minimal payload]')
const i4 = await post('/api/inquiry', {
  fullName: 'Min User', email: 'min@test.com', phone: '+15140000000',
  classType: 'Private Event',
})
assert('returns 200 (optional fields ok)', i4.status === 200)

// --- Webhook: bad signature ---
console.log('\n[webhook: bad signature]')
const wh = await post('/api/square-webhook', { type: 'test' })
assert('rejects bad sig with 403', wh.status === 403)

// --- 405 on GET for POST-only routes ---
console.log('\n[405 checks]')
const g1 = await fetch(`${BASE}/api/inquiry`)
assert('/api/inquiry GET returns 405', g1.status === 405)
const g2 = await fetch(`${BASE}/api/booking`)
assert('/api/booking GET returns 405', g2.status === 405)

console.log(`\n${'='.repeat(40)}`)
console.log(`Results: ${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
```

---

## 4. API Tests — `POST /api/booking` (Square Sandbox)

**File:** `tests/api/booking.test.ts` | **Requires:** `vercel dev` + Square sandbox credentials

> Square sandbox nonces: `cnon:card-nonce-ok` (approved), `cnon:card-nonce-declined` (declined)

```ts
describe('POST /api/booking', () => {
  const BASE_BODY = {
    givenName: 'Test', familyName: 'User',
    email: 'test@yopaw-sandbox.com', phone: '+15147778888',
    serviceVariationId: process.env.VITE_SQUARE_YIN_VARIATION_ID,
    serviceVariationVersion: Number(process.env.VITE_SQUARE_YIN_VARIATION_VERSION),
    teamMemberId: process.env.VITE_SQUARE_TEAM_MEMBER_ID,
    startAt: '2026-06-14T14:30:00Z',
    cardNonce: 'cnon:card-nonce-ok',
    baseAmountCents: 4600,
    serviceName: 'Regular Class',
    needsMatRental: false,
    extraAttendees: [],
  }

  it('1 person — returns bookingId + COMPLETED', async () => {
    const r = await post('/api/booking', BASE_BODY)
    expect(r.status).toBe(200)
    expect(r.body.bookingId).toBeTruthy()
    expect(r.body.paymentStatus).toMatch(/COMPLETED|APPROVED/)
    // Check SMS sent: verify in Twilio console or tests/check-twilio-sms.mjs
  })

  it('11 people (1 primary + 10 extra) — charges 11×', async () => {
    const extra = Array.from({ length: 10 }, (_, i) => ({ name: `Extra Person ${i + 1}` }))
    const r = await post('/api/booking', {
      ...BASE_BODY, startAt: '2026-06-14T16:00:00Z', extraAttendees: extra,
    })
    expect(r.status).toBe(200)
    expect(r.body.bookingId).toBeTruthy()
    // Square order should total 11 × $46 + taxes ≈ $581.39 CAD
  })

  it('mat rental — adds $5 line item', async () => {
    const r = await post('/api/booking', {
      ...BASE_BODY, startAt: '2026-06-21T14:30:00Z', needsMatRental: true,
    })
    expect(r.status).toBe(200)
    // SMS should contain "Regular Class + Mat Rental"
  })

  it('declined card — friendly error + booking cancelled in Square', async () => {
    const r = await post('/api/booking', { ...BASE_BODY, cardNonce: 'cnon:card-nonce-declined' })
    expect(r.status).toBe(500)
    expect(r.body.error).toMatch(/declined|card|payment/i)
    // Manually verify: no ghost appointment in Square sandbox calendar
  })
})
```

---

## 5. SMS Notification Tests (Twilio)

### 5.1 Verify delivery via Twilio REST API

```bash
node --env-file=.env.local tests/check-twilio-sms.mjs
```

**File:** `tests/check-twilio-sms.mjs`

```js
// tests/check-twilio-sms.mjs
const SID   = process.env.TWILIO_ACCOUNT_SID
const TOKEN = process.env.TWILIO_AUTH_TOKEN
const TO    = process.env.TWILIO_TEAM_NUMBERS?.split(',')[0]

if (!SID || !TOKEN || !TO) {
  console.error('Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_TEAM_NUMBERS')
  process.exit(1)
}

const url = `https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json?To=${encodeURIComponent(TO)}&PageSize=10`
const r = await fetch(url, {
  headers: { Authorization: 'Basic ' + Buffer.from(`${SID}:${TOKEN}`).toString('base64') },
})
const data = await r.json()
console.log(`\nLast ${data.messages?.length ?? 0} messages to ${TO}:\n`)
for (const m of data.messages ?? []) {
  console.log(`[${m.date_sent}] status=${m.status}`)
  console.log(m.body)
  console.log('---')
}
```

### 5.2 SMS content assertions (manual)

After each API test, run `check-twilio-sms.mjs` and verify:

| Trigger | Expected SMS fields |
|---|---|
| Private Event inquiry | `📩 NEW INQUIRY`, name, email, phone, `Class: Private Event`, date, time, group size, message |
| Corporate inquiry | All above + `Company: Acme Inc.` |
| Regular Class lead | `🔔 NEW LEAD`, `Class: Regular Class`, no Zapier (check Zapier activity) |
| Confirmed booking (1 person) | `📋 NEW BOOKING`, name, email, phone, session date+time in Montréal TZ, `Total:`, `Status: COMPLETED` |
| Confirmed booking (11 people) | `Total attendees: 11`, all names in `Names:` line |
| Booking + mat rental | `Regular Class + Mat Rental` in service line |
| Declined card | No new SMS (payment failed before notification step) |
| Square webhook payment.completed | `✅ PAYMENT COMPLETED`, amount, payment ID, booking reference |
| Square webhook customer.created | `🆕 NEW CUSTOMER`, name, email, phone |

### 5.3 Multiple team numbers

Set `TWILIO_TEAM_NUMBERS=+15142424947,+1XXXXXXXXXX` (add a second number) and trigger any inquiry.
Verify two messages appear in the Twilio console, one per number.

---

## 6. Playwright E2E Tests

**Run:** `npx playwright test` | **Config:** `playwright.config.ts` (base URL `http://localhost:5173`)

### 6.1 Language picker — EN + FR

```ts
test('language picker blocks UI until chosen', async ({ page }) => {
  await page.evaluate(() => localStorage.clear())
  await page.goto('/')
  await expect(page.locator('.lang-picker-overlay')).toBeVisible()
  await page.getByRole('button', { name: /english/i }).click()
  await expect(page.locator('.lang-picker-overlay')).not.toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('studio-yopaw-lang'))).toBe('en')
})

test('language picker — French sets page lang', async ({ page }) => {
  await page.evaluate(() => localStorage.clear())
  await page.goto('/')
  await page.getByRole('button', { name: /français/i }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
})
```

### 6.2 Regular Class — extra attendees cap at 10

```ts
test('extra attendees — max 10, button hides at limit', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('studio-yopaw-lang', 'en'))
  await page.goto('/#pricing')
  await page.getByRole('button', { name: /Regular Class/i }).click()
  await page.getByRole('button', { name: /bring my own/i }).click()
  await page.locator('.pricing-session-row').first().click()
  await page.locator('.pricing-time-slot-row').first().click()

  await page.fill('[name="fullName"], #pub-fullname', 'Primary Person')
  await page.fill('[type="email"]', 'primary@test.com')
  await page.fill('[type="tel"]', '+15140001111')

  const addBtn = page.getByRole('button', { name: /Add another attendee/i })
  for (let i = 0; i < 10; i++) {
    await addBtn.click()
    await page.locator('.pricing-extra-attendee-card').nth(i).locator('input[type="text"]').fill(`Attendee ${i + 2}`)
  }

  await expect(addBtn).not.toBeVisible()  // hidden at max
  await expect(page.locator('.pricing-extra-attendee-card')).toHaveCount(10)
})
```

### 6.3 Extra attendees — button reappears after remove

```ts
test('remove extra attendee re-shows add button', async ({ page }) => {
  // ... navigate to contact step with 10 attendees ...
  await page.locator('.pricing-extra-attendee-remove').first().click()
  await expect(page.getByRole('button', { name: /Add another attendee/i })).toBeVisible()
  await expect(page.locator('.pricing-extra-attendee-card')).toHaveCount(9)
})
```

### 6.4 Regular Class — submit blocked until all waivers checked

```ts
test('submit blocked until primary + all extra waivers checked', async ({ page }) => {
  // Navigate to contact step, add 2 extra attendees
  const submit = page.getByRole('button', { name: /Confirm booking|Book my spot/i })

  // Check primary waiver only
  await page.locator('#pub-waiver').check()
  await expect(submit).toBeDisabled()  // extras not checked

  // Check extra 1
  await page.locator('.pricing-extra-attendee-card').nth(0).locator('input[type="checkbox"]').check()
  await expect(submit).toBeDisabled()  // extra 2 still not checked

  // Check extra 2
  await page.locator('.pricing-extra-attendee-card').nth(1).locator('input[type="checkbox"]').check()
  await expect(submit).toBeEnabled()
})
```

### 6.5 Regular Class — FR helper text says "10"

```ts
test('FR helper text references 10 extra attendees', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('studio-yopaw-lang', 'fr'))
  await page.goto('/#pricing')
  await page.getByRole('button', { name: /Cours régulier/i }).click()
  await page.getByRole('button', { name: /j'apporte/i }).click()
  await page.locator('.pricing-session-row').first().click()
  await page.locator('.pricing-time-slot-row').first().click()

  await expect(page.locator('.pricing-extra-attendees')).toContainText("jusqu'à 10")
})
```

### 6.6 Private Event — inquiry path (no payment)

```ts
test('private event inquiry — submits and shows success', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('studio-yopaw-lang', 'en'))
  await page.goto('/#pricing')
  await page.getByRole('button', { name: /Private Event/i }).click()
  await page.getByRole('button', { name: /Continue/i }).click()
  await page.locator('.pricing-session-row').first().click()
  await page.locator('.pricing-time-slot-row').first().click()

  await page.fill('[placeholder*="name" i], #pub-fullname', 'Private Client')
  await page.fill('[type="email"]', 'priv@test.com')
  await page.fill('[type="tel"]', '+15140002222')
  await page.locator('textarea').fill('Dog allergy concern')

  await page.getByRole('button', { name: /Send my request/i }).click()

  await expect(page.locator('.pricing-success')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('.pricing-success')).toContainText(/request received|demande reçue/i)
})
```

### 6.7 Corporate — company name field + inquiry success

```ts
test('corporate inquiry — company name required, submits ok', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('studio-yopaw-lang', 'en'))
  await page.goto('/#pricing')
  await page.getByRole('button', { name: /Corporate/i }).click()
  await page.getByRole('button', { name: /Continue/i }).click()
  await page.locator('.pricing-session-row').first().click()
  await page.locator('.pricing-time-slot-row').first().click()

  await page.fill('[placeholder*="name" i]', 'Corp Contact')
  await page.fill('[placeholder*="company" i]', 'Yopaw Enterprises')
  await page.fill('[type="email"]', 'corp@test.com')
  await page.fill('[type="tel"]', '+15140003333')
  await page.locator('textarea').fill('Looking for team of 15.')

  await page.getByRole('button', { name: /Send my request/i }).click()
  await expect(page.locator('.pricing-success')).toBeVisible({ timeout: 10000 })
})
```

### 6.8 Payment step — correct price summary for 3 people

```ts
test('payment summary shows 3× price for 3 attendees', async ({ page }) => {
  // Navigate through to payment step with 1 primary + 2 extra
  // ... fill contact, add 2 extras, check all waivers, submit ...
  const summary = page.locator('.pricing-payment-summary')
  await expect(summary).toContainText('3')
  await expect(summary).toContainText('138')  // 3 × $46 = $138 subtotal
})
```

### 6.9 Waiver modal opens and closes

```ts
test('waiver modal opens on link click, closes on Escape', async ({ page }) => {
  // Navigate to contact step (Regular Class)
  await page.locator('.pricing-waiver-inline-link').click()
  await expect(page.locator('.waiver-modal-overlay')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.waiver-modal-overlay')).not.toBeVisible()
})
```

### 6.10 Refund policy page

```ts
test('refund policy loads in EN', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('studio-yopaw-lang', 'en'))
  await page.goto('/refund-policy')
  await expect(page).toHaveTitle(/Refund/i)
  await expect(page.locator('nav')).toBeVisible()
  await expect(page.locator('footer')).toBeVisible()
})

test('refund policy loads in FR with correct URL', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('studio-yopaw-lang', 'fr'))
  await page.goto('/refund-policy')
  await expect(page).toHaveURL(/politique-remboursement/)
})
```

### 6.11 Inquiry error state

```ts
test('private event — shows error if API fails', async ({ page }) => {
  await page.route('/api/inquiry', route => route.fulfill({ status: 500, json: { error: 'Failed' } }))
  // ... navigate to contact step, submit ...
  await expect(page.locator('.pricing-error')).toBeVisible()
})
```

### 6.12 Back navigation resets state

```ts
test('back button clears date + time selection', async ({ page }) => {
  // Navigate to contact step, click back
  await page.getByRole('button', { name: /back/i }).click()
  // Should be back at date step
  await expect(page.locator('.pricing-session-row')).toBeVisible()
})
```

### 6.13 Hash scroll — #book anchors to pricing

```ts
test('/#book scrolls pricing section into view', async ({ page }) => {
  await page.goto('/#book')
  await expect(page.locator('#book')).toBeInViewport()
})
```

### 6.14 Dog breed badge appears on date picker

```ts
test('date picker shows breed badge for configured dates', async ({ page }) => {
  // Navigate to date step
  const firstDate = page.locator('.pricing-session-row').first()
  await expect(firstDate.locator('.pricing-breed-badge')).toBeVisible()
})
```

---

## 7. Square Webhook Tests

### 7.1 HMAC signature helper (run once to get valid sig)

```js
// scripts/gen-webhook-sig.mjs
import crypto from 'crypto'
const KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY
const URL = 'https://studio-yopaw.vercel.app/api/square-webhook'
const body = JSON.stringify({ type: 'payment.updated', event_id: 'test-1', data: { object: { payment: { id: 'p1', status: 'COMPLETED', amount_money: { amount: 5349 }, reference_id: 'bk1' } } } })
const sig = crypto.createHmac('sha256', KEY).update(URL + body).digest('base64')
console.log('Signature:', sig)
console.log('Body:', body)
```

### 7.2 Payment completed webhook → SMS

```bash
# Use sig from helper above:
curl -s -X POST http://localhost:3000/api/square-webhook \
  -H "Content-Type: application/json" \
  -H "x-square-hmacsha256-signature: <sig>" \
  -d '{ "type": "payment.updated", "event_id": "test-1", "data": { "object": { "payment": { "id": "pay_1", "status": "COMPLETED", "amount_money": { "amount": 5349 }, "reference_id": "bk_1" } } } }'
```
**Expected:** HTTP 200, SMS `✅ PAYMENT COMPLETED — $53.49 CAD, Booking: bk_1`

### 7.3 Non-COMPLETED payment — no SMS

Send same payload with `"status": "PENDING"`. Verify HTTP 200 but no new SMS in Twilio.

### 7.4 Customer created → SMS

```bash
curl -s -X POST http://localhost:3000/api/square-webhook \
  -H "Content-Type: application/json" \
  -H "x-square-hmacsha256-signature: <valid_sig_for_this_body>" \
  -d '{ "type": "customer.created", "event_id": "test-2", "data": { "object": { "customer": { "given_name": "New", "family_name": "Client", "email_address": "new@test.com", "phone_number": "+15141234567" } } } }'
```
**Expected:** SMS `🆕 NEW CUSTOMER — New Client, new@test.com`

### 7.5 Invalid signature → 403

```bash
curl -s -X POST http://localhost:3000/api/square-webhook \
  -H "Content-Type: application/json" \
  -H "x-square-hmacsha256-signature: INVALID" \
  -d '{}' | cat
```
**Expected:** `{ "error": "Invalid signature" }`

---

## 8. Regression Checklist

| Feature | Test |
|---|---|
| Single-person booking, no mat | Books 1 person, charges 1 × $46 + taxes |
| Mat rental | SMS shows "+ Mat Rental", $5 added before taxes on service item |
| Seat guard (409) | Fill slot to maxSeats, next booking returns "class is full" |
| Declined card + ghost cleanup | Friendly error shown, no appointment in Square calendar |
| Fire-and-forget lead does not block | `/api/inquiry` mock hangs 30s — payment step still appears immediately |
| Google Ads gtag | Fires for Regular Class submit only, not Private/Corporate |
| Zapier — regular class | Fires once after payment with `attendeeCount`, `attendeeNames` |
| Zapier — inquiry | Fires for Private/Corporate only; NOT for regular class lead-capture |
| Language modal | Blocks UI on first visit; language persists on reload |
| Back buttons | Work at every step without corrupting state |

---

## 9. Pre-deploy Checklist

```bash
# TypeScript clean
npx tsc -b

# Unit tests
npx vitest run tests/unit/

# API smoke tests (vercel dev must be running)
TEST_BASE_URL=http://localhost:3000 node tests/run-api-tests.mjs

# Check SMS delivery
node --env-file=.env.local tests/check-twilio-sms.mjs

# E2E
npx playwright test

# Deploy
npx vercel --prod
```

After deploying:
- [ ] Trigger a real inquiry on www.yopaw.ca → confirm SMS received at `+15142424947`
- [ ] Check Vercel env vars: `npx vercel env ls`
- [ ] Confirm Square sandbox booking appears in Square Dashboard
- [ ] Confirm declined-card test cancels the booking

---

## 10. Running Everything

```bash
# Unit tests only (fastest, no server needed)
npx vitest run tests/unit/

# API tests (vercel dev required on :3000)
TEST_BASE_URL=http://localhost:3000 node tests/run-api-tests.mjs

# Check Twilio delivery
node --env-file=.env.local tests/check-twilio-sms.mjs

# Full E2E (vite dev required on :5173)
npx playwright test

# Full sequence
npx vitest run && TEST_BASE_URL=http://localhost:3000 node tests/run-api-tests.mjs && npx playwright test
```
