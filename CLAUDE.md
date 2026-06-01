# Studio Yopaw — Codebase Context

> **Maintenance rule:** whenever you make a code change that affects architecture, API contracts, env vars, booking flow, or component structure, update the relevant section of this file in the same turn. This file is the primary context source for future sessions.

---

## Product Overview

Studio Yopaw is a **puppy yoga studio** website and booking platform for a real studio located at 1515A Des Marguerites St., Saint-Lazare, QC J7T 2R8 (founded 2026 by Joëlle Castonguay). The site is bilingual (English / French), handles online class bookings with Square payments, and sends email notifications via Resend.

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
| Email | Resend v6 (`resend` npm) |
| Lead capture | Zapier webhooks (fire-and-forget `fetch` calls) |
| Analytics | Google Ads (gtag `AW-18168099243`), Microsoft Clarity (`wunf2gg5tc`) |
| Deployment | Vercel (frontend + API functions bundled together) |

Build: `tsc -b && vite build` → outputs to `dist/`  
Dev: `vite` — the Vite dev server includes a `devApiPlugin()` that mocks `/api/availability` and `/api/breeds` directly from `class-schedule.json`, so `vercel dev` is only needed for testing `booking.ts`, `inquiry.ts`, or `square-webhook.ts`.

---

## Repository Structure

```
Studio-Yopaw/
├── api/                          # Vercel serverless functions
│   ├── _square.ts                # Square client singleton + stripBom + getLocationId
│   ├── _config.ts                # getMaxSeats(), getClassTimes(), slotMontrealTime()
│   ├── availability.ts           # GET  /api/availability
│   ├── breeds.ts                 # GET  /api/breeds
│   ├── booking.ts                # POST /api/booking
│   ├── inquiry.ts                # POST /api/inquiry
│   └── square-webhook.ts         # POST /api/square-webhook
├── class-schedule.json           # Session dates, times, max seats, dog breeds per date
├── scripts/
│   └── push-schedule.ts          # CLI: pushes schedule to Square Catalog (legacy, kept for reference)
├── public/                       # Static assets served as-is
│   ├── yopawlogo.png
│   ├── step1Logo.png / step2Logo.png / step3Logo.png
│   ├── class-regular.jpg         # Regular Class card image
│   ├── class-private.jpg         # Private Event card image (kids birthday)
│   ├── class-corporate.jpg       # Corporate card image (group on mats)
│   ├── *.webp / *.png            # Gallery + other images
│   └── 182991340eeb459d952466dcb9f2d778.mp4  # Hero background video
├── src/
│   ├── App.tsx                   # Root component + all page sections
│   ├── App.css                   # All styles (Tailwind + custom CSS vars)
│   ├── main.tsx                  # React entry point
│   ├── index.css                 # Global resets
│   ├── components/
│   │   ├── Navbar.tsx            # Responsive navbar with lang toggle
│   │   ├── Footer.tsx            # Footer with links, social, address
│   │   └── BookingWaiverModal.tsx  # Legal waiver modal (EN + FR)
│   ├── hooks/
│   │   ├── useSquareAvailability.ts  # GET /api/availability → { slots, loading }
│   │   ├── useBreedSchedule.ts       # GET /api/breeds → { schedule, loading }
│   │   └── useSquareCard.ts          # Vanilla Square Web Payments SDK wrapper
│   ├── i18n/
│   │   ├── siteStrings.ts        # All EN/FR string content (single source of truth)
│   │   └── LanguageProvider.tsx  # React context for language state
│   ├── lib/
│   │   └── squareServices.ts     # SQUARE_SERVICE_VARIATIONS + computeTaxBreakdown
│   └── pages/
│       └── RefundPolicyPage.tsx  # Standalone refund policy page
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
  }
}
```

| Field | Type | Purpose |
|---|---|---|
| `dates` | `string[]` | YYYY-MM-DD session dates. Both APIs generate slots for these. |
| `times` | `string[]` | Montreal-local HH:MM start times. Combined with dates → UTC ISO timestamps. |
| `maxSeats` | `number` | Capacity per slot. Subtract confirmed Square bookings = `seatsRemaining`. |
| `breeds` | `Record<date, {en, fr}>` | Dog breed badge shown on each date. Optional — missing date = no badge. |

**To update the schedule:** edit `class-schedule.json`, commit, deploy. No Square Dashboard work needed.

---

## Routing

Single-page application — no React Router. The `App` component handles all routing:

```
/                         → MarketingSite (one-page landing)
/refund-policy            → RefundPolicyPage
/politique-remboursement  → RefundPolicyPage (FR)
#book / #booking / #pricing / #corporate  → scrolls to booking card
```

