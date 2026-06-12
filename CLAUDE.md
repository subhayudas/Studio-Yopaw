# Studio Yopaw — Codebase Context

> **How to use this file:** this is the authoritative context for the codebase — architecture, API contracts, booking flow, env vars, and tests are all documented below. **Do NOT re-explore the codebase to rebuild this context** (no broad file-by-file reading, repo-wide scans, or exploratory subagents at session start). Read only the specific files you are about to modify, plus their direct dependencies. Trust this file for everything else. If code you read contradicts this file, the code wins — fix the relevant section here in the same turn.
>
> **Maintenance rule:** whenever you make a code change that affects architecture, API contracts, env vars, booking flow, component structure, or tests, update the relevant section of this file in the same turn. This file is the primary context source for future sessions.
>
> **Periodic audit:** an automated weekly routine re-audits this file against the code (PRs branch-named `docs/claude-md-audit-*`). In-session, only sanity-check sections covering code you touch (recent `git log` is a good drift signal). Last full audit: **2026-06-12** (verified against code; fixed Resend→Twilio, extra attendees, seat counting, blockedSlots, sold-out UX, testing section).

---

## Product Overview

Studio Yopaw is a **puppy yoga studio** website and booking platform for a real studio located at 1515A Des Marguerites St., Saint-Lazare, QC J7T 2R8 (founded 2026 by Joëlle Castonguay). The site is bilingual (English / French), handles online class bookings with Square payments, and sends SMS notifications via Twilio.

**Live domain:** www.yopaw.ca  
**Contact:** Studioyopaw@gmail.com | 514-242-4947  
**Social:** instagram.com/studioyopaw

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v4 |
| Backend (serverless) | Vercel Functions (`api/*.ts`), `@vercel/node` |
| Payments | Square SDK v44 (`square` npm), vanilla Square Web Payments SDK (`window.Square`) |
| SMS notifications | Twilio (`twilio` npm) — sends to all `TWILIO_TEAM_NUMBERS` |
| Lead capture | Zapier webhooks (fire-and-forget `fetch` calls) |
| Analytics | Google Ads (gtag `AW-18168099243`), Microsoft Clarity (`wunf2gg5tc`) |
| Deployment | Vercel (frontend + API functions bundled together) |

Build: `tsc -b && vite build` → outputs to `dist/`  
Dev: `vite` — the Vite dev server includes a `devApiPlugin()` that mocks `/api/availability` and `/api/breeds` directly from `class-schedule.json`, plus `/api/voucher` (code `TEST10` → 10% off, anything else → not found), so `vercel dev` is only needed for testing `booking.ts`, `voucher.ts` (real Square catalog), `inquiry.ts`, or `square-webhook.ts`.

---

## Repository Structure

```
Studio-Yopaw/
├── api/                          # Vercel serverless functions
│   ├── _square.ts                # Square client singleton + stripBom + getLocationId
│   ├── _config.ts                # getMaxSeats(), getClassTimes(), slotMontrealTime()
│   ├── _twilio.ts                # sendTeamSms() — sends SMS to all TWILIO_TEAM_NUMBERS
│   ├── _availability.ts          # buildAvailabilities(), countSlotAttendees() — seat-count engine
│   ├── _voucher.ts               # validateVoucher() — voucher-code validation engine (Square Catalog discounts)
│   ├── availability.ts           # GET  /api/availability (thin handler → _availability.ts)
│   ├── breeds.ts                 # GET  /api/breeds
│   ├── booking.ts                # POST /api/booking
│   ├── voucher.ts                # POST /api/voucher (thin handler → _voucher.ts)
│   ├── inquiry.ts                # POST /api/inquiry
│   └── square-webhook.ts         # POST /api/square-webhook
├── class-schedule.json           # Session dates, times, max seats, breeds, blocked slots
├── scripts/                      # One-off CLI utilities (Square setup, env push)
│   ├── push-schedule.ts          # Pushes schedule to Square Catalog (legacy, kept for reference)
│   ├── setup-square.ts / setup-all-services.ts / setup-square-taxes.ts
│   ├── attach-square-taxes.ts / delete-old-service.ts / update-service-duration.ts
│   └── push-env-to-vercel.ps1 / push-env-to-vercel-prod.ps1
├── tests/                        # Full test suite — see "Testing" section
│   ├── e2e/                      # Playwright specs (booking-flow, timeslot-full, voucher)
│   ├── unit/                     # Vitest specs (i18n, pricing)
│   ├── verify-fixes.mjs          # Node runner: 55 source-code assertions
│   ├── availability-seat-count.test.mjs  # Node runner: seat-count unit tests
│   ├── run-api-tests.mjs         # HTTP smoke tests against a live server
│   └── check-twilio-sms.mjs      # Manual helper: lists recent Twilio SMS
├── playwright.config.ts          # Playwright config (auto-starts Vite dev server)
├── public/                       # Static assets served as-is
│   ├── yopawlogo.png
│   ├── step1Logo.png / step2Logo.png / step3Logo.png
│   ├── class-regular.jpg         # Regular Class card image
│   ├── class-private.jpg         # Private Event card image (kids birthday)
│   ├── class-corporate.jpg       # Corporate card image — ALSO used as hero background
│   ├── *.webp / *.png            # Gallery + other images
│   └── 182991340eeb459d952466dcb9f2d778.mp4  # Former hero video (no longer used by HeroSection)
├── src/
│   ├── App.tsx                   # Root component + all page sections
│   ├── App.css                   # Effectively empty (legacy) — all styles live in index.css
│   ├── main.tsx                  # React entry point
│   ├── index.css                 # ALL styles: design tokens, sections, booking UI (~1950 lines)
│   ├── components/
│   │   ├── Navbar.tsx            # Responsive navbar with lang toggle
│   │   ├── Footer.tsx            # Footer with links, social, address
│   │   └── BookingWaiverModal.tsx  # Legal waiver modal (EN + FR)
│   ├── hooks/
│   │   ├── useSquareAvailability.ts  # GET /api/availability → { slots, loading, refresh }
│   │   ├── useBreedSchedule.ts       # GET /api/breeds → { schedule, loading }
│   │   └── useSquareCard.ts          # Vanilla Square Web Payments SDK wrapper
│   ├── i18n/
│   │   ├── siteStrings.ts        # All EN/FR string content (single source of truth)
│   │   └── LanguageProvider.tsx  # React context for language state
│   ├── lib/
│   │   └── squareServices.ts     # SQUARE_SERVICE_VARIATIONS + computeTaxBreakdown + computeVoucherDiscountCents
│   └── pages/
│       ├── RefundPolicyPage.tsx  # Standalone refund policy page
│       └── WaiverPage.tsx        # Standalone waiver page (/waiver, /renonciation)
├── learning/                     # Hand-authored HTML build-log / learning series (sessions 01–03)
├── dev-docs/ + docs/             # Planning & reference markdown (implementation plans, Square guides)
├── *.md (repo root)              # Historical planning/notes files (NEXT_STEPS.md, TESTING.md, etc.)
├── playwright-report/ + test-results/  # GENERATED Playwright artifacts — do not hand-edit
├── vercel.json                   # 256MB / 15s; includeFiles: class-schedule.json
├── vite.config.ts                # Vite config + devApiPlugin() for local dev
├── .env.local.example            # All required env vars documented here
├── index.html                    # Vite HTML entry; Google Ads + Clarity scripts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
└── eslint.config.js
```

