# Test Documentation

A full explanation of every test written for this project: what it tests, why it exists, and how it works.

---

## Overview

### The changes that needed testing

Three distinct sets of changes were made that all needed validation:

1. **Payment bug — taxes not always applied**: The old code only charged taxes if two environment variables (`SQUARE_GST_TAX_ID`, `SQUARE_QST_TAX_ID`) were set. If either was missing, the charge went through with zero taxes.

2. **Payment bug — custom total instead of catalog service**: The old code sent a custom dollar amount (`baseAmountCents`) from the frontend as the order line item price. This means what Square shows as "the service charged" was an anonymous dollar amount, not the actual catalog item. The fix references the actual Square catalog service via `catalogObjectId`.

3. **Webhook simplification**: The old code fired 3 Zapier webhooks per regular booking and 2 per private/corporate inquiry. The new code fires exactly 1 webhook per flow, with a consistent payload that includes attendee count.

4. **Date step for private/corporate** (verified-only, no code fix needed): The client reported that the date picker step was missing after the participants question for Private Event and Corporate bookings. Verification confirmed the date step was already present in the code — tests were written to guard against it being accidentally removed in the future.

### Why two test tiers

| | Tier 1 — Code Verification | Tier 2 — E2E Browser |
|---|---|---|
| **Speed** | ~100ms | ~30–60s |
| **Dependencies** | None | Playwright + Chromium |
| **Backend needed** | No | No (mocked) |
| **What it validates** | Fixes are present in source | UI actually works in a browser |
| **When to run** | Every time (fast) | Before deploying |

---

## Tier 1 — Code Verification (`tests/verify-fixes.mjs`)

### What it is

