# Testing Plan — Booking & Payment Flow Implementation

Tests are ordered from fastest/cheapest (unit) to slowest/most integrated (E2E + manual). Run them in this order during CI and before any production deploy.

---

## 1. Unit Tests — Tax & Pricing Math

**Tool:** Vitest (add `vitest` dev dependency)  
**File:** `tests/unit/pricing.test.ts`

These are pure functions with no side effects — test them in complete isolation.

```ts
import { describe, it, expect } from 'vitest'
import { computeTaxBreakdown } from '../../src/lib/squareServices'

describe('computeTaxBreakdown', () => {
  it('computes GST + QST on a single $46 class', () => {
    const { baseCents, gstCents, qstCents, totalCents } = computeTaxBreakdown(4600)
    expect(baseCents).toBe(4600)
    expect(gstCents).toBe(230)           // 4600 * 0.05
    expect(qstCents).toBe(459)           // 4600 * 0.09975 rounded
    expect(totalCents).toBe(baseCents + gstCents + qstCents)
  })

  it('scales correctly for 3 attendees', () => {
    const base = 4600 * 3                // $138.00
    const { totalCents } = computeTaxBreakdown(base)
    expect(totalCents).toBeGreaterThan(base)
  })

  it('includes mat rental in tax base', () => {
    const withMat = computeTaxBreakdown(4600 + 500)
    const withoutMat = computeTaxBreakdown(4600)
    expect(withMat.totalCents).toBeGreaterThan(withoutMat.totalCents)
  })

  it('2 attendees + mat = correct total', () => {
    const base = 4600 * 2 + 500
    const { gstCents, qstCents, totalCents } = computeTaxBreakdown(base)
    expect(totalCents).toBe(base + gstCents + qstCents)
  })
})
```

**Run:** `npx vitest run tests/unit/pricing.test.ts`

---

## 2. Unit Tests — i18n String Completeness

**File:** `tests/unit/i18n.test.ts`

Verify every key defined in `SiteStrings` is present and non-empty in both EN and FR.

```ts
import { describe, it, expect } from 'vitest'
import { siteStrings } from '../../src/i18n/siteStrings'

const NEW_KEYS = [
  'pricingLblMessage',
  'pricingLblCompanyName',
  'pricingExtraAttendeesHelper',
  'pricingExtraAttendeeName',
  'pricingAddAttendee',
  'pricingRemoveAttendee',
  'pricingExtraAttendeeWaiver',
] as const

describe('i18n — new keys', () => {
  for (const key of NEW_KEYS) {
    it(`EN has non-empty "${key}"`, () => {
      expect((siteStrings.en as Record<string, unknown>)[key]).toBeTruthy()
    })
    it(`FR has non-empty "${key}"`, () => {
      expect((siteStrings.fr as Record<string, unknown>)[key]).toBeTruthy()
    })
  }
})
```

**Run:** `npx vitest run tests/unit/i18n.test.ts`

---

## 3. API Integration Tests — `POST /api/inquiry`

**Tool:** `node --test` or Vitest with `supertest`-style fetch  
**File:** `tests/api/inquiry.test.ts`  
**Requires:** `vercel dev` running on `http://localhost:3000`

```ts
// Run: vercel dev &  then  npx vitest run tests/api/inquiry.test.ts

const BASE = 'http://localhost:3000'

describe('POST /api/inquiry', () => {
  it('accepts Private Event with message field', async () => {
    const res = await fetch(`${BASE}/api/inquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '514-000-0000',
        classType: 'Private Event',
        preferredDate: '2026-06-14',
        preferredTime: '2026-06-14T14:30:00Z',
        groupSize: '4',
        message: 'Allergy to dogs — is that possible?',
      }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('accepts Corporate with companyName + message', async () => {
    const res = await fetch(`${BASE}/api/inquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'HR Manager',
        email: 'hr@acmecorp.com',
        phone: '514-111-2222',
        classType: 'Corporate',
        preferredDate: '2026-06-21',
        preferredTime: '2026-06-21T16:00:00Z',
        groupSize: '12',
        companyName: 'Acme Corp',
        message: 'We need a private room if possible.',
      }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('returns 405 for GET', async () => {
    const res = await fetch(`${BASE}/api/inquiry`)
    expect(res.status).toBe(405)
  })

  it('handles missing optional fields gracefully', async () => {
    const res = await fetch(`${BASE}/api/inquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Minimal User',
        email: 'min@example.com',
        phone: '000-000-0000',
        classType: 'Private Event',
      }),
    })
    expect(res.status).toBe(200)
  })
})
```

---

## 4. API Integration Tests — `POST /api/booking` (Square Sandbox)

**File:** `tests/api/booking.test.ts`  
**Requires:** `vercel dev` running; Square sandbox credentials in `.env.local`

```ts
// These hit real Square sandbox — they create real sandbox bookings + payments.
// Use sandbox card nonce: "cnon:card-nonce-ok" for approved payments.

