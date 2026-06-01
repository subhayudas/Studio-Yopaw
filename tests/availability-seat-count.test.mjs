/**
 * Unit tests for the parseAttendeeCount helper in availability.ts.
 * Mirrors the same logic so edge cases can be covered without importing TS.
 *
 * Run: node --test tests/availability-seat-count.test.mjs
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

// Mirror of parseAttendeeCount in api/availability.ts — keep in sync if the function changes.
function parseAttendeeCount(note) {
  if (!note) return 1
  const m = note.match(/Total attendees:\s*(\d+)/)
  return m ? Math.max(1, parseInt(m[1], 10)) : 1
}

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

test('3-person + 2-person bookings at same slot → 5 seats taken', () => {
  const counts = countSeats([
    { startAt: SLOT, customerNote: 'Total attendees: 3 · Names: A, B, C · Waiver confirmed: yes' },
    { startAt: SLOT, customerNote: 'Total attendees: 2 · Names: D, E · Waiver confirmed: yes' },
  ])
  assert.equal(counts.get(SLOT), 5)
})

test('booking without customerNote (pre-fix booking) → counts as 1', () => {
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
  const seatsRemaining = Math.max(0, 20 - (counts.get(SLOT) ?? 0))
  assert.equal(seatsRemaining, 0)
})

test('20-seat class: 1 group of 5 + 14 solos → 1 seat remaining', () => {
  const bookings = [
    { startAt: SLOT, customerNote: 'Total attendees: 5 · Names: A, B, C, D, E · Waiver confirmed: yes' },
    ...Array.from({ length: 14 }, () => ({
      startAt: SLOT,
      customerNote: 'Total attendees: 1 · Names: X · Waiver confirmed: yes',
    })),
  ]
  const counts = countSeats(bookings)
  const seatsRemaining = Math.max(0, 20 - (counts.get(SLOT) ?? 0))
  assert.equal(seatsRemaining, 1)
})