`normalizeSitePathname()` strips trailing slashes. When lang changes on the refund policy page, `history.replaceState` swaps the URL to the correct language path without reloading.

---

## Landing Page Sections (`src/App.tsx`)

All sections are top-level function components inside `App.tsx`. Order on the page:

1. **`HeroSection`** — Full-screen video (`/182991340eeb459d952466dcb9f2d778.mp4`) with title, subtitle, two CTA buttons
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
  ↓ (submit → Zapier lead capture fires here, then Google Ads conversion event)
public { step: 'payment' }    → Square card form (useSquareCard hook)
  ↓ (tokenize → POST /api/booking)
publicSuccess { source: 'regular' }  → confirmation with booking details
```

### Gentle (Private Event) Path
```
chooseClass
  ↓ (pick Private Event)
public { step: 'people' }     → group size picker (2–20), defaults to 2
  ↓
public { step: 'date' }
  ↓ (click date → time modal → pick slot)
public { step: 'contact' }    → name / email / phone (no waiver required)
  ↓ (submit → await POST /api/inquiry → Resend email + Zapier)
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
corporate { step: 'contact' } → corp contact form
  ↓ (submit → await POST /api/inquiry → Resend email + Zapier)
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
- If `needsMatRental === true`, 500 cents ($5) is added to `baseAmountCents` before taxes
- Payment summary shows a separate "Mat rental / Location de tapis" line item
- Waiver: required for Regular Class (yin) only. Opens `BookingWaiverModal` portal. Not required for Private Event or Corporate.
- Time slot modal: clicking a date row sets `pendingSessionIso`, shows available times. Clicking a time sets `selectedTimeSlotId` and advances flow.

### Lead Capture Timing
- **Yin (Regular Class):** `fetch('/api/inquiry', ...)` fires **fire-and-forget** (`.catch(() => {})`) the moment the contact form is submitted, before the waiver gate. Lead is captured even if the user abandons at the waiver or payment step.
- **Gentle (Private Event) and Corporate:** `/api/inquiry` is the **primary, awaited action**. The contact form shows a loading state (`inquiryLoading`) and an error message (`inquiryError`) on failure. There is no separate payment step — inquiry submission IS the terminal action. On success the user advances to the "request received" screen.

---

## Internationalization (`src/i18n/`)

### `siteStrings.ts`
Single file containing all user-visible text for EN and FR. The `SiteStrings` interface defines every key; both `siteStrings.en` and `siteStrings.fr` implement it fully.

- `buildMarquee()` interspersed items with `·` separator
- `FAQ_REFUND_POLICY_LINK_TOKEN = '<<REFUND_POLICY_LINK>>'` — replaced by `FaqAnswerBody` with a real `<a>` to the refund policy page
- `interpolate(template, vars)` — replaces `{key}` placeholders (used in success messages: `{email}`, `{date}`, `{time}`, `{phone}`)
- Mat rental strings: `pricingAskMat`, `pricingMatYes`, `pricingMatNo`, `pricingMatHelper`
- Inquiry strings: `inquirySubmitLabel` ("Send my request"), `inquirySubmitting` ("Sending…"), `inquirySubmitError` (failure message) — used on Gentle and Corporate contact forms

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

### `GET /api/availability`
Query params: `startDate` (YYYY-MM-DD), `endDate` (YYYY-MM-DD)  
Returns: `{ availabilities: Array<{ startAt: string; seatsRemaining: number }> }`

Flow:
1. Reads `class-schedule.json` — gets `dates`, `times`, `maxSeats`
2. Filters `dates` to the requested range
3. For each date × time: converts Montreal local → UTC ISO (DST-aware via `slotMontrealTime`)
4. Lists existing Square bookings (non-fatal if Square is unavailable — shows all seats open)
5. Normalises timestamps (`/\.\d+Z$/ → 'Z'`) before comparing; skips `CANCELLED_BY_SELLER`, `CANCELLED_BY_CUSTOMER`, `DECLINED`
6. Returns slots where `maxSeats - bookedCount > 0`
7. Adds `Cache-Control: no-store` header

> Previously used `square.bookings.searchAvailability()` and Square Catalog for schedule. Rewritten to read `class-schedule.json` directly.

### `GET /api/breeds`
Query params: `startDate` (YYYY-MM-DD), `endDate` (YYYY-MM-DD)  
Returns: `{ schedule: Record<date, Array<{ breed: { en: string; fr: string }; serviceIds: string[] }>> }`

Reads `class-schedule.json` `breeds` field. Synchronous — no Square API calls. Returns `serviceIds: []` for every entry (empty array = "matches all services" in the front-end filter).