describe('POST /api/booking', () => {
  const VALID_BODY = {
    givenName: 'Test',
    familyName: 'User',
    email: 'testuser@yopaw-test.com',
    phone: '514-000-9999',
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

  it('books 1 person successfully', async () => {
    const res = await fetch(`${BASE}/api/booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_BODY),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.bookingId).toBeTruthy()
    expect(body.paymentStatus).toMatch(/COMPLETED|APPROVED/)
  })

  it('books 3 people (1 primary + 2 extra) and charges 3×', async () => {
    const res = await fetch(`${BASE}/api/booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...VALID_BODY,
        startAt: '2026-06-14T16:00:00Z',
        extraAttendees: [
          { name: 'Alice Smith' },
          { name: 'Bob Jones' },
        ],
      }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.bookingId).toBeTruthy()
  })

  it('books 1 person + mat rental', async () => {
    const res = await fetch(`${BASE}/api/booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...VALID_BODY,
        startAt: '2026-06-21T14:30:00Z',
        needsMatRental: true,
      }),
    })
    expect(res.status).toBe(200)
  })

  it('returns 409 when slot is full', async () => {
    // Pre-condition: slot must already be at maxSeats. Use a known-full slot in sandbox or mock getMaxSeats to 0.
    // Skipped in standard CI — run manually with a prepared sandbox state.
  })

  it('returns friendly error on declined card', async () => {
    const res = await fetch(`${BASE}/api/booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...VALID_BODY, cardNonce: 'cnon:card-nonce-declined' }),
    })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/declined|card/i)
  })
})
```

---

## 5. E2E Tests — Full Booking Flow (Playwright)

**Tool:** Playwright  
**File:** `tests/e2e/booking.spec.ts`  
**Requires:** `vite dev` running on `http://localhost:5173`; Square sandbox SDK

### Setup

```ts
// playwright.config.ts (already exists — check webServer config)
import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests/e2e',
  webServer: { command: 'vite', url: 'http://localhost:5173', reuseExistingServer: true },
  use: { baseURL: 'http://localhost:5173' },
})
```

### Test: Regular Class — 1 person, no mat, with waiver

```ts
import { test, expect } from '@playwright/test'

test('regular class — 1 person, no mat, waiver + pay', async ({ page }) => {
  await page.goto('/#book')
  await page.getByRole('button', { name: /Regular Class/i }).click()

  // Mat step
  await page.getByRole('button', { name: /bring my own/i }).click()

  // Date step — pick first available date
  await page.locator('.pricing-session-row').first().click()
  // Time modal
  await page.locator('.pricing-time-slot-row').first().click()

  // Contact step
  await page.fill('#pub-fullname', 'Jane Doe')
  await page.fill('#pub-email', 'jane@test.com')
  await page.fill('#pub-phone', '514-555-1234')

  // No extra attendees — skip

  // Waiver checkbox
  await page.locator('#pub-waiver').check()

  // Submit should be enabled
  const submitBtn = page.getByRole('button', { name: /Confirm booking/i })
  await expect(submitBtn).toBeEnabled()
  await submitBtn.click()

  // Payment step
  await expect(page.locator('.pricing-payment-summary')).toBeVisible()
  await expect(page.locator('.pricing-payment-summary')).toContainText('1 × Puppy Yoga Class')

  // Fill sandbox card via Square iframe
  // (Square iframe requires special handling — use page.frameLocator)
  const cardFrame = page.frameLocator('iframe[title*="card"]')
  await cardFrame.locator('[name="cardnumber"]').fill('4111 1111 1111 1111')
  await cardFrame.locator('[name="exp-date"]').fill('12/30')
  await cardFrame.locator('[name="cvv"]').fill('123')
  await cardFrame.locator('[name="postal"]').fill('12345')

  await page.getByRole('button', { name: /Confirm booking/i }).click()

  // Success screen
  await expect(page.locator('.pricing-success')).toBeVisible({ timeout: 15000 })
  await expect(page.locator('.pricing-success')).toContainText("You're on the mat")
})
```

### Test: Regular Class — 3 people, all waivers required

