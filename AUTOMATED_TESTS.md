# Automated Tests

Tests for the booking flow and payment changes. Two tiers — run both before deploying.

---

## Tier 1 — Code Verification (no dependencies, instant)

Reads source files and asserts that all fixes are structurally present.
Catches regressions before any server is running.

```bash
node --test tests/verify-fixes.mjs
```

**What it checks:**

| Test | What it guards |
|---|---|
| No conditional tax block | Taxes never skipped (Bug 1 fix) |
| Has inline GST 5% | GST always applied |
| Has inline QST 9.975% | QST always applied |
| `chargeAmount` from `order.totalMoney` | Custom total never used |
| `catalogObjectId` in order line item | Actual service charged (Bug 2 fix) |
| No `basePriceMoney` on catalog item | Price not overridden by frontend value |
| Mat rental uses `500n`, no tax | Flat $5, tax-free |
| `ZAPIER_REGULAR_URL` in booking.ts | Single regular webhook |
| Old webhook URLs removed from booking.ts | No duplicate webhook fires |
| `attendeeCount: 1` in booking webhook | Attendee count in regular payload |
| `ZAPIER_INQUIRY_URL` in inquiry.ts | Single inquiry webhook |
| Old webhook URL removed from inquiry.ts | No duplicate webhook fires |
| `classType !== 'Regular Class'` guard | Regular class lead-capture skips Zapier |
| `attendeeCount` in inquiry webhook | Attendee count in private/corporate payload |
| Corporate flow has `date` step in Flow type | Date picker wired into corporate flow |
| `advanceInquiryPeopleStep` advances corporate to `date` | Continue button works for corporate |
| `isDateStep` includes corporate.date | Calendar actually renders for corporate |
| `needsMatRental` in request body | Frontend sends mat flag correctly |
| `baseAmountCents: serviceInfo.baseAmountCents` | Mat rental not baked into base amount |

Expected output: all tests pass (green ✓).

---

## Tier 2 — End-to-End Browser Tests (Playwright)

Tests the actual UI flow in a real browser. Mocks the backend API so no server or Square account is needed.

### Setup (one-time)

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

### Run

```bash
# Start dev server + run all E2E tests
npx playwright test

# Run with browser UI visible (useful for debugging)
npx playwright test --headed

# Run a single test file
npx playwright test tests/e2e/booking-flow.spec.ts

# Show HTML report after run
npx playwright show-report
```

### What it tests

**Private Event flow**
- `participants → date step (not skipped)` — the reported missing step is present ✓
- `full flow: participants → date → contact → success (no payment)` — ends with "Request received!", no card form
- `back navigation from date step goes to participants`

**Corporate flow**
- `participants → date step (not skipped)` — same verification for corporate ✓
- `full flow: participants → date → contact → success (no payment)`
- `back navigation from date step goes to participants`

**Regular Class flow**
- `shows mat question as first step`
- `mat → date → contact → payment step (not inquiry success)` — payment appears, "Request received!" does NOT
- `mat rental option advances to date step`

**Progress bar**
- Private Event: 45% after participants, 62% after date
- Corporate: 45% after participants, 62% after date

**Webhook payload (code-level, inline in E2E)**
- Regular class webhook has `classType` and `attendeeCount: 1`
- Inquiry webhook has `attendeeCount` from `groupSize`

### API mocking

Tests intercept network calls via `page.route()`:
- `/api/availability` → returns 3 future dates × 2 time slots (15 seats each)
- `/api/breeds` → returns empty schedule (no breed badges)
- `/api/inquiry` → returns `{ ok: true }`

No Square sandbox credentials needed. No Resend or Zapier calls are made.

---

## Add to package.json scripts (optional)

```json
"test:verify": "node --test tests/verify-fixes.mjs",
"test:e2e": "playwright test",
"test": "node --test tests/verify-fixes.mjs"
```

---

## What is NOT covered (requires live Square sandbox)

- Actual payment charge via `/api/booking` (needs Square card nonce)
- Order `catalogObjectId` resolved to correct price in Square's catalog
- Square booking creation and cancellation on payment failure
- Resend email delivery
- Zapier webhook receipt

To test these, set up a `.env.local` with Square sandbox credentials and run `vercel dev`, then exercise the full payment flow manually with Square's test card `4111 1111 1111 1111`.
