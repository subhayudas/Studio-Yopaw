/**
 * Automated code-level verification tests.
 * Validates that all recent fixes are actually present in source files.
 * No external dependencies — uses Node.js built-in test runner.
 *
 * Run: node --test tests/verify-fixes.mjs
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const booking      = fs.readFileSync('./api/booking.ts', 'utf8')
const inquiry      = fs.readFileSync('./api/inquiry.ts', 'utf8')
const appTsx       = fs.readFileSync('./src/App.tsx', 'utf8')
const availability = fs.readFileSync('./api/availability.ts', 'utf8')
// Seat-count engine — the counting logic moved here from availability.ts
const availabilityEngine = fs.readFileSync('./api/_availability.ts', 'utf8')
const voucherApi   = fs.readFileSync('./api/voucher.ts', 'utf8')

// ─── Payment bug #1: Taxes always applied ────────────────────────────────────

test('booking.ts: no conditional tax block (taxes always applied)', () => {
  assert.ok(
    !booking.includes('gstTaxId && qstTaxId'),
    'Found "gstTaxId && qstTaxId" conditional — taxes are still skipped when env vars missing'
  )
})

test('booking.ts: no fallback "charge base amount only" path', () => {
  assert.ok(
    !booking.includes('Tax IDs not yet configured'),
    'Old fallback comment still present — conditional tax block may not have been removed'
  )
})

test('booking.ts: has inline GST percentage (5%)', () => {
  assert.ok(
    booking.includes("percentage: '5'"),
    'Missing inline GST 5% — taxes may not always be applied'
  )
})

test('booking.ts: has inline QST percentage (9.975%)', () => {
  assert.ok(
    booking.includes("percentage: '9.975'"),
    'Missing inline QST 9.975% — taxes may not always be applied'
  )
})

test('booking.ts: chargeAmount always comes from order.totalMoney', () => {
  assert.ok(
    booking.includes('order!.totalMoney!.amount!'),
    'chargeAmount not derived from Square order — custom total may still be used'
  )
  // Should not fall back to BigInt(baseAmountCents) as the charge
  const fallbackMatch = booking.match(/chargeAmount\s*=\s*BigInt\(baseAmountCents\)/)
  assert.ok(
    !fallbackMatch,
    'Found chargeAmount = BigInt(baseAmountCents) fallback — custom total still used in some path'
  )
})

// ─── Payment bug #2: Catalog service charged (not custom total) ───────────────

test('booking.ts: order line item uses catalogObjectId (not custom name+price)', () => {
  assert.ok(
    booking.includes('catalogObjectId: serviceVariationId'),
    'booking.ts missing catalogObjectId — still using custom line item price'
  )
})

test('booking.ts: service line item does not use basePriceMoney override', () => {
  // The catalogObjectId block must not have a basePriceMoney — that would override catalog price.
  // Mat rental can still use basePriceMoney (as a separate item).
  const catalogBlock = booking.match(/catalogObjectId[\s\S]{0,300}appliedTaxes/)
  assert.ok(
    catalogBlock && !catalogBlock[0].includes('basePriceMoney'),
    'catalogObjectId line item block includes basePriceMoney — catalog price is being overridden'
  )
})

test('booking.ts: mat rental uses flat 500n (no tax applied to it)', () => {
  assert.ok(
    booking.includes('500n'),
    'Mat rental flat amount not found (expected 500n)'
  )
  // Mat rental item should NOT have appliedTaxes
  const matRentalBlock = booking.match(/Mat Rental[\s\S]{0,200}basePriceMoney/)
  assert.ok(matRentalBlock, 'Mat rental line item not found near basePriceMoney')
  assert.ok(
    matRentalBlock && !matRentalBlock[0].includes('appliedTaxes'),
    'Mat rental item has appliedTaxes — user said no tax on mat rental'
  )
})

test('booking.ts: needsMatRental is in request body type', () => {
  assert.ok(
    booking.includes('needsMatRental?: boolean'),
    'needsMatRental missing from booking.ts request body type'
  )
})

// ─── Webhook simplification ───────────────────────────────────────────────────

test('booking.ts: uses ZAPIER_REGULAR_URL (single webhook)', () => {
  assert.ok(
    booking.includes('ZAPIER_REGULAR_URL'),
    'ZAPIER_REGULAR_URL not found in booking.ts'
  )
})

test('booking.ts: old multi-webhook URLs removed', () => {
  assert.ok(
    !booking.includes('ZAPIER_NEW_CONTACT_URL'),
    'ZAPIER_NEW_CONTACT_URL still present in booking.ts'
  )
  assert.ok(
    !booking.includes('ZAPIER_FORM_URL'),
    'ZAPIER_FORM_URL still present in booking.ts'
  )
  assert.ok(
    !booking.includes('ZAPIER_NEW_BOOKING_URL'),
    'ZAPIER_NEW_BOOKING_URL still present in booking.ts'
  )
})

test('booking.ts: webhook payload includes attendeeCount: totalPeople', () => {
  assert.ok(
    booking.includes('attendeeCount: totalPeople'),
    'booking.ts webhook payload missing attendeeCount: totalPeople — must scale with extra attendees'
  )
})

test('inquiry.ts: uses ZAPIER_INQUIRY_URL (single webhook)', () => {
  assert.ok(
    inquiry.includes('ZAPIER_INQUIRY_URL'),
    'ZAPIER_INQUIRY_URL not found in inquiry.ts'
  )
})

test('inquiry.ts: old multi-webhook URLs removed', () => {
  assert.ok(
    !inquiry.includes('ZAPIER_NEW_CONTACT_URL'),
    'ZAPIER_NEW_CONTACT_URL still present in inquiry.ts'
  )
  assert.ok(
    !inquiry.includes('ZAPIER_FORM_URL'),
    'ZAPIER_FORM_URL still present in inquiry.ts'
  )
})

test('inquiry.ts: Zapier skipped for Regular Class (guard present)', () => {
  assert.ok(
    inquiry.includes("classType !== 'Regular Class'"),
    'inquiry.ts missing Regular Class guard — Zapier fires for regular class lead-capture too'
  )
})

test('inquiry.ts: webhook payload includes attendeeCount', () => {
  assert.ok(
    inquiry.includes('attendeeCount:'),
    'inquiry.ts webhook payload missing attendeeCount field'
  )
})

// ─── Frontend sends needsMatRental ───────────────────────────────────────────

test('App.tsx: booking request sends needsMatRental (not baked into baseAmountCents)', () => {
  assert.ok(
    appTsx.includes('needsMatRental,'),
    'App.tsx not sending needsMatRental in booking request body'
  )
  // The baseAmountCents sent should be the base service price only (mat NOT baked in)
  assert.ok(
    appTsx.includes('baseAmountCents: serviceInfo.baseAmountCents,'),
    'App.tsx still baking mat rental into baseAmountCents for the API call'
  )
})

// ─── Frontend flow: private/corporate has date step ──────────────────────────

test('App.tsx: corporate flow has date step in type definition', () => {
  assert.ok(
    appTsx.includes("kind: 'corporate'; step: 'people' | 'date' | 'contact'"),
    "Corporate flow missing 'date' step in Flow type"
  )
})

test('App.tsx: advanceInquiryPeopleStep advances corporate to date', () => {
  assert.ok(
    appTsx.includes("prev.kind === 'corporate' && prev.step === 'people') return { ...prev, step: 'date' }"),
    'advanceInquiryPeopleStep does not advance corporate flow to date step'
  )
})

test('App.tsx: isDateStep includes corporate.date', () => {
  assert.ok(
    appTsx.includes("flow.kind === 'corporate' && flow.step === 'date'"),
    'isDateStep condition missing corporate flow — date picker would not render for corporate'
  )
})

// ─── Extra attendees (Tasks B–F) ──────────────────────────────────────────────

test('booking.ts: accepts extraAttendees in request body type', () => {
  assert.ok(
    booking.includes('extraAttendees?: Array<{ name: string }>'),
    'extraAttendees not in booking.ts request body type'
  )
})

test('booking.ts: computes totalPeople from extraAttendees', () => {
  assert.ok(
    booking.includes('const totalPeople = 1 + (extraAttendees?.length ?? 0)'),
    'totalPeople not computed from extraAttendees in booking.ts'
  )
})

test('booking.ts: service line item quantity uses totalPeople (not hardcoded 1)', () => {
  assert.ok(
    booking.includes("quantity: String(totalPeople)"),
    'Service line item quantity not using String(totalPeople)'
  )
  // Mat rental correctly stays at quantity '1' — check the service block specifically
  const serviceBlock = booking.match(/catalogObjectId[\s\S]{0,300}appliedTaxes/)
  assert.ok(
    serviceBlock && !serviceBlock[0].includes("quantity: '1'"),
    "Service line item (catalogObjectId block) still has hardcoded quantity: '1'"
  )
})

test('booking.ts: booking note written with attendee names and waiver status', () => {
  assert.ok(
    booking.includes('customerNote: bookingNote'),
    'customerNote not set on booking — attendee info missing from Square calendar'
  )
  assert.ok(
    booking.includes('Waiver confirmed: yes'),
    'Booking note does not include waiver confirmation'
  )
  assert.ok(
    booking.includes('Total attendees:'),
    'Booking note does not include total attendee count'
  )
})

test('booking.ts: per-attendee customer creation with fallback', () => {
  assert.ok(
    booking.includes('findOrCreateCustomer'),
    'findOrCreateCustomer helper not found in booking.ts'
  )
  assert.ok(
    booking.includes('falling back to primary client only'),
    'Rate-limit fallback path missing in booking.ts'
  )
  assert.ok(
    booking.includes('Promise.all('),
    'Promise.all for parallel customer creation not found'
  )
})

test('booking.ts: Zapier payload includes attendeeNames', () => {
  assert.ok(
    booking.includes('attendeeNames: allNames'),
    'Zapier payload missing attendeeNames field'
  )
})

test('App.tsx: extraAttendees state declared', () => {
  assert.ok(
    appTsx.includes('extraAttendees, setExtraAttendees'),
    'extraAttendees state not found in App.tsx'
  )
})

test('App.tsx: submit button disabled when extra attendee waiver unchecked', () => {
  assert.ok(
    appTsx.includes('extraAttendees.some(a => !a.waiverAccepted)'),
    'Submit button does not check extra attendee waivers'
  )
})

test('App.tsx: submit button disabled when extra attendee name is empty', () => {
  assert.ok(
    appTsx.includes("extraAttendees.some(a => !a.name.trim())"),
    'Submit button does not guard against empty attendee names'
  )
})

test('App.tsx: payment groupSize = 1 + extraAttendees.length for yin', () => {
  assert.ok(
    appTsx.includes('1 + extraAttendees.length'),
    'Payment groupSize not using 1 + extraAttendees.length for yin path'
  )
})

// ─── Multi-attendee seat counting fix ────────────────────────────────────────

test('_availability.ts: has parseAttendeeCount helper', () => {
  assert.ok(
    availabilityEngine.includes('parseAttendeeCount'),
    'parseAttendeeCount not found in _availability.ts — seat count will always be +1 per booking'
  )
})

test('_availability.ts: parseAttendeeCount reads booking.customerNote', () => {
  assert.ok(
    availabilityEngine.includes('booking.customerNote'),
    '_availability.ts does not read booking.customerNote — attendee count cannot be extracted'
  )
})

test('_availability.ts: does not use raw +1 increment for bookingCounts', () => {
  const hasRawPlusOne = /bookingCounts\.set\([^)]+\)\s*\+\s*1\)/.test(availabilityEngine)
  assert.ok(
    !hasRawPlusOne,
    '_availability.ts still uses raw +1 per booking — multi-attendee groups will be undercounted'
  )
})

test('_availability.ts: parseAttendeeCount targets "Total attendees:" note format', () => {
  assert.ok(
    availabilityEngine.includes('Total attendees'),
    'parseAttendeeCount does not look for "Total attendees" — will not parse booking.ts notes correctly'
  )
})

test('App.tsx: extraAttendees reset on chooseClass', () => {
  assert.ok(
    appTsx.includes('setExtraAttendees([])'),
    'extraAttendees not reset when choosing a class'
  )
})

test('App.tsx: extraAttendees passed to booking API body', () => {
  assert.ok(
    appTsx.includes('extraAttendees: extraAttendees.map(a => ({ name: a.name }))'),
    'extraAttendees not passed to /api/booking request body'
  )
})

// ─── Message + company name fields (Task A) ───────────────────────────────────

test('inquiry.ts: accepts companyName in request body', () => {
  assert.ok(
    inquiry.includes('companyName?: string'),
    'companyName not in inquiry.ts request body type'
  )
})

test('inquiry.ts: accepts message in request body', () => {
  assert.ok(
    inquiry.includes('message?: string'),
    'message not in inquiry.ts request body type'
  )
})

test('inquiry.ts: companyName included in Resend email', () => {
  assert.ok(
    inquiry.includes('companyName}'),
    'companyName not rendered in inquiry.ts notification email'
  )
})

test('inquiry.ts: message included in Resend email', () => {
  assert.ok(
    inquiry.includes('${message}'),
    'message not rendered in inquiry.ts notification email'
  )
})

test('inquiry.ts: companyName forwarded to Zapier', () => {
  assert.ok(
    inquiry.includes('companyName: companyName'),
    'companyName not included in Zapier payload in inquiry.ts'
  )
})

test('inquiry.ts: message forwarded to Zapier', () => {
  assert.ok(
    inquiry.includes("message: message ??"),
    'message not included in Zapier payload in inquiry.ts'
  )
})

test('App.tsx: privateMessage state declared', () => {
  assert.ok(
    appTsx.includes('privateMessage, setPrivateMessage'),
    'privateMessage state not found in App.tsx'
  )
})

test('App.tsx: corpCompanyName state declared', () => {
  assert.ok(
    appTsx.includes('corpCompanyName, setCorpCompanyName'),
    'corpCompanyName state not found in App.tsx'
  )
})

test('App.tsx: corpMessage state declared', () => {
  assert.ok(
    appTsx.includes('corpMessage, setCorpMessage'),
    'corpMessage state not found in App.tsx'
  )
})

test('App.tsx: privateMessage sent in gentle inquiry body', () => {
  assert.ok(
    appTsx.includes('message: privateMessage'),
    'privateMessage not sent in gentle/private inquiry API call'
  )
})

test('App.tsx: corpCompanyName sent in corporate inquiry body', () => {
  assert.ok(
    appTsx.includes('companyName: corpCompanyName'),
    'corpCompanyName not sent in corporate inquiry API call'
  )
})

test('App.tsx: corpMessage sent in corporate inquiry body', () => {
  assert.ok(
    appTsx.includes('message: corpMessage'),
    'corpMessage not sent in corporate inquiry API call'
  )
})

test('App.tsx: corporate form has company name input (#corp-company)', () => {
  assert.ok(
    appTsx.includes('id="corp-company"'),
    'Corporate form missing company name input (#corp-company)'
  )
})

test('App.tsx: corporate form has message textarea (#corp-message)', () => {
  assert.ok(
    appTsx.includes('id="corp-message"'),
    'Corporate form missing message textarea (#corp-message)'
  )
})

test('App.tsx: private event form has message textarea (#pub-message)', () => {
  assert.ok(
    appTsx.includes('id="pub-message"'),
    'Private event form missing message textarea (#pub-message)'
  )
})

// ─── Voucher / discount code (server-side amounts only) ───────────────────────

test('booking.ts: revalidates voucher server-side (validateVoucher call)', () => {
  assert.ok(
    booking.includes('validateVoucher('),
    'booking.ts does not re-validate the voucher server-side — could book at full price silently'
  )
})

test('booking.ts: order uses catalog discount via catalogObjectId + ORDER scope', () => {
  assert.ok(
    booking.includes("scope: 'ORDER'") && booking.includes('appliedVoucher.discountId'),
    'booking.ts does not attach an ORDER-scoped catalog discount to the order'
  )
})

test('voucher.ts: handler does not trust client-supplied discount amounts', () => {
  assert.ok(
    !voucherApi.includes('req.body.percentage') &&
    !voucherApi.includes('req.body.amountCents') &&
    !voucherApi.includes('body.percentage') &&
    !voucherApi.includes('body.amountCents'),
    'voucher.ts reads a client-supplied discount amount — amounts must come from Square only'
  )
})

test('App.tsx: sends voucherCode (not a discount amount) to /api/booking', () => {
  assert.ok(
    appTsx.includes('voucherCode: appliedVoucher?.code'),
    'App.tsx does not send voucherCode to /api/booking'
  )
  // Must not POST a raw discount amount field to the booking endpoint.
  const bookingBody = appTsx.match(/fetch\('\/api\/booking'[\s\S]{0,800}?\}\),/)
  assert.ok(
    bookingBody && !bookingBody[0].includes('discountCents') && !bookingBody[0].includes('amountCents'),
    'App.tsx sends a discount amount to /api/booking — only the raw voucherCode should be sent'
  )
})
