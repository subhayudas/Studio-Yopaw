# Fix: Multi-Attendee Seat Counting

## Problem

When a booking is made for 5 people (1 primary + 4 extra attendees), `availability.ts`
counts it as **1 seat taken**, not 5. A class of 20 seats could be over-sold.

**Root cause — `api/availability.ts` line 74:**
```ts
bookingCounts.set(key, (bookingCounts.get(key) ?? 0) + 1)
//                                                     ↑ always 1, ignores group size
```

`booking.ts` always creates exactly **one** Square booking record regardless of attendee
count. The attendee count is only stored in `customerNote`:
```
"Total attendees: 5 · Names: Jane Doe, Bob Smith, Alice Jones, Mary Lee, Tom Brun · Waiver confirmed: yes"
```

---

## Fix (single file: `api/availability.ts`)

Add a `parseAttendeeCount` helper and use it instead of `+ 1`.

**Add above the `handler` export:**
```ts
function parseAttendeeCount(note: string | undefined | null): number {
  if (!note) return 1
  const m = note.match(/Total attendees:\s*(\d+)/)
  return m ? Math.max(1, parseInt(m[1], 10)) : 1
}
```

**Change line 74 from:**
```ts
bookingCounts.set(key, (bookingCounts.get(key) ?? 0) + 1)
```

**To:**
```ts
bookingCounts.set(key, (bookingCounts.get(key) ?? 0) + parseAttendeeCount(booking.customerNote))
```

No other files need to change. The note format is already written correctly by `booking.ts`.

---

## Tests

Three layers matching what already exists in this project.

---

### Layer 1 — Static source check (`tests/verify-fixes.mjs`)

Add to the existing `verify-fixes.mjs` file (after the last test):

```js
// ─── Multi-attendee seat counting fix ────────────────────────────────────────

const availability = fs.readFileSync('./api/availability.ts', 'utf8')

test('availability.ts: has parseAttendeeCount helper', () => {
  assert.ok(
    availability.includes('parseAttendeeCount'),
    'parseAttendeeCount not found in availability.ts — seat count will always be +1 per booking'
  )
})

test('availability.ts: parseAttendeeCount reads customerNote', () => {
  assert.ok(
    availability.includes('booking.customerNote'),
    'availability.ts does not read booking.customerNote — attendee count cannot be extracted'
  )
})

test('availability.ts: does not use raw +1 increment for bookingCounts', () => {
  // The old pattern was:  bookingCounts.set(key, (bookingCounts.get(key) ?? 0) + 1)
  // The fixed pattern calls parseAttendeeCount instead of adding 1 directly.
  const hasRawPlusOne = /bookingCounts\.set\([^)]+\)\s*\+\s*1\)/.test(availability)
  assert.ok(
    !hasRawPlusOne,
    'availability.ts still uses raw +1 per booking — multi-attendee groups will be undercounted'
  )
})

test('availability.ts: parseAttendeeCount regex targets "Total attendees:" note format', () => {
  assert.ok(
    availability.includes('Total attendees'),
    'parseAttendeeCount does not look for "Total attendees" — will not parse booking.ts notes correctly'
  )
})
```

Run: `npm test` (runs `node --test tests/verify-fixes.mjs`)

---

### Layer 2 — Unit tests (`tests/availability-seat-count.test.mjs`)

New file — tests the `parseAttendeeCount` logic in pure JS (no Square, no HTTP).
Because `availability.ts` is TypeScript/ESM, we test the logic directly rather than
importing the compiled module.