---

## `class-schedule.json`

Central source of truth for session scheduling. Lives in the repo root and is bundled into all Vercel API functions via `vercel.json` `includeFiles`. Loaded at runtime with `readFileSync`.

```json
{
  "dates": ["2026-06-14", "2026-06-21", "2026-06-28", "2026-07-04", "2026-07-05"],
  "times": ["10:30", "12:00", "13:30", "15:00"],
  "maxSeats": 20,
  "breeds": {
    "2026-06-14": { "en": "Red Labrador",       "fr": "Labrador roux" },
    "2026-06-21": { "en": "Silver Labrador",    "fr": "Labrador argenté" },
    "2026-06-28": { "en": "Medium Goldendoodle","fr": "Goldendoodle moyen" },
    "2026-07-04": { "en": "Goldendoodle",       "fr": "Goldendoodle" },
    "2026-07-05": { "en": "Goldendoodle",       "fr": "Goldendoodle" }
  },
  "blockedSlots": [
    "2026-06-14 13:30",
    "2026-06-14 15:00",
    "2026-06-21 15:00"
  ]
}
```

| Field | Type | Purpose |
|---|---|---|
| `dates` | `string[]` | YYYY-MM-DD session dates. Both APIs generate slots for these. |
| `times` | `string[]` | Montreal-local HH:MM start times. Combined with dates → UTC ISO timestamps. |
| `maxSeats` | `number` | Capacity per slot. Attendees booked (not booking rows) are subtracted to get `seatsRemaining`. |
| `breeds` | `Record<date, {en, fr}>` | Dog breed badge shown on each date. Optional — missing date = no badge. |
| `blockedSlots` | `string[]` (optional) | Slots forced to `seatsRemaining: 0`, format `"YYYY-MM-DD HH:MM"` (Montreal local). Applied by both `api/_availability.ts` and the Vite dev mock. |

**To update the schedule:** edit `class-schedule.json`, commit, deploy. No Square Dashboard work needed.

---

## Routing

Single-page application — no React Router. The `App` component handles all routing:

```
/                         → MarketingSite (one-page landing)
/refund-policy            → RefundPolicyPage
/politique-remboursement  → RefundPolicyPage (FR)
/waiver                   → WaiverPage
/renonciation             → WaiverPage (FR)
#book / #booking / #pricing / #corporate  → scrolls to booking card
```

`normalizeSitePathname()` strips trailing slashes. When lang changes on the refund policy page, `history.replaceState` swaps the URL to the correct language path without reloading.

---

## Landing Page Sections (`src/App.tsx`)

All sections are top-level function components inside `App.tsx`. Order on the page:

1. **`HeroSection`** — Full-screen static image (`<img className="hero-video" src="/class-corporate.jpg">`) with title, subtitle, two CTA buttons. (The old `.mp4` hero video still sits in `public/` but is no longer referenced.)
2. **`MarqueeTicker`** — Infinite scrolling marquee of brand phrases
3. **`ExperienceSection`** — 3-step session flow (Warm Up 15min → Gentle Flow with Pups 15min → Play & Connect 30min)
4. **`ClassesSection`** — 3 class cards (Regular Class, Private Event, Corporate)
5. **`PricingSection`** — Multi-step booking wizard (see detailed section below)
6. **`GallerySection`** — Photo grid using `GALLERY_IMAGES`, IntersectionObserver animation
7. **`AboutSection`** — Studio story with floating paw icons
8. **`FAQSection`** — Accordion FAQ, links to refund policy via `<<REFUND_POLICY_LINK>>` token
9. **`Footer`**

> Note: `TestimonialsSection` was removed. The i18n strings for testimonials still exist in `siteStrings.ts` but are unused.

All sections use a shared `useInView` hook (IntersectionObserver) for scroll-triggered CSS animations.

---

## Booking Flow (`PricingSection` in `src/App.tsx`)

The booking section uses a discriminated union `Flow` type:

```
type Flow =
  | { kind: 'chooseClass' }
  | { kind: 'public'; step: 'mat' | 'people' | 'date' | 'contact' | 'payment'; yoga: YogaStyle }
  | { kind: 'publicSuccess'; source: 'regular' | 'private' }
  | { kind: 'corporate'; step: 'people' | 'date' | 'contact' }
  | { kind: 'corporateSuccess' }

type YogaStyle = 'yin' | 'gentle'
```