> Previously fetched all-day Square bookings and used customer given/family name as EN/FR breed names. Rewritten to read from `class-schedule.json`.

### `POST /api/booking`
Body: `{ givenName, familyName, email, phone, serviceVariationId, serviceVariationVersion, teamMemberId, startAt, cardNonce, baseAmountCents, serviceName, groupSize? }`

Flow:
1. `square.customers.search()` by email → create customer if not found
2. Race-condition seat check: lists bookings for the slot, returns 409 if full
3. `square.bookings.create()` — adds appointment to Square calendar
4. **Try/catch wrapper** around steps 4–5:
   - `square.orders.create()` with `referenceId: booking.id` (so Square shows booking as "paid")
   - `square.payments.create()` — charges card nonce
   - Payment status validated: must be `COMPLETED` or `APPROVED`
   - **On any failure:** `square.bookings.cancel()` called immediately to prevent ghost appointments
5. Fires `ZAPIER_REGULAR_URL` — single webhook: `{ firstName, lastName, fullName, email, phone, classType, attendeeCount: 1, startAt, bookingId, totalDollars, paymentStatus }`
6. Sends notification email via Resend to `LEAD_NOTIFY_EMAIL`

Returns: `{ bookingId, paymentStatus }` or `{ error: string }` with human-readable message via `friendlyPaymentError()`.

**`friendlyPaymentError(err)`** maps Square error codes to user-facing messages:
`GENERIC_DECLINE`, `CARD_DECLINED`, `INSUFFICIENT_FUNDS`, `CARD_EXPIRED`, `CVV_FAILURE`, `ADDRESS_VERIFICATION_FAILURE`, `INVALID_CARD`, `PAYMENT_METHOD_ERROR` (category), `RATE_LIMIT_ERROR` (category).

**Zapier webhook URLs:**
- `ZAPIER_REGULAR_URL` (`booking.ts`) — `…/4oig0ml/` — fires once per confirmed regular booking
- `ZAPIER_INQUIRY_URL` (`inquiry.ts`) — `…/4ok9t5x/` — fires for private/corporate inquiries only (skipped for regular class lead-capture)

### `POST /api/inquiry`
Body: `{ fullName, email, phone, classType, preferredDate?, preferredTime?, groupSize? }`

Used for Private Event and Corporate inquiries, and as a fire-and-forget lead capture for Regular Class. Flow:
1. Sends email to `LEAD_NOTIFY_EMAIL` via Resend — `preferredDate` formatted as `"June 14, 2026"`, `preferredTime` formatted as `"10:30 AM (Montréal)"` using `Intl.DateTimeFormat` helpers `fmtDate()` / `fmtTime()` defined in the file.
2. Fires `ZAPIER_INQUIRY_URL` — **only when `classType !== 'Regular Class'`** (private/corporate only). Regular class uses this endpoint as lead-capture only (Resend email fires, Zapier skipped — `booking.ts` fires the definitive webhook after payment).
   Payload: `{ firstName, lastName, fullName, email, phone, classType, attendeeCount, preferredDate, preferredTime }`

Returns `{ ok: true }` on success, `{ error: 'Failed to send inquiry' }` on failure.

**Callers:**
- Gentle / Corporate contact form: **awaited** — failure shows error to user.
- Yin contact form: **fire-and-forget** — failure is silently swallowed, user proceeds to payment.

### `POST /api/square-webhook`
Validates HMAC-SHA256 signature (`x-square-hmacsha256-signature` header).  
Notification URL hardcoded: `https://studio-yopaw.vercel.app/api/square-webhook`  
Responds 200 immediately, then:
- `payment.updated` / `payment.created` where `status === 'COMPLETED'` → email to `PAYMENT_NOTIFY_EMAIL`
- `customer.created` → email to `LEAD_NOTIFY_EMAIL`

---

## Frontend Hooks (`src/hooks/`)