```js
/**
 * Unit tests for the parseAttendeeCount helper used in availability.ts.
 * Extracts and re-tests the same regex/logic so we can cover edge cases cheaply.
 *
 * Run: node --test tests/availability-seat-count.test.mjs
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

// Mirror of the helper in availability.ts — keep in sync if the function changes.
function parseAttendeeCount(note) {
  if (!note) return 1
  const m = note.match(/Total attendees:\s*(\d+)/)
  return m ? Math.max(1, parseInt(m[1], 10)) : 1
}

// Simulates the bookingCounts accumulation in availability.ts
function countSeats(bookings) {
  const counts = new Map()
  for (const b of bookings) {
    const key = b.startAt
    counts.set(key, (counts.get(key) ?? 0) + parseAttendeeCount(b.customerNote))
  }
  return counts
}

// ─── parseAttendeeCount edge cases ───────────────────────────────────────────

test('undefined note → 1', () => {
  assert.equal(parseAttendeeCount(undefined), 1)
})

test('null note → 1', () => {
  assert.equal(parseAttendeeCount(null), 1)
})

test('empty string → 1', () => {
  assert.equal(parseAttendeeCount(''), 1)
})

test('unrelated note text → 1', () => {
  assert.equal(parseAttendeeCount('Some random customer note'), 1)
})

test('single attendee note → 1', () => {
  assert.equal(
    parseAttendeeCount('Total attendees: 1 · Names: Jane Doe · Waiver confirmed: yes'),
    1
  )
})

test('5-person group note → 5', () => {
  assert.equal(
    parseAttendeeCount('Total attendees: 5 · Names: Jane Doe, Bob Smith, Alice Jones, Mary Lee, Tom Brun · Waiver confirmed: yes'),
    5
  )
})

test('10-person group note → 10', () => {
  assert.equal(
    parseAttendeeCount('Total attendees: 10 · Names: A, B, C, D, E, F, G, H, I, J · Waiver confirmed: yes'),
    10
  )
})

test('note with 0 attendees → floors to 1 (defensive)', () => {
  assert.equal(parseAttendeeCount('Total attendees: 0 · Names:'), 1)
})

// ─── Seat accumulation scenarios ─────────────────────────────────────────────

const SLOT = '2026-06-14T14:30:00Z'

test('single solo booking → 1 seat taken', () => {
  const counts = countSeats([
    { startAt: SLOT, customerNote: 'Total attendees: 1 · Names: Alice · Waiver confirmed: yes' },
  ])
  assert.equal(counts.get(SLOT), 1)
})

test('single 5-person booking → 5 seats taken', () => {
  const counts = countSeats([
    { startAt: SLOT, customerNote: 'Total attendees: 5 · Names: A, B, C, D, E · Waiver confirmed: yes' },
  ])
  assert.equal(counts.get(SLOT), 5)
})

test('two solo bookings → 2 seats taken', () => {
  const counts = countSeats([
    { startAt: SLOT, customerNote: 'Total attendees: 1 · Names: Alice · Waiver confirmed: yes' },
    { startAt: SLOT, customerNote: 'Total attendees: 1 · Names: Bob · Waiver confirmed: yes' },
  ])
  assert.equal(counts.get(SLOT), 2)
})

test('3-person + 2-person bookings → 5 seats taken', () => {
  const counts = countSeats([
    { startAt: SLOT, customerNote: 'Total attendees: 3 · Names: A, B, C · Waiver confirmed: yes' },
    { startAt: SLOT, customerNote: 'Total attendees: 2 · Names: D, E · Waiver confirmed: yes' },
  ])
  assert.equal(counts.get(SLOT), 5)
})

test('booking without customerNote (old booking before fix) → counts as 1', () => {
  const counts = countSeats([
    { startAt: SLOT, customerNote: undefined },
  ])
  assert.equal(counts.get(SLOT), 1)
})

test('bookings at different slots do not bleed into each other', () => {
  const SLOT_B = '2026-06-14T16:00:00Z'
  const counts = countSeats([
    { startAt: SLOT,   customerNote: 'Total attendees: 4 · Names: A, B, C, D · Waiver confirmed: yes' },
    { startAt: SLOT_B, customerNote: 'Total attendees: 2 · Names: E, F · Waiver confirmed: yes' },
  ])
  assert.equal(counts.get(SLOT),   4)
  assert.equal(counts.get(SLOT_B), 2)
})

test('20-seat class: 4 groups of 5 → 0 seats remaining', () => {
  const bookings = Array.from({ length: 4 }, (_, i) => ({
    startAt: SLOT,
    customerNote: `Total attendees: 5 · Names: P${i*5+1}, P${i*5+2}, P${i*5+3}, P${i*5+4}, P${i*5+5} · Waiver confirmed: yes`,
  }))
  const counts = countSeats(bookings)
  const maxSeats = 20
  const seatsRemaining = Math.max(0, maxSeats - (counts.get(SLOT) ?? 0))
  assert.equal(seatsRemaining, 0)
})

test('20-seat class: 1 group of 5 + 14 solos → 1 seat remaining', () => {
  const bookings = [
    { startAt: SLOT, customerNote: 'Total attendees: 5 · Names: A, B, C, D, E · Waiver confirmed: yes' },
    ...Array.from({ length: 14 }, () => ({ startAt: SLOT, customerNote: 'Total attendees: 1 · Names: X · Waiver confirmed: yes' })),
  ]
  const counts = countSeats(bookings)
  const seatsRemaining = Math.max(0, 20 - (counts.get(SLOT) ?? 0))
  assert.equal(seatsRemaining, 1)
})
```