### Yin (Regular Class) Path
```
chooseClass
  ↓ (pick Regular Class)
public { step: 'mat' }        → "Do you have your own yoga mat?" (Yes / No — rent $5)
  ↓
public { step: 'date' }       → calendar with available session dates + dog breed badge
  ↓ (click date → time modal → pick slot)
public { step: 'contact' }    → name / email / phone + waiver checkbox (required for yin)
                              → "Bringing friends?" — add up to 10 extra attendees,
                                each with a required name + individual waiver checkbox
  ↓ (submit → fire-and-forget /api/inquiry lead capture (SMS), then Google Ads conversion event)
public { step: 'payment' }    → Square card form (useSquareCard hook); summary shows
                                "N × Puppy Yoga Class" when extra attendees added;
                                voucher-code input (Apply/Remove) — valid codes add a
                                discount row and recompute taxes on the discounted base
  ↓ (tokenize → POST /api/booking with extraAttendees array)
publicSuccess { source: 'regular' }  → confirmation with booking details
```

> **Extra attendees (Regular Class only):** `type ExtraAttendee = { name: string; waiverAccepted: boolean }`. The "Add attendee" button hides once 10 extras exist (party max = 11). The submit button stays disabled until every extra attendee has a non-empty name AND their waiver checked. Each person consumes a seat (see seat counting in `/api/booking` and `_availability.ts`).

### Gentle (Private Event) Path
```
chooseClass
  ↓ (pick Private Event)
public { step: 'people' }     → group size picker (2–20), defaults to 2
  ↓
public { step: 'date' }
  ↓ (click date → time modal → pick slot)
public { step: 'contact' }    → name / email / phone + optional message (no waiver required)
  ↓ (submit → await POST /api/inquiry → Twilio SMS + Zapier)
publicSuccess { source: 'private' }  → "Request received" confirmation (clock icon)
```

> **No Square payment.** The inquiry submission is the terminal action. On API failure the contact form shows an error and lets the user retry.

### Corporate Path
```
chooseClass
  ↓ (pick Corporate)
corporate { step: 'people' }  → group size picker
  ↓
corporate { step: 'date' }
  ↓
corporate { step: 'contact' } → corp contact form (incl. company name + optional message)
  ↓ (submit → await POST /api/inquiry → Twilio SMS + Zapier)
corporateSuccess              → "Request received" confirmation (clock icon)
```

> **No Square payment.** Same as Gentle — inquiry is the terminal action, no `payment` step exists in the corporate flow.

### Key Booking State Variables
| Variable | Type | Purpose |
|---|---|---|
| `flow` | `Flow` | Current position in the funnel |
| `needsMatRental` | `boolean` | Whether user chose to rent a mat ($5 added to total) |
| `selectedSessionIso` | `string \| null` | `"YYYY-MM-DD"` chosen date |
| `selectedTimeSlotId` | `string \| null` | Full UTC ISO timestamp for chosen time slot |
| `pendingSessionIso` | `string \| null` | Date clicked but time not yet chosen — triggers time modal |
| `inquiryLoading` | `boolean` | True while `/api/inquiry` awaited (gentle / corporate submit) |
| `inquiryError` | `string \| null` | Error message shown on contact form if inquiry call fails |
| `extraAttendees` | `ExtraAttendee[]` | Regular Class extras (max 10): `{ name, waiverAccepted }` each. Reset on flow restart |
| `soldOutDates` | `string[]` (memo) | Dates whose every slot has `seatsRemaining === 0` — rendered as disabled rows with a "Full / Complet" label, merged into the calendar as `[...effectiveDates, ...soldOutDates].sort()` |
| `voucherInput` | `string` | Raw voucher-code text on the payment step |
| `appliedVoucher` | `AppliedVoucher \| null` | Validated voucher from `/api/voucher` (`{ code, name, kind: 'percentage'\|'amount', percentage?/amountCents? }`). Drives the summary discount row; `code` is sent to `/api/booking`. Reset on flow restart |
| `voucherLoading` / `voucherError` | `boolean` / `string \| null` | Apply-button loading state and invalid-code error message |

### Progress Bar Percentages (`progressPercent()`)
| Step | % |
|---|---|
| `chooseClass` | 25 |
| `public · mat` | 35 |
| `public · people` (gentle) / `corporate · people` | 45 |
| `public · date` / `corporate · date` | 62 |
| `public · contact` / `corporate · contact` | 80 |
| `public · payment` (yin only) | 95 |
| `publicSuccess` / `corporateSuccess` | 100 |

### Mat Rental
- `pickMat(renting: boolean)` sets `needsMatRental` and advances to `date` step
- If `needsMatRental === true`, 500 cents ($5) is added to the base before taxes. Mat rental is a **single** $5 line regardless of party size.
- Payment summary: base = `baseAmountCents × groupSize + matRentalCents` where `groupSize = 1 + extraAttendees.length` for yin. With extras it shows "N × Puppy Yoga Class". Taxes via `computeTaxBreakdown()` (display only — the real charge is the Square order total).
- Waiver: required for Regular Class (yin) only — primary booker AND every extra attendee. Opens `BookingWaiverModal` portal. Not required for Private Event or Corporate.
- Time slot modal: clicking a date row sets `pendingSessionIso`, shows times. Full slots (`seatsRemaining === 0`) render disabled with a "Full / Complet" label. Clicking an open time sets `selectedTimeSlotId` and advances flow. Dates where ALL slots are full render as disabled rows in the calendar itself (modal never opens).

### Lead Capture Timing
- **Yin (Regular Class):** `fetch('/api/inquiry', ...)` fires **fire-and-forget** (`.catch(() => {})`) the moment the contact form is submitted, before the waiver gate. This sends a Twilio SMS to the team (lead captured even if user abandons at waiver/payment). The call includes `groupSize: String(1 + extraAttendees.length)` so the SMS shows the full party size. **Zapier is NOT fired** by this call — `booking.ts` fires the definitive Zapier webhook after payment succeeds.
- **Gentle (Private Event) and Corporate:** `/api/inquiry` is the **primary, awaited action**. The contact form shows a loading state (`inquiryLoading`) and an error message (`inquiryError`) on failure. There is no separate payment step — inquiry submission IS the terminal action. On success the user advances to the "request received" screen. Zapier fires inside this call.

---

## Internationalization (`src/i18n/`)

### `siteStrings.ts`
Single file containing all user-visible text for EN and FR. The `SiteStrings` interface defines every key; both `siteStrings.en` and `siteStrings.fr` implement it fully.