```ts
test('regular class — 3 people, submit blocked until all waivers checked', async ({ page }) => {
  await page.goto('/#book')
  await page.getByRole('button', { name: /Regular Class/i }).click()
  await page.getByRole('button', { name: /bring my own/i }).click()
  await page.locator('.pricing-session-row').first().click()
  await page.locator('.pricing-time-slot-row').first().click()

  await page.fill('#pub-fullname', 'Alice Primary')
  await page.fill('#pub-email', 'alice@test.com')
  await page.fill('#pub-phone', '514-000-0001')

  // Add 2 extra attendees
  await page.getByRole('button', { name: /Add another attendee/i }).click()
  await page.locator('.pricing-extra-attendee-card').nth(0).locator('input[type="text"]').fill('Bob Extra')

  await page.getByRole('button', { name: /Add another attendee/i }).click()
  await page.locator('.pricing-extra-attendee-card').nth(1).locator('input[type="text"]').fill('Carol Extra')

  // Primary waiver
  await page.locator('#pub-waiver').check()

  // Submit should still be disabled (extras haven't checked waivers)
  const submit = page.getByRole('button', { name: /Confirm booking/i })
  await expect(submit).toBeDisabled()

  // Check Bob's waiver
  await page.locator('.pricing-extra-attendee-card').nth(0).locator('input[type="checkbox"]').check()
  await expect(submit).toBeDisabled()

  // Check Carol's waiver — now all 3 are checked
  await page.locator('.pricing-extra-attendee-card').nth(1).locator('input[type="checkbox"]').check()
  await expect(submit).toBeEnabled()
})
```

### Test: Payment summary shows correct total for 3 people

```ts
test('payment summary — 3 people total is 3× base price', async ({ page }) => {
  // Navigate to payment step with 3 attendees (1 primary + 2 extra)
  // ... (same setup as above, then submit to reach payment)

  const summary = page.locator('.pricing-payment-summary')
  await expect(summary).toContainText('3 × Puppy Yoga Class')
  // Price should be 3 × $46 = $138 + taxes — spot-check label not exact dollar for sandbox variance
  await expect(summary).toContainText('138')
})
```

### Test: Private Event inquiry — message field appears and submits

```ts
test('private event — message field is visible and submitted', async ({ page }) => {
  await page.goto('/#book')
  await page.getByRole('button', { name: /Private Event/i }).click()

  // People step
  await page.getByRole('button', { name: /Continue/i }).click()

  // Date step
  await page.locator('.pricing-session-row').first().click()
  await page.locator('.pricing-time-slot-row').first().click()

  // Contact step
  await page.fill('#pub-fullname', 'Private Client')
  await page.fill('#pub-email', 'private@test.com')
  await page.fill('#pub-phone', '514-000-0002')

  // Message textarea should be visible
  await expect(page.locator('#pub-message')).toBeVisible()
  await page.fill('#pub-message', 'We are celebrating a birthday!')

  await page.getByRole('button', { name: /Send my request/i }).click()

  // Success
  await expect(page.locator('.pricing-success')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('.pricing-success')).toContainText('Request received')
})
```

### Test: Corporate inquiry — company name + message

```ts
test('corporate inquiry — company name and message fields work', async ({ page }) => {
  await page.goto('/#book')
  await page.getByRole('button', { name: /Corporate/i }).click()

  // People
  await page.getByRole('button', { name: /Continue/i }).click()

  // Date
  await page.locator('.pricing-session-row').first().click()
  await page.locator('.pricing-time-slot-row').first().click()

  // Contact
  await page.fill('#corp-fullname', 'HR Director')
  await page.fill('#corp-company', 'Acme Corp')
  await page.fill('#corp-email', 'hr@acme.com')
  await page.fill('#corp-phone', '514-999-8888')
  await page.fill('#corp-message', 'Looking for a team of 15.')

  await page.getByRole('button', { name: /Send my request/i }).click()

  await expect(page.locator('.pricing-success')).toBeVisible({ timeout: 10000 })
})
```

### Test: Language toggle — all new strings appear in FR

```ts
test('FR language — new extra attendee strings are in French', async ({ page }) => {
  await page.goto('/')
  // Pick FR on language modal if shown
  const frBtn = page.getByRole('button', { name: /français/i })
  if (await frBtn.isVisible()) await frBtn.click()

  await page.goto('/#book')
  await page.getByRole('button', { name: /Cours régulier/i }).click()
  await page.getByRole('button', { name: /j'apporte le mien/i }).click()
  await page.locator('.pricing-session-row').first().click()
  await page.locator('.pricing-time-slot-row').first().click()

  // Helper text should be French
  await expect(page.locator('.pricing-extra-attendees')).toContainText('Ajoutez jusqu')
  await expect(page.getByRole('button', { name: /Ajouter un participant/i })).toBeVisible()
})
```