A plain JavaScript file that reads the source code files as text and asserts that specific strings and patterns are (or aren't) present. Uses Node.js's built-in `node:test` and `node:assert` modules — zero external dependencies.

### How to run

```bash
node --test tests/verify-fixes.mjs
# or
npm test
```

### Why this approach instead of unit tests

The API handlers (`api/booking.ts`, `api/inquiry.ts`) import from the Square SDK, Resend, and `@vercel/node`. Properly unit-testing them would require mocking all three libraries, which adds hundreds of lines of setup code and creates a maintenance burden. The actual bugs were structural — a missing `if/else` branch, a wrong field name in an object literal. Source code inspection is the lightest possible way to verify structural fixes are present.

---

### Test-by-test breakdown

#### Group: Payment bug #1 — Taxes always applied

---

**`booking.ts: no conditional tax block (taxes always applied)`**

- **Why written**: The original bug was that taxes were wrapped in `if (gstTaxId && qstTaxId) { ... } else { chargeAmount = BigInt(baseAmountCents) }`. The `else` branch charged the base amount with no taxes. This test verifies that branch is gone.
- **How it works**: Reads `api/booking.ts` as a string. Asserts that `gstTaxId && qstTaxId` does not appear anywhere in the file. If someone accidentally re-introduces the conditional, this test fails immediately.
- **Pattern checked**: `booking.includes('gstTaxId && qstTaxId')` → must be false.

---

**`booking.ts: no fallback "charge base amount only" path`**

- **Why written**: Belt-and-suspenders backup for the test above. The old fallback had a distinctive comment `// Tax IDs not yet configured`. If someone re-adds the conditional with different variable names, the comment search catches it.
- **How it works**: Asserts the old comment string is absent.
- **Pattern checked**: `booking.includes('Tax IDs not yet configured')` → must be false.

---

**`booking.ts: has inline GST percentage (5%)`**

- **Why written**: Confirms the replacement is actually there — not just that the old code was removed, but that the new tax approach was put in. An inline GST definition looks like `percentage: '5'` in the Square order taxes array.
- **How it works**: Simple string search for `percentage: '5'`.
- **Pattern checked**: `booking.includes("percentage: '5'")` → must be true.

---

**`booking.ts: has inline QST percentage (9.975%)`**

- **Why written**: Same as above for QST. Both taxes must be present — one missing means partial taxation.
- **How it works**: String search for `percentage: '9.975'`.
- **Pattern checked**: `booking.includes("percentage: '9.975'")` → must be true.

---

**`booking.ts: chargeAmount always comes from order.totalMoney`**

- **Why written**: After every valid booking flow, the amount charged to the customer's card must come from what Square says the order total is — not a value computed client-side. This test also checks the inverse: `chargeAmount = BigInt(baseAmountCents)` must not appear as an assignment anywhere (which was the custom-total fallback).
- **How it works**: Asserts `order!.totalMoney!.amount!` is present (the Square order result is used), and uses a regex to assert that `chargeAmount = BigInt(baseAmountCents)` is NOT present as an assignment.
- **Patterns checked**: presence of `order!.totalMoney!.amount!`; absence of `chargeAmount\s*=\s*BigInt\(baseAmountCents\)` via regex.

---

#### Group: Payment bug #2 — Catalog service charged (not custom total)

---

**`booking.ts: order line item uses catalogObjectId (not custom name+price)`**

- **Why written**: The old code created an order line item with `name: serviceName` and `basePriceMoney: { amount: BigInt(baseAmountCents) }`. This is an anonymous custom-dollar-amount item — Square has no idea which service it corresponds to. The fix references the Square catalog item by ID so Square knows exactly what service was charged. This test verifies that the `catalogObjectId` field is present.
- **How it works**: Asserts that `catalogObjectId: serviceVariationId` appears in the file.
- **Pattern checked**: `booking.includes('catalogObjectId: serviceVariationId')` → must be true.

---

**`booking.ts: service line item does not use basePriceMoney override`**

- **Why written**: When you use `catalogObjectId` in a Square order line item, you can still override the price with `basePriceMoney`. If that override is present on the catalog line item, the whole point is defeated — you're back to charging a custom amount. This test verifies the catalog item block does not contain a price override.
- **How it works**: Uses a regex to extract the ~300 characters following `catalogObjectId` in the file (which would cover the same line item object), then checks that `basePriceMoney` does not appear in that block. Mat rental has its own `basePriceMoney` as a separate line item, and that's allowed — this test only checks the catalog service item.
- **Pattern checked**: `booking.match(/catalogObjectId[\s\S]{0,300}appliedTaxes/)` — the matched block must not contain `basePriceMoney`.

---

**`booking.ts: mat rental uses flat 500n (no tax applied to it)`**

- **Why written**: Mat rental ($5) is a separate line item. The client confirmed taxes should NOT apply to mat rental. This test has two parts: (1) the flat 500n amount is present, and (2) the mat rental item block does not have `appliedTaxes` on it.
- **How it works**: Checks that `500n` exists (the BigInt literal for 500 cents). Then uses a regex to find the text near `Mat Rental` and `basePriceMoney` and verifies `appliedTaxes` is absent from that block.
- **Patterns checked**: presence of `500n`; the mat rental block (matched via regex) does not contain `appliedTaxes`.

---

**`booking.ts: needsMatRental is in request body type`**

- **Why written**: The frontend now sends `needsMatRental: boolean` in the booking request body. If the backend type declaration doesn't include it, the field will be silently `undefined` regardless of what the frontend sends, and mat rental will never be added to the order.
- **How it works**: Checks that `needsMatRental?: boolean` appears in the TypeScript type annotation of the request body.
- **Pattern checked**: `booking.includes('needsMatRental?: boolean')` → must be true.

---

#### Group: Webhook simplification — booking.ts

---

**`booking.ts: uses ZAPIER_REGULAR_URL (single webhook)`**

- **Why written**: Confirms the new single-webhook constant name is in the file — this is the URL that fires after a confirmed regular booking.
- **How it works**: String search.
- **Pattern checked**: `booking.includes('ZAPIER_REGULAR_URL')` → must be true.

---

**`booking.ts: old multi-webhook URLs removed`**

- **Why written**: The old code had three constants: `ZAPIER_NEW_CONTACT_URL`, `ZAPIER_NEW_BOOKING_URL`, `ZAPIER_FORM_URL`. The client asked for exactly 1 webhook per flow. If any old constant remains, it may still fire a second webhook.
- **How it works**: Asserts all three old constant names are absent.
- **Patterns checked**: All three old URL constants must be absent from `booking.ts`.

---

**`booking.ts: webhook payload includes attendeeCount: 1`**

- **Why written**: The client specifically asked for attendee count in the regular booking webhook payload. This verifies the field is actually there.
- **Pattern checked**: `booking.includes('attendeeCount: 1')` → must be true.

---

#### Group: Webhook simplification — inquiry.ts

---

**`inquiry.ts: uses ZAPIER_INQUIRY_URL (single webhook)`**

- **Why written**: Confirms the single inquiry webhook constant is in `inquiry.ts`.
- **Pattern checked**: `inquiry.includes('ZAPIER_INQUIRY_URL')` → must be true.

---

**`inquiry.ts: old multi-webhook URLs removed`**

- **Why written**: `inquiry.ts` previously fired `ZAPIER_FORM_URL` and `ZAPIER_NEW_CONTACT_URL`. Both should be gone.
- **Patterns checked**: both old constants must be absent from `inquiry.ts`.

---

**`inquiry.ts: Zapier skipped for Regular Class (guard present)`**

- **Why written**: `inquiry.ts` is called by two different callers: (a) private/corporate contact forms — these should fire Zapier, and (b) the regular class contact form as a fire-and-forget lead capture — this should NOT fire Zapier because `booking.ts` handles the Zapier webhook after payment succeeds. Without the guard, regular bookings would fire two Zapier webhooks: one from the lead capture and one from the confirmed booking. This test verifies the guard is present.
- **How it works**: Checks that `classType !== 'Regular Class'` appears in the file — this is the `if` condition that wraps the Zapier call.
- **Pattern checked**: `inquiry.includes("classType !== 'Regular Class'")` → must be true.

---

**`inquiry.ts: webhook payload includes attendeeCount`**

- **Why written**: The client asked for attendee count in the private/corporate webhook payload too ("show attendee count").
- **Pattern checked**: `inquiry.includes('attendeeCount:')` → must be true.

---

#### Group: Frontend sends correct data

---

**`App.tsx: booking request sends needsMatRental (not baked into baseAmountCents)`**

- **Why written**: This was a frontend change to go alongside the backend fix. Previously, mat rental ($5) was added to `baseAmountCents` on the frontend and that combined total was sent to the backend. The backend then used this combined amount as the custom line item price — which was the bug. The fix separates them: the base service price is sent separately from `needsMatRental: boolean`. Two sub-checks: (1) `needsMatRental` is present in the request body JSON, (2) `baseAmountCents: serviceInfo.baseAmountCents` is used (the base price without mat rental baked in).
- **Patterns checked**: presence of `needsMatRental,` and `baseAmountCents: serviceInfo.baseAmountCents,` in `App.tsx`.

---

#### Group: Date step present for private/corporate

---

**`App.tsx: corporate flow has date step in type definition`**

- **Why written**: The client reported that the date picker was missing after the participants question. The first thing to verify is that the Flow type actually includes a `date` step for corporate. If it's not in the type, it can't render.
- **How it works**: Checks for the exact string from the discriminated union type definition.
- **Pattern checked**: `appTsx.includes("kind: 'corporate'; step: 'people' | 'date' | 'contact'")` → must be true.

---

**`App.tsx: advanceInquiryPeopleStep advances corporate to date`**

- **Why written**: Even if the type allows a `date` step, the button's `onClick` function must actually transition the flow to that step. `advanceInquiryPeopleStep` is called when the user clicks "Continue" on the participants screen. This test verifies that function has the corporate branch that pushes to `date`.
- **Pattern checked**: `prev.kind === 'corporate' && prev.step === 'people') return { ...prev, step: 'date' }` → must be present.

---

**`App.tsx: isDateStep includes corporate.date`**

- **Why written**: Even if the flow state transitions to `corporate.date`, the UI won't render the date calendar unless `isDateStep` is `true` at that moment. `isDateStep` is a boolean computed from the flow state that gates the calendar render. This test verifies the corporate condition is included in it.
- **Pattern checked**: `flow.kind === 'corporate' && flow.step === 'date'` → must be present in `App.tsx`.

---

## Tier 2 — End-to-End Browser Tests (`tests/e2e/booking-flow.spec.ts`)

### What it is

A Playwright test suite that opens a real Chromium browser, navigates to the site, and clicks through every booking flow. Network calls to `/api/availability`, `/api/breeds`, and `/api/inquiry` are intercepted and replaced with mock responses so no backend, Square account, Resend key, or Zapier webhook is needed.

### How to run

```bash
# First-time setup
npm install --save-dev @playwright/test
npx playwright install chromium

# Run all E2E tests
npx playwright test

# Run with visible browser (good for debugging)
npx playwright test --headed

# Open HTML report after run
npx playwright show-report
```

### How API mocking works

Every test runs `mockApis(page)` before doing anything:

```ts
await page.route('**/api/availability**', (route) =>
  route.fulfill({ json: { availabilities: mockSlots() } })
)
await page.route('**/api/breeds**', (route) =>
  route.fulfill({ json: { schedule: {} } })
)
await page.route('**/api/inquiry**', (route) =>
  route.fulfill({ json: { ok: true } })
)
```

`mockSlots()` generates 3 dates × 2 time slots starting 10 days in the future. This is realistic enough for the UI to render the date picker with clickable rows.

The language picker (shown on first visit) is bypassed by setting `localStorage.setItem('studio-yopaw-lang', 'en')` via `page.addInitScript()` — this runs before the page loads so the React state initialises with English already chosen.

### Helper functions

**`openBooking(page)`** — combines mocking, localStorage pre-seeding, navigation to `/#book`, and waiting for the class-choice step heading to appear.

**`pickFirstDateAndTime(page)`** — clicks the first `.pricing-session-row` element (first available date), waits for the `.pricing-time-modal` to open, clicks the first `.pricing-time-slot-row`, and waits for the modal to close. Reused in every test that needs to advance past the date step.

---

### Test-by-test breakdown

#### Private Event flow (`test.describe('Private Event booking flow')`)

---

**`participants → date step (not skipped)`**

- **Why written**: This is the exact scenario the client reported — date picker missing after the participants question for Private Event. Even though the code was confirmed to be correct, this test prevents regression. If the `advanceInquiryPeopleStep` function ever loses its `gentle` case, or if `isDateStep` loses its `public.date` condition, this test fails.
- **How it works**: Clicks "Private Event" → expects the participants heading → clicks "Continue" → asserts that "Select your preferred time" is visible within 5 seconds.
- **Key assertion**: `expect(page.getByText('Select your preferred time')).toBeVisible({ timeout: 5_000 })` after clicking Continue.

---

**`full flow: participants → date → contact → success (no payment)`**

- **Why written**: Validates the complete Private Event journey end-to-end. The most important assertion at the end is that "Request received!" appears and the Square card number field does NOT — confirming Private Event stays an inquiry flow, not a payment flow.
- **How it works**: Follows every step — class choice, Continue, date+time selection (via `pickFirstDateAndTime`), contact form fill (`#pub-fullname`, `#pub-email`, `#pub-phone`), submit "Send my request". The `/api/inquiry` mock returns `{ok: true}` instantly so the success screen appears without a real backend.
- **Key assertions**: `'Request received!'` is visible; `#sq-card-number` (Square's card iframe) is NOT visible.

---

**`back navigation from date step goes to participants`**

- **Why written**: Verifies the back button at the date step correctly returns to the participants step (not all the way to class selection). This guards the `goBack()` function's `corporate` and `public.date` branches.
- **How it works**: Navigates to the date step, clicks the `.pricing-step-toolbar button` (the back chevron), asserts the participants heading reappears.

---

#### Corporate flow (`test.describe('Corporate booking flow')`)

Three parallel tests to the Private Event flow — same structure, different button text ("Corporate" instead of "Private Event", `#corp-fullname`/`#corp-email`/`#corp-phone` fields). Written separately because Corporate uses a completely separate flow type (`kind: 'corporate'`) and separate state variables from the Private Event flow (`kind: 'public', yoga: 'gentle'`). A bug in the corporate-specific branch wouldn't be caught by the Private Event tests.

---

#### Regular Class flow (`test.describe('Regular Class booking flow')`)

---

**`shows mat question as first step`**

- **Why written**: Regular Class is the only flow that starts with the mat question. This verifies the routing is correct — if `chooseClass('yin')` ever broke, the wrong step would appear.
- **Key assertion**: "Do you have your own yoga mat?" is visible after clicking "Regular Class".

---

**`mat → date → contact → payment step (not inquiry success)`**

- **Why written**: The core correctness test for Regular Class — it must go through to the payment step (Square card form), never show "Request received!". If the flow type ever got confused, it might route Regular Class to the inquiry success screen instead of payment.
- **How it works**: Completes the full contact form, handles the waiver (checks the checkbox; clicks "I accept" if the waiver modal appears), submits. Since the booking API is NOT mocked (we don't mock `/api/booking`), the payment step will appear (or a Square SDK error will appear if env vars aren't set), but "Request received!" must never appear.
- **Key assertion**: `'Request received!'` is NOT visible after submission.

---

**`mat rental option advances to date step`**

- **Why written**: Verifies that choosing "No, I will rent one on-site" still advances the flow correctly. The `pickMat(true)` call must transition to `public.date` for yin. Also indirectly tests that `needsMatRental` state is set (the backend fix depends on this flag being sent).
- **Key assertion**: "Select your preferred time" is visible after clicking the rent option.

---

#### Progress bar (`test.describe('Progress bar and back navigation')`)

---

**`progress bar advances through private event flow`**

- **Why written**: The progress bar percentages are defined by `progressPercent()`. After selecting Private Event (participants step), it should be 45%. After advancing to date, 62%. These exact values are documented in CLAUDE.md and hardcoded in the function. If the step names or flow types change, the percentages would silently break without this test.
- **How it works**: After each step transition, reads the `style` attribute of `.pricing-progress-fill` and checks it contains the expected percentage string.

---

**`progress bar advances through corporate flow`**

- **Why written**: Same test for corporate — separate because corporate uses a different flow branch in `progressPercent()`. The same 45%/62% values apply (participants → date is the same progression), but driven by `flow.kind === 'corporate'` code paths.

---

#### Webhook payload (inline code checks in E2E)

Two lightweight inline tests inside the E2E suite that read source files:

**`Regular class webhook has classType field`** — asserts `classType: serviceName` and `attendeeCount: 1` are present in `booking.ts`. Written here (as well as in verify-fixes.mjs) so the E2E report also shows these checks without having to run both test suites separately.

**`Inquiry webhook has attendeeCount from groupSize`** — asserts `attendeeCount:` and `parseInt(groupSize ?? '1'` are present in `inquiry.ts`.

---

## What is NOT tested automatically

These require a live Square sandbox and can only be tested manually after deployment:

| Scenario | Why not automated |
|---|---|
| Actual payment charge | Requires a real Square card nonce from the Web Payments SDK iframe |
| `catalogObjectId` resolves to $46 in Square's catalog | Square's catalog is external state — can't be mocked meaningfully |
| Booking created in Square calendar | Requires Square sandbox + real API credentials |
| Booking cancelled on payment failure | Same — requires real Square API |
| Resend email delivery | External service |
| Zapier webhook received by Zapier | External service |
| Tax amounts on Square receipt | Square's order computation with real catalog item |

**Manual test procedure (post-deploy, sandbox):**  
Use Square's test card `4111 1111 1111 1111`, CVV `111`, expiry any future date, postal code `11111`. Complete a regular class booking. In Square Dashboard → Transactions, verify: (1) the charge shows the service name, not a generic amount; (2) the order has two tax lines (TPS/GST 5% and TVQ/QST 9.975%); (3) the total is ~$52.89 for a $46 class.