- `buildMarquee()` interspersed items with `·` separator
- `FAQ_REFUND_POLICY_LINK_TOKEN = '<<REFUND_POLICY_LINK>>'` — replaced by `FaqAnswerBody` with a real `<a>` to the refund policy page
- `interpolate(template, vars)` — replaces `{key}` placeholders (used in success messages: `{email}`, `{date}`, `{time}`, `{phone}`)
- Mat rental strings: `pricingAskMat`, `pricingMatYes`, `pricingMatNo`, `pricingMatHelper`
- Inquiry strings: `inquirySubmitLabel` ("Send my request"), `inquirySubmitting` ("Sending…"), `inquirySubmitError` (failure message) — used on Gentle and Corporate contact forms
- Extra-attendee strings: `pricingExtraAttendeesHelper` ("Bringing friends? Add up to 10 more people…"), `pricingExtraAttendeeWaiver`, plus add/remove labels — EN + FR
- Sold-out string: `pricingSpotFull` ("Full" / "Complet") — shown on disabled date rows and time slots
- Voucher strings: `voucherLabel`, `voucherPlaceholder`, `voucherApply`, `voucherChecking`, `voucherApplied`, `voucherRemove`, `voucherInvalid`, `voucherDiscountLabel` — EN + FR

### `LanguageProvider.tsx`
- Persists language in `localStorage` under key `studio-yopaw-lang`
- On first visit (no stored lang), shows a **language picker modal** (blocking whole UI) until user picks EN or FR
- Updates `document.documentElement.lang`, `document.title`, meta description on lang change
- Exports `useI18n()` → `{ lang, s, pickingLanguage, pickLang, toggleLang }`

---

## API Endpoints (`api/`)

All run as Vercel serverless functions. 256MB RAM, 15s timeout. `class-schedule.json` is bundled via `vercel.json` `includeFiles`.

### `api/_square.ts` — Square client singleton
Exports: `square` (SquareClient), `getLocationId()`, `stripBom(s)`.  
Reads `SQUARE_ACCESS_TOKEN`, `SQUARE_ENVIRONMENT`, `SQUARE_LOCATION_ID` from env.

### `api/_config.ts` — Shared config helpers
- `getMaxSeats()` → reads `SQUARE_MAX_SEATS` env var (default 20)
- `getClassTimes()` → reads `SQUARE_CLASS_TIMES` env var, returns `Set<string>` of Montreal-local times (default `10:30,12:00,13:30,15:00`)
- `slotMontrealTime(startAt)` → converts UTC ISO to Montreal local `"HH:MM"` string using `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto' })`

### `api/_availability.ts` — Seat-count engine (shared)
Exports: `buildAvailabilities(startDate, endDate)`, `countBookings()`, `countSlotAttendees(slotStartAt)`, `loadSchedule()`, `interface ClassSchedule`.

Key behaviours:
- `loadSchedule()` reads `class-schedule.json` (incl. optional `blockedSlots`) via `readFileSync`
- **Seats are counted per attendee, not per booking row.** For each non-cancelled Square booking the attendee count is resolved from the stronger of two signals:
  1. Square order line-item `quantity` — found by searching orders with `referenceId === booking.id` (`booking.ts` sets this)
  2. Fallback: parsing `/Total attendees:\s*(\d+)/` from `booking.customerNote` (also written by `booking.ts`)
  3. Default 1 if neither signal exists
- Skips bookings with status `CANCELLED_BY_SELLER`, `CANCELLED_BY_CUSTOMER`, `DECLINED`
- Pagination uses `page.data` + `page.getNextPage()` loop — **NOT `for await`**, which silently drops items in Square SDK v44
- Booking `startAt` is compared via `Date.parse()` epoch millis (not string comparison)
- `countSlotAttendees(slotStartAt)` is the race-condition guard used by `booking.ts`
- `AVAILABILITY_DEBUG=1` env var enables verbose per-booking logging
- Uses `schedule.maxSeats` from `class-schedule.json` (note: `booking.ts` uses `getMaxSeats()` from the `SQUARE_MAX_SEATS` env var instead — **keep these two in sync**)

### `GET /api/availability`
Thin handler in `availability.ts` that calls `buildAvailabilities()`.  
Query params: `startDate` (YYYY-MM-DD), `endDate` (YYYY-MM-DD)  
Returns: `{ availabilities: Array<{ startAt: string; seatsRemaining: number }> }`

Flow:
1. Reads `class-schedule.json` — gets `dates`, `times`, `maxSeats`, optional `blockedSlots`
2. Filters `dates` to the requested range
3. For each date × time: converts Montreal local → UTC ISO (DST-aware via `slotMontrealTime`)
4. Counts attendees per slot from Square bookings (see `_availability.ts` above; non-fatal if Square is unavailable — all seats appear open)
5. `seatsRemaining = blocked ? 0 : Math.max(0, maxSeats - attendeesBooked)`
6. **Returns ALL slots, including `seatsRemaining: 0`** — the front-end needs zero-seat slots to render sold-out dates/times as disabled
7. Adds `Cache-Control: no-store` header

> Previously used `square.bookings.searchAvailability()` and Square Catalog for schedule. Rewritten to read `class-schedule.json` directly.

### `GET /api/breeds`
Query params: `startDate` (YYYY-MM-DD), `endDate` (YYYY-MM-DD)  
Returns: `{ schedule: Record<date, Array<{ breed: { en: string; fr: string }; serviceIds: string[] }>> }`

Reads `class-schedule.json` `breeds` field. Synchronous — no Square API calls. Returns `serviceIds: []` for every entry (empty array = "matches all services" in the front-end filter).

> Previously fetched all-day Square bookings and used customer given/family name as EN/FR breed names. Rewritten to read from `class-schedule.json`.