---

## 6. Manual Verification Checklist

Run these by hand in the browser before each production deploy. They cover UX edge cases that automation misses.

### Regular Class

| # | Step | Expected |
|---|---|---|
| 1 | Choose Regular Class → "Bring my own mat" | Advances to date picker |
| 2 | Pick date + time | Advances to contact |
| 3 | Fill contact + add 1 extra attendee | Extra attendee card appears with name input + waiver |
| 4 | Try to submit without extra attendee waiver checked | Button stays disabled |
| 5 | Check extra attendee waiver | Button becomes enabled |
| 6 | Remove extra attendee | Card disappears, total resets to 1 |
| 7 | Add 4 extra attendees | "+ Add" button disappears (at max) |
| 8 | Reach payment step with 2 people | Summary shows "2 × Puppy Yoga Class" and correct $$ |
| 9 | Pay with sandbox card | Success screen appears with correct name/date/time |
| 10 | Check Square Dashboard → calendar | Booking note shows "Total attendees: 2 · Names: ..." |
| 11 | Check Square Dashboard → payment | Charge = 2 × $46 + taxes |
| 12 | Check Resend notification email | Shows all attendee names, correct total |

### Private Event

| # | Step | Expected |
|---|---|---|
| 1 | Choose Private Event | Group size picker shows |
| 2 | Set 6 people → Continue | Date picker shows |
| 3 | Pick date + time | Contact form shows |
| 4 | Fill contact + message | Message textarea visible |
| 5 | Submit | "Request received" screen |
| 6 | Check notification email | Shows group size 6, message content |
| 7 | Check Zapier | Private inquiry event fires with message field |

### Corporate Event

| # | Step | Expected |
|---|---|---|
| 1 | Choose Corporate | Group size picker shows |
| 2 | Set 12 people → Continue | Date picker shows |
| 3 | Pick date + time | Contact form shows company name field |
| 4 | Try submit without company name | HTML5 required validation blocks |
| 5 | Fill all fields including message | Submit enables |
| 6 | Submit | "Request received" screen |
| 7 | Check notification email | Shows company name and message |
| 8 | Check Zapier | Corporate inquiry event fires with companyName |

### French Language

| # | Step | Expected |
|---|---|---|
| 1 | Switch to FR before booking | All new strings appear in French |
| 2 | Extra attendee label | "Participant 2", "Participant 3", etc. |
| 3 | Payment summary with 2 people | "2 × Cours de yoga avec chiots" |
| 4 | Corporate company name label | "Nom de l'entreprise" |

---

## 7. Regression Checklist

These existing features must still work after the changes.

| Feature | What to check |
|---|---|
| Single-person Regular Class | Books 1 person, charges 1 × $46 |
| Mat rental | Adds $5 to base before tax; appears as separate line |
| Back button | Works at every step (mat → class, date → mat, contact → date, payment → contact) |
| Seat guard (409) | Full slot returns "class is full" message |
| Declined card | Friendly error shown, no ghost booking in Square |
| Language modal | Appears on first visit; blocks UI until language chosen |
| Refund policy page | Loads at `/refund-policy` and `/politique-remboursement` |
| Zapier webhook — regular | Fires once after successful payment with correct attendeeCount |
| Zapier webhook — inquiry | Fires for private/corporate only; NOT for regular class lead-capture |

---

## Running Everything

```bash
# 1. Unit tests (no server needed)
npx vitest run tests/unit/

# 2. API integration tests (needs vercel dev)
vercel dev &
npx vitest run tests/api/

# 3. E2E tests (needs vite dev)
vite &
npx playwright test tests/e2e/

# All in sequence
npx vitest run && npx playwright test
```

---

## CI Integration (Recommended)

Add to your Vercel preview deploy workflow or GitHub Actions:

```yaml
- name: Unit tests
  run: npx vitest run tests/unit/

- name: Build check
  run: tsc -b && vite build

- name: E2E (against preview URL)
  run: PLAYWRIGHT_BASE_URL=${{ env.VERCEL_URL }} npx playwright test tests/e2e/
  env:
    VERCEL_URL: ${{ steps.deploy.outputs.url }}
```

> The Square sandbox API integration tests (`tests/api/booking.test.ts`) are best run locally or in a dedicated sandbox environment — they create real Square sandbox bookings and should not run on every PR.