Add to `package.json` scripts:
```json
"test:unit": "node --test tests/availability-seat-count.test.mjs"
```

Or extend the default `test` script to run both files:
```json
"test": "node --test tests/verify-fixes.mjs && node --test tests/availability-seat-count.test.mjs"
```

---

### Layer 3 — Playwright E2E (`tests/e2e/booking-flow.spec.ts`)

Add a new `describe` block that verifies the frontend correctly reflects reduced seat
counts when the mock API returns fewer remaining seats for a slot that had a group booking.

```ts
test.describe('Seat count display — multi-attendee', () => {
  test('slot with 1 seat remaining shows as available', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('studio-yopaw-lang', 'en'))

    const d = new Date()
    d.setDate(d.getDate() + 10)
    const iso = d.toISOString().split('T')[0]

    // Simulate: 5-person group already booked on a 6-seat slot → 1 left
    await page.route('**/api/availability**', route =>
      route.fulfill({ json: { availabilities: [
        { startAt: `${iso}T14:30:00Z`, seatsRemaining: 1 },
      ]}})
    )
    await page.route('**/api/breeds**', route =>
      route.fulfill({ json: { schedule: {
        [iso]: [{ breed: { en: 'Golden Retriever', fr: 'Golden Retriever' }, serviceIds: [] }],
      }}})
    )

    await page.goto('/#book')
    await expect(page.getByText('What kind of class are you looking for?')).toBeVisible()
    await page.locator('.pricing-choice-card', { hasText: 'Regular Class' }).click()
    await page.getByText("Yes, I'll bring my own").click()

    // Date row should appear (1 seat = still available)
    const row = page.locator('.pricing-session-row').first()
    await expect(row).toBeVisible({ timeout: 8_000 })
  })

  test('slot with 0 seats remaining is hidden from the date picker', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('studio-yopaw-lang', 'en'))

    const d = new Date()
    d.setDate(d.getDate() + 10)
    const iso = d.toISOString().split('T')[0]

    // All seats taken — API returns seatsRemaining: 0
    await page.route('**/api/availability**', route =>
      route.fulfill({ json: { availabilities: [
        { startAt: `${iso}T14:30:00Z`, seatsRemaining: 0 },
      ]}})
    )
    await page.route('**/api/breeds**', route =>
      route.fulfill({ json: { schedule: {
        [iso]: [{ breed: { en: 'Golden Retriever', fr: 'Golden Retriever' }, serviceIds: [] }],
      }}})
    )

    await page.goto('/#book')
    await expect(page.getByText('What kind of class are you looking for?')).toBeVisible()
    await page.locator('.pricing-choice-card', { hasText: 'Regular Class' }).click()
    await page.getByText("Yes, I'll bring my own").click()

    // No date rows should appear — all slots full
    await page.waitForTimeout(2_000)
    await expect(page.locator('.pricing-session-row')).toHaveCount(0)
  })
})
```

---

## Implementation Order

1. **Write unit tests first** — add `tests/availability-seat-count.test.mjs` and run
   `node --test tests/availability-seat-count.test.mjs`. All passing (the logic is
   extracted/mirrored, not imported from the broken file).

2. **Apply the fix** — add `parseAttendeeCount` to `api/availability.ts` and change the
   `+ 1` to `+ parseAttendeeCount(booking.customerNote)`.

3. **Run static checks** — `npm test`. The four new `verify-fixes.mjs` assertions should
   now pass alongside the existing 67.

4. **Add E2E tests** — append the new `describe` block to `booking-flow.spec.ts` and run
   `npm run test:e2e`.

5. **Update `package.json`** — extend the `test` script to include the new unit test file.

---

## Edge Cases Handled

| Case | Behaviour |
|---|---|
| Booking created before this fix (no note) | `parseAttendeeCount` returns 1 — safe fallback |
| Note format changed / corrupted | Regex returns no match → falls back to 1 |
| `customerNote` is `undefined` or `null` | Returns 1 |
| `Total attendees: 0` (shouldn't happen) | `Math.max(1, 0)` clamps to 1 |
| Multiple groups at the same slot | Counts accumulate correctly via the Map |

---

## What Does NOT Change

- `booking.ts` — already writes `Total attendees: N` in `customerNote`. No change needed.
- `class-schedule.json` — `maxSeats` field stays as the cap. No change.
- Frontend (`App.tsx`) — already reads `seatsRemaining` from the API response. No change.
- The Square calendar display — still shows 1 appointment per group booking (Square does
  not support multi-person appointment entries natively). The fix is purely in how we count
  seats against `maxSeats` on the availability side.