### `api/_voucher.ts` — Voucher validation engine (shared)
Exports `validateVoucher(code)` → `VoucherResult`:
```ts
type VoucherResult =
  | { valid: true; discountId: string; name: string; kind: 'percentage'; percentage: number }
  | { valid: true; discountId: string; name: string; kind: 'amount'; amountCents: number }
  | { valid: false; reason: 'not_found' | 'inactive' | 'unsupported_type' | 'expired' }
```
**Voucher model: a voucher = a Square Catalog DISCOUNT object created in the Square Dashboard (Items → Discounts). The voucher code is the discount's NAME** (matched trimmed + case-insensitively) — **OR the token after a trailing em-dash (`—`) in the name**, because Square Dashboard/Marketing coupons are auto-named like `"Get $5 off the next time you visit! — TESTDISCOUNT"`. On a suffix match the returned `name` is the short code, not the full marketing sentence. Deleting the discount in the Dashboard deactivates the code. Validation rules:
- Empty or >50-char codes → not_found. Deleted discounts → not_found.
- Location check: discount must be present at `getLocationId()` (`presentAtAllLocations`/`presentAtLocationIds`/`absentAtLocationIds`) → else `inactive`.
- Only `FIXED_PERCENTAGE` and `FIXED_AMOUNT` accepted (value must be > 0); `VARIABLE_*` → `unsupported_type`. `amountMoney.amount` (bigint) converted via `Number()`.
- If any catalog `PRICING_RULE` references the discount (`pricingRuleData.discountId`) and has `validFromDate`/`validUntilDate`, today (America/Toronto) must be inside the window → else `expired`. No referencing rule = valid whenever the discount exists.
- Catalog reads use `square.catalog.list({ types: 'DISCOUNT' | 'PRICING_RULE' })` with the `page.data` + `getNextPage()` pagination pattern (NOT `for await` — same SDK v44 quirk as `_availability.ts`).
- Square API failures throw (mapped to 500 by callers) — an API error is never treated as a valid voucher.

### `POST /api/voucher`
Thin handler in `voucher.ts`. Body: `{ code: string }`. Returns 200 `{ valid: true, code, name, kind, percentage? | amountCents? }` for a valid code, 200 `{ valid: false, reason }` for an invalid one (not a server error), 500 `{ error: 'Voucher lookup failed' }` on Square API failure. `Cache-Control: no-store`. Returns ONLY the matched discount — never the catalog. The client never supplies or receives anything that controls the charge; the discount is re-resolved server-side at booking time.

### `POST /api/booking`
Body: `{ givenName, familyName, email, phone, serviceVariationId, serviceVariationVersion, teamMemberId, startAt, cardNonce, baseAmountCents, serviceName, needsMatRental?, extraAttendees?, voucherCode? }`

- `extraAttendees?: Array<{ name: string }>` — extra party members (frontend caps at 10)
- `totalPeople = 1 + (extraAttendees?.length ?? 0)` — drives the seat check, order quantity, and Zapier payload
- `baseAmountCents` is for notification display only — it is NOT used to determine the charge amount. The actual charge comes from the Square Order total (see steps 4–5).
- `voucherCode?: string` — raw code only; all discount values resolved server-side

Flow:
1. `square.customers.search()` by email → create customer if not found. Also attempts to create Square customers for ALL extra attendees via `Promise.all`, falling back to primary-only if rate-limited
2. Race-condition seat check: `countSlotAttendees(startAt)` from `_availability.ts`; returns 409 `'This class is full'` if `taken + totalPeople > getMaxSeats()`
2b. Voucher revalidation: if `voucherCode` present, `validateVoucher()` runs again at payment time (handles codes deactivated between Apply and Pay); invalid → 400 `'Invalid or expired voucher code'` (booking never proceeds at full price silently)
3. `square.bookings.create()` — adds appointment to Square calendar with `customerNote` = `` `Total attendees: ${totalPeople} · Names: ${allNames} · Waiver confirmed: yes` `` — this note is the fallback attendee-count signal read back by `_availability.ts`
4. **Try/catch wrapper** around order + payment:
   - `square.orders.create()` — always created, with:
     - Main line item: `catalogObjectId: serviceVariationId`, **`quantity: String(totalPeople)`** (this is how the charge scales with party size; charges catalog price, not a custom amount)
     - Optional mat rental line item: custom `basePriceMoney: 500n CAD`, no `appliedTaxes` → tax-free flat $5 (one unit regardless of party size)
     - Inline taxes with `scope: 'LINE_ITEM'`: `{ uid: 'gst', name: 'TPS/GST', percentage: '5' }` + `{ uid: 'qst', name: 'TVQ/QST', percentage: '9.975' }`, applied to the service line item only via `appliedTaxes`
     - Voucher (when valid): `discounts: [{ uid: 'voucher', catalogObjectId: discountId, scope: 'ORDER' }]` — Square prorates across line items and recomputes taxes on the discounted basis (MODIFY_TAX_BASIS); no client-supplied amount is ever used
     - `referenceId: booking.id` so Square links the order to the appointment (and so availability can find the order quantity)
   - `square.payments.create()` — charges `order.totalMoney.amount` (the Square-computed total)
   - Payment status validated: must be `COMPLETED` or `APPROVED`
   - **On any failure:** `square.bookings.cancel()` called immediately to prevent ghost appointments. If the cancel itself fails, logs `CRITICAL: Payment failed AND booking cancellation failed — manual cleanup required`
5. Fires `ZAPIER_REGULAR_URL` — single webhook: `{ firstName, lastName, fullName, email, phone, classType, attendeeCount: totalPeople, attendeeNames, startAt, bookingId, totalDollars, paymentStatus, voucherCode }` (`attendeeNames` = comma-separated string of all names; `voucherCode` = applied discount name or `''`; `totalDollars` reflects the discounted Square total)
6. Sends booking SMS via Twilio (`sendTeamSms` in `api/_twilio.ts`) to all numbers in `TWILIO_TEAM_NUMBERS` — includes booker name/email/phone, all attendee names, session date/time (Montréal TZ), voucher name (when applied), total, payment status

Returns: `{ bookingId, paymentStatus }` or `{ error: string }` with human-readable message via `friendlyPaymentError()`.

**`friendlyPaymentError(err)`** maps Square error codes to user-facing messages:
`GENERIC_DECLINE`, `CARD_DECLINED`, `INSUFFICIENT_FUNDS`, `CARD_EXPIRED`, `CVV_FAILURE`, `ADDRESS_VERIFICATION_FAILURE`, `INVALID_CARD`, `PAYMENT_METHOD_ERROR` (category), `RATE_LIMIT_ERROR` (category).