### `useSquareAvailability(serviceVariationId, startDate, endDate, teamMemberId?)`
Fetches `GET /api/availability`. Skips if `serviceVariationId` is empty.  
Returns `{ slots: SquareSlot[], loading: boolean }` where `SquareSlot = { startAt: string; seatsRemaining: number }`.  
`PricingSection` calls this with a 60-day window from today.

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
```

All IDs read from `VITE_*` env vars. `baseAmountCents` is the pre-tax base; mat rental (500 cents) is added on top for yin bookings where `needsMatRental === true`.

---

## Third-Party Integrations

### Zapier (lead capture)
Three webhook endpoints defined in both `booking.ts` and `inquiry.ts`. All Zapier calls are fire-and-forget (`.catch(() => {})`). A Zapier failure never blocks the user flow.

- **Yin:** frontend fires `/api/inquiry` fire-and-forget on contact submit (before waiver) as lead capture; Square booking flow proceeds independently.
- **Gentle / Corporate:** `/api/inquiry` is awaited as the primary action; Zapier webhooks fire server-side inside that handler.

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

---

## `vite.config.ts` — Dev API Plugin

`devApiPlugin()` registers Connect middleware on the Vite dev server for `/api/availability` and `/api/breeds`. Both read `class-schedule.json` synchronously and return the same JSON shape as the real Vercel functions. Uses `Intl.DateTimeFormat` directly (not `_config.ts`) for Montreal→UTC conversion.

This means `vite dev` works for the full booking UI without running `vercel dev`. Only needed for `vercel dev`: `booking.ts` (real Square payment), `inquiry.ts` (real email), `square-webhook.ts`.

---

## Environment Variables

```bash
# Server-only (Vercel env vars, never VITE_ prefixed)
SQUARE_ENVIRONMENT=sandbox|production
SQUARE_ACCESS_TOKEN=                   # Square API token
SQUARE_LOCATION_ID=                    # Square location ID
SQUARE_WEBHOOK_SIGNATURE_KEY=          # For webhook HMAC verification
SQUARE_MAX_SEATS=20                    # Capacity per slot
SQUARE_CLASS_TIMES=10:30,12:00,13:30,15:00  # Montreal-local times (used by _config.ts)
SQUARE_GST_TAX_ID=                     # Square catalog tax object ID for TPS/GST (5%)
SQUARE_QST_TAX_ID=                     # Square catalog tax object ID for TVQ/QST (9.975%)

# Email via Resend — server-only
RESEND_API_KEY=
RESEND_FROM_EMAIL=Studio Yopaw <noreply@studio-yopaw.com>
LEAD_NOTIFY_EMAIL=                     # Inquiry/booking notification recipient
PAYMENT_NOTIFY_EMAIL=                  # Webhook payment notification recipient

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

Tax IDs (`SQUARE_GST_TAX_ID` / `SQUARE_QST_TAX_ID`): if both are set, `booking.ts` creates a Square Order with line-item taxes so Square computes the authoritative total. If either is missing, only the base amount is charged (no tax line items on the Square order).

---

## CSS Architecture

All styles in `src/App.css`. CSS custom properties (design tokens):
- `--sage`, `--sage-dark` — green palette for accents
- `--rose` — pink/red for errors
- Typography: system font stack; italic `<em>` tags used in headings

Key classes: `.hero-section`, `.pricing-section`, `.pricing-card`, `.pricing-choice-card`, `.pricing-choice-stack--pair`, `.pricing-session-row`, `.pricing-time-modal`, `.pricing-step-block`, `.pricing-step-title`, `.pricing-helper-text`, `.pricing-payment-summary`, `.waiver-modal-overlay`, `.lang-picker-overlay`, `.navbar`, `.mobile-menu`, `.footer`

Scroll animations: sections get `.visible` class via IntersectionObserver → CSS transitions trigger. `transitionDelay` set inline for staggered card effects.

---

## Business Rules

- **Pricing:** $46 + taxes per drop-in session. Mat rental $5 + taxes on-site.
- **Cancellation:** 72-hour notice required for full refund on group classes.
- **Age:** Minimum 12 years old. Children 8+ may attend with an adult.
- **Group size:** Private/Corporate events: 2–20 participants.
- **Session length:** 60 minutes total (15 warm-up + 15 flow with pups + 30 free play).
- **Waiver:** Required for Regular Class (yin yoga) bookings. Not required for Private Event or Corporate.
- **Private/Corporate:** Not paid online — inquiry form only, studio follows up within 24h.

---

## Square Go-Live Checklist

Before going live with real bookings:
1. Set `SQUARE_ENVIRONMENT=production` in Vercel env vars
2. Fill all `VITE_SQUARE_*` variation IDs/versions from Square Dashboard → Items → Services
3. Fill `VITE_SQUARE_TEAM_MEMBER_ID` from Square Dashboard → Team
4. Fill `VITE_SQUARE_APP_ID` and `VITE_SQUARE_LOCATION_ID` (production values)
5. Fill `SQUARE_GST_TAX_ID` and `SQUARE_QST_TAX_ID` from Square Dashboard → Taxes
6. Register webhook URL `https://studio-yopaw.vercel.app/api/square-webhook` in Square Dashboard → Webhooks; copy signature key to `SQUARE_WEBHOOK_SIGNATURE_KEY`
7. Verify `VITE_SQUARE_YIN_BASE_CENTS=4600` matches the price in Square Dashboard ($46.00)