**Zapier webhook URLs:**
- `ZAPIER_REGULAR_URL` (`booking.ts`) — `…/4oig0ml/` — fires once per confirmed regular booking
- `ZAPIER_INQUIRY_URL` (`inquiry.ts`) — `…/4ok9t5x/` — fires for private/corporate inquiries only (skipped for regular class lead-capture)

### `POST /api/inquiry`
Body: `{ fullName, email, phone, classType, preferredDate?, preferredTime?, groupSize?, companyName?, message? }`

Used for Private Event and Corporate inquiries, and as a fire-and-forget lead capture for Regular Class. Flow:
1. Sends SMS to all `TWILIO_TEAM_NUMBERS` via `sendTeamSms` (`api/_twilio.ts`) — includes full name, email, phone, class type, preferred date, preferred time, group size, and `companyName`/`message` whenever provided (any class type). Regular Class lead shows `🔔 NEW LEAD`; inquiries show `📩 NEW INQUIRY`. `preferredDate`/`preferredTime` formatted via `fmtDate()` / `fmtTime()` (Montréal timezone).
2. Fires `ZAPIER_INQUIRY_URL` — **only when `classType !== 'Regular Class'`** (private/corporate only). Regular class uses this endpoint as lead-capture only (SMS fires, Zapier skipped — `booking.ts` fires the definitive webhook after payment).
   Payload: `{ firstName, lastName, fullName, email, phone, classType, companyName, attendeeCount, preferredDate, preferredTime, message }` (optional fields default to `''`; `attendeeCount = parseInt(groupSize) || 1`)

Failure modes: if `sendTeamSms()` throws (Twilio error) → 500 `{ error: 'Failed to send inquiry' }`. The Zapier call is fire-and-forget (`.catch()` logged) — a Zapier failure never surfaces to the user. Returns `{ ok: true }` on success.

**Callers:**
- Gentle / Corporate contact form: **awaited** — failure shows error to user.
- Yin contact form: **fire-and-forget** — failure is silently swallowed, user proceeds to payment.

### `POST /api/square-webhook`
Validates HMAC-SHA256 signature (`x-square-hmacsha256-signature` header).  
Notification URL hardcoded: `https://studio-yopaw.vercel.app/api/square-webhook`  
Responds 200 immediately, then:
- `payment.updated` / `payment.created` where `status === 'COMPLETED'` → SMS to all `TWILIO_TEAM_NUMBERS` with amount + payment ID + booking reference
- `customer.created` → SMS to all `TWILIO_TEAM_NUMBERS` with customer name, email, phone

---

## Frontend Hooks (`src/hooks/`)

### `useSquareAvailability(serviceVariationId, startDate, endDate, teamMemberId?)`
Fetches `GET /api/availability`. Skips if `serviceVariationId` is empty.  
Returns `{ slots: SquareSlot[], loading: boolean, refresh: () => void }` where `SquareSlot = { startAt: string; seatsRemaining: number }`.  
`PricingSection` calls this with a **50-day** window from today (`plusDaysIso(50)`).

### `useBreedSchedule(startDate, endDate)`
Fetches `GET /api/breeds`.  
Returns `{ schedule: Record<string, BreedEntry[]>, loading: boolean }` where `BreedEntry = { breed: { en, fr }; serviceIds: string[] }`.  
Front-end filter: `serviceIds.length === 0 || serviceIds.includes(currentServiceVariationId)` — empty array matches all.

### `useSquareCard(appId, locationId)`
Vanilla Square Web Payments SDK wrapper. Uses `window.Square` (loaded via `<script src="https://web.squarecdn.com/v1/square.js">` in `index.html`).  
Returns `{ containerRef, tokenize(), loading, ready, sdkError }`.  
Polls for `window.Square` up to 40 × 250ms before giving up. Cleans up with `card.destroy()` on unmount.

---

## Square Services Config (`src/lib/squareServices.ts`)

```ts
export const SQUARE_SERVICE_VARIATIONS = {
  yin: {
    serviceVariationId:      import.meta.env.VITE_SQUARE_YIN_VARIATION_ID,
    serviceVariationVersion: Number(import.meta.env.VITE_SQUARE_YIN_VARIATION_VERSION ?? 0),
    teamMemberId:            import.meta.env.VITE_SQUARE_TEAM_MEMBER_ID,
    baseAmountCents:         Number(import.meta.env.VITE_SQUARE_YIN_BASE_CENTS ?? 4600),
    serviceName: 'Regular Class',
    maxSeats: Number(import.meta.env.VITE_SQUARE_MAX_SEATS ?? 20),
  },
  gentle: { ... baseAmountCents: VITE_SQUARE_GENTLE_BASE_CENTS, serviceName: 'Private Event' },
  corporate: { ... baseAmountCents: VITE_SQUARE_CORP_BASE_CENTS, serviceName: 'Corporate Event' },
}

export const TAX_RATES = { gst: 0.05, qst: 0.09975 }
export function computeTaxBreakdown(baseCents) → { baseCents, gstCents, qstCents, totalCents }

export type AppliedVoucher =
  | { code: string; name: string; kind: 'percentage'; percentage: number }
  | { code: string; name: string; kind: 'amount'; amountCents: number }
export function computeVoucherDiscountCents(baseCents, v) // display-only; clamped to [0, baseCents]
```

Voucher display math on the payment step: `discountCents = computeVoucherDiscountCents(baseCents, appliedVoucher)`, then taxes shown via `computeTaxBreakdown(baseCents - discountCents)` — matches Square's MODIFY_TAX_BASIS behaviour. Display only; the real charge is always the Square order total.

All IDs read from `VITE_*` env vars. `baseAmountCents` is the pre-tax base; mat rental (500 cents) is added on top for yin bookings where `needsMatRental === true`.

---

## Third-Party Integrations

### Zapier (lead capture)
Two webhook URLs — one per booking type. All Zapier calls are fire-and-forget (`.catch(() => {})`). A Zapier failure never blocks the user flow.

- **Regular class (`booking.ts`):** `ZAPIER_REGULAR_URL` fires once after payment is confirmed with `{ firstName, lastName, fullName, email, phone, classType, attendeeCount: totalPeople, attendeeNames, startAt, bookingId, totalDollars, paymentStatus }`. The earlier fire-and-forget inquiry call (lead capture) does **not** fire Zapier.
- **Private Event / Corporate (`inquiry.ts`):** `ZAPIER_INQUIRY_URL` fires when the inquiry is submitted with `{ firstName, lastName, fullName, email, phone, classType, companyName, attendeeCount, preferredDate, preferredTime, message }`.

### Google Ads Conversion Tracking
In `index.html`: Google Tag Manager script loads `gtag` with account `AW-18168099243`.  
In `src/App.tsx`: `declare function gtag(...args: unknown[]): void` (TypeScript global declaration).  
Conversion fires in `submitPublic()` after the waiver check passes (yin path only), targeting label `YPflCLS3wLAcEKvjnNdD`. Guarded by `typeof gtag !== 'undefined'` (ad-blocker safety). Does **not** fire for Gentle or Corporate (those go direct to inquiry).

### Microsoft Clarity
Snippet in `index.html` with tag `wunf2gg5tc`. Passive — records session replays and heatmaps. No other code changes needed.

---

## Components

### `Navbar.tsx`
- Transparent → opaque (`scrolled` class) after 60px scroll
- `variant="solid"` for always-opaque background (used on policy pages)
- EN/FR toggle via `toggleLang`
- Nav links: How It Works (`#experience`), Classes (`#classes`), Pricing (`#pricing`), Values/About (`#about`), FAQ (`#faq`)
- **No "Reviews" link** — testimonials section was removed

### `Footer.tsx`
- Logo, tagline, Instagram + Facebook links
- Navigation column: same links as navbar + Waiver link + Refund Policy link (lang-aware URL)
- **No "Reviews" link** — testimonials section was removed
- Contact: address, email (`Studioyopaw@gmail.com`), phone (`514-242-4947`), website

### `BookingWaiverModal.tsx`
- Portal rendered on `document.body`
- Two full legal texts: `WaiverContentFr` and `WaiverContentEn`
- Covers: risk acknowledgement, voluntary participation, liability release, emergency care, image use, minors
- Closes on Escape key or backdrop click

### `RefundPolicyPage.tsx` (`src/pages/`)
- Standalone page with Navbar (solid) + Footer
- Bilingual policy copy defined inline as `COPY` object (not from `siteStrings`)
- 7 sections: Payment, Client Cancellation (72h rule), Late Arrivals, Studio Cancellation (full refund + 25% discount), Private/Corporate, Acceptance, Refund Requests
- URL auto-corrects to canonical path when lang changes (`history.replaceState`)

### `WaiverPage.tsx` (`src/pages/`)
- Standalone waiver page at `/waiver` (EN) and `/renonciation` (FR), linked from the Footer
- Renders the same legal waiver content as `BookingWaiverModal`, with Navbar (solid) + Footer

---

## `vite.config.ts` — Dev API Plugin

`devApiPlugin()` registers Connect middleware on the Vite dev server for `/api/availability`, `/api/breeds`, and `/api/voucher`. The first two read `class-schedule.json` synchronously and return the same JSON shape as the real Vercel functions. Uses `Intl.DateTimeFormat` directly (not `_config.ts`) for Montreal→UTC conversion.

The dev mock honours `blockedSlots` with the same zeroing logic as `_availability.ts`. The `/api/voucher` mock accepts code `TEST10` (case-insensitive → 10% percentage voucher) and returns `{ valid: false, reason: 'not_found' }` for everything else.

This means `vite dev` works for the full booking UI without running `vercel dev`. Only needed for `vercel dev`: `booking.ts` (real Square payment), `voucher.ts` (real Square catalog lookup), `inquiry.ts` (real Twilio SMS), `square-webhook.ts`.

---

## Environment Variables

```bash
# Server-only (Vercel env vars, never VITE_ prefixed)
SQUARE_ENVIRONMENT=sandbox|production
SQUARE_ACCESS_TOKEN=                   # Square API token
SQUARE_LOCATION_ID=                    # Square location ID
SQUARE_WEBHOOK_SIGNATURE_KEY=          # For webhook HMAC verification
SQUARE_MAX_SEATS=20                    # Capacity per slot — used by booking.ts seat guard.
                                       # MUST match maxSeats in class-schedule.json (used by availability)
SQUARE_CLASS_TIMES=10:30,12:00,13:30,15:00  # Montreal-local times (used by _config.ts)
AVAILABILITY_DEBUG=0                   # Set to 1 for verbose per-booking logging in _availability.ts
# SQUARE_GST_TAX_ID / SQUARE_QST_TAX_ID — no longer used. Taxes are applied as inline
# percentages (5% GST + 9.975% QST) directly in each order. No catalog tax IDs needed.

# SMS via Twilio — server-only
TWILIO_ACCOUNT_SID=                    # Twilio Account SID (starts with AC)
TWILIO_AUTH_TOKEN=                     # Twilio Auth Token
TWILIO_FROM_NUMBER=+12494026223        # The Twilio phone number that sends SMS
TWILIO_TEAM_NUMBERS=+15142424947      # Comma-separated E.164 numbers that receive all notifications

# Browser-safe (exposed via Vite)
VITE_SQUARE_APP_ID=                    # Square application ID for Web Payments SDK
VITE_SQUARE_LOCATION_ID=              # Square location ID (frontend)
VITE_SQUARE_TEAM_MEMBER_ID=           # Team member ID (all service variations share one)
VITE_SQUARE_MAX_SEATS=20

VITE_SQUARE_YIN_VARIATION_ID=
VITE_SQUARE_YIN_VARIATION_VERSION=
VITE_SQUARE_YIN_BASE_CENTS=4600       # $46.00 CAD base price

VITE_SQUARE_GENTLE_VARIATION_ID=
VITE_SQUARE_GENTLE_VARIATION_VERSION=
VITE_SQUARE_GENTLE_BASE_CENTS=4600

VITE_SQUARE_CORP_VARIATION_ID=
VITE_SQUARE_CORP_VARIATION_VERSION=
VITE_SQUARE_CORP_BASE_CENTS=4600
```

`VITE_SQUARE_APP_ID` is read at module level in `App.tsx`. If empty, the payment step shows a configuration error instead of the card form.

Taxes are always applied as inline percentages in `booking.ts` — no catalog tax IDs are required. The charge amount always comes from `order.totalMoney.amount` (Square-computed, based on the catalog service price + inline taxes).

---

## CSS Architecture

All styles in `src/index.css` (~1950 lines; `src/App.css` is effectively empty/legacy). CSS custom properties (design tokens):
- `--sage`, `--sage-dark` — green palette for accents
- `--rose` — pink/red for errors
- Typography: system font stack; italic `<em>` tags used in headings

Key classes: `.hero-section`, `.pricing-section`, `.pricing-card`, `.pricing-choice-card`, `.pricing-choice-stack--pair`, `.pricing-session-row`, `.pricing-time-modal`, `.pricing-step-block`, `.pricing-step-title`, `.pricing-helper-text`, `.pricing-payment-summary`, `.pricing-voucher` (+ `-row/-input/-apply/-error/-applied/-remove`), `.pricing-payment-summary-discount`, `.waiver-modal-overlay`, `.lang-picker-overlay`, `.navbar`, `.mobile-menu`, `.footer`

Scroll animations: sections get `.visible` class via IntersectionObserver → CSS transitions trigger. `transitionDelay` set inline for staggered card effects.

---

## Testing

### Commands

| Command | What it runs |
|---|---|
| `npm test` | Node built-in runner: `tests/verify-fixes.mjs` (50 source-code assertions) + `tests/availability-seat-count.test.mjs` (seat-count unit tests) |
| `npm run test:e2e` | Playwright E2E suite in `tests/e2e/` (Chromium only) |
| `npx vitest run tests/unit/` | Vitest unit tests (no npm script — run directly) |
| `TEST_BASE_URL=http://localhost:3000 node tests/run-api-tests.mjs` | HTTP smoke tests against a live server (`vercel dev` or deployed) |
| `node --env-file=.env.local tests/check-twilio-sms.mjs` | Manual helper — lists last 10 Twilio SMS deliveries (needs real Twilio creds) |

### How E2E works
- `playwright.config.ts` auto-starts `npm run dev` as a `webServer`; base URL `http://localhost:5173`. In CI: `forbidOnly`, retries = 2, no server reuse.
- Specs mock `/api/availability` and `/api/breeds` with `page.route(...)` (synthetic data) — **no Square credentials needed**.
- Specs set `localStorage('studio-yopaw-lang', 'en'|'fr')` via `addInitScript` to bypass the language-picker modal.
- `tests/e2e/booking-flow.spec.ts` — ~30 tests: all three flows end-to-end (Regular reaches the payment step, Private/Corporate reach inquiry success), progress-bar %, extra-attendee UX (add/remove/cap at 10/waiver gating), sold-out date rows, FR strings.
- `tests/e2e/timeslot-full.spec.ts` — full time slot shows disabled + "Full"; date with all slots full renders disabled and never opens the time modal.
- `tests/e2e/voucher.spec.ts` — mocks `/api/voucher` via `page.route`: valid code → discount row + reduced total; invalid code → error, no discount; remove → total restored.
- `tests/unit/i18n.test.ts` — all extra-attendee/message/company i18n keys present + non-empty in EN and FR. `tests/unit/pricing.test.ts` — `computeTaxBreakdown()` math incl. 11-attendee scaling and mat rental, plus `computeVoucherDiscountCents()` (rounding, clamping, 0%).
- `tests/verify-fixes.mjs` reads source files directly and asserts known fixes are still present (payment, taxes, mat rental, webhook, extra attendees, seat count incl. `_availability.ts` engine, inquiry, voucher safety: server-side revalidation, ORDER-scope catalog discount, no client-supplied amounts).

### Notes
- `npm test` and `npm run test:e2e` run offline with no `.env.local`.
- `playwright-report/` and `test-results/` are generated artifacts — never hand-edit; they should be gitignored.

---

## Business Rules

- **Pricing:** $46 + taxes per drop-in session. Mat rental $5 + taxes on-site.
- **Cancellation:** 72-hour notice required for full refund on group classes.
- **Age:** Minimum 12 years old. Children 8+ may attend with an adult.
- **Group size:** Private/Corporate events: 2–20 participants.
- **Extra attendees (Regular Class):** up to 10 extras per booking (party max 11). Each extra needs a name + individual waiver, consumes a seat, and is charged via order line-item quantity.
- **Session length:** 60 minutes total (15 warm-up + 15 flow with pups + 30 free play).
- **Waiver:** Required for Regular Class (yin yoga) bookings. Not required for Private Event or Corporate.
- **Private/Corporate:** Not paid online — inquiry form only, studio follows up within 24h.
- **Vouchers (Regular Class payment step):** managed entirely from the Square Dashboard — create a Discount (Items → Discounts) whose **name is the code** (percentage or fixed amount); delete it to deactivate. Optional date windows via Square pricing rules are enforced. Discount applies to the whole order (incl. mat rental, prorated by Square). Variable-amount discounts are rejected. No per-customer redemption limits (Square doesn't track them for catalog discounts).

---

## Square Go-Live Checklist

Before going live with real bookings:
1. Set `SQUARE_ENVIRONMENT=production` in Vercel env vars
2. Fill all `VITE_SQUARE_*` variation IDs/versions from Square Dashboard → Items → Services
3. Fill `VITE_SQUARE_TEAM_MEMBER_ID` from Square Dashboard → Team
4. Fill `VITE_SQUARE_APP_ID` and `VITE_SQUARE_LOCATION_ID` (production values)
5. Register webhook URL `https://studio-yopaw.vercel.app/api/square-webhook` in Square Dashboard → Webhooks; copy signature key to `SQUARE_WEBHOOK_SIGNATURE_KEY`
6. Verify the service variation price in Square Dashboard = $46.00 (catalog price is what actually gets charged — `VITE_SQUARE_YIN_BASE_CENTS` is display-only)
