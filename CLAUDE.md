# Studio Yopaw — Codebase Context

## Product Overview

Studio Yopaw is a **puppy yoga studio** website and booking platform for a real studio located at 1515A Des Marguerites St., Saint-Lazare, QC J7T 2R8 (founded 2026 by Joëlle Castonguay). The site is bilingual (English / French), handles online class bookings with Square payments, and sends email notifications via Resend.

**Live domain:** www.studioyopaw.ca  
**Contact:** Studioyopaw@gmail.com | 514-242-4947  
**Social:** instagram.com/studioyopaw  

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v4 |
| Backend (serverless) | Vercel Functions (`api/*.ts`), `@vercel/node` |
| Payments | Square SDK v44 (`square` npm), `react-square-web-payments-sdk` |
| Email | Resend v6 (`resend` npm) |
| Deployment | Vercel (frontend + API functions bundled together) |

Build: `tsc -b && vite build` → outputs to `dist/`  
Dev: `vite` (local), `vercel dev` (to test API functions locally)

---

## Repository Structure

```
Studio-Yopaw/
├── api/                        # Vercel serverless functions
│   ├── _square.ts              # Shared Square client singleton
│   ├── availability.ts         # GET  /api/availability
│   ├── booking.ts              # POST /api/booking
│   ├── inquiry.ts              # POST /api/inquiry
│   └── square-webhook.ts       # POST /api/square-webhook
├── public/                     # Static assets served as-is
│   ├── yopawlogo.png
│   ├── step1Logo.png / step2Logo.png / step3Logo.png   # Experience section icons
│   ├── *.webp / *.png          # Gallery + class card images
│   └── 182991340eeb459d952466dcb9f2d778.mp4            # Hero background video
├── src/
│   ├── App.tsx                 # Root component + all page sections
│   ├── App.css                 # All styles (Tailwind + custom CSS vars)
│   ├── main.tsx                # React entry point
│   ├── index.css               # Global resets
│   ├── assets/                 # Vite-processed assets (not currently used)
│   ├── components/
│   │   ├── Navbar.tsx          # Responsive navbar with lang toggle
│   │   ├── Footer.tsx          # Footer with links, social, address
│   │   └── BookingWaiverModal.tsx   # Full legal waiver modal (EN + FR)
│   ├── hooks/
│   │   └── useSquareAvailability.ts  # Fetches time slots from /api/availability
│   ├── i18n/
│   │   ├── siteStrings.ts      # All EN/FR string content (single source of truth)
│   │   └── LanguageProvider.tsx  # React context for language state
│   ├── lib/
│   │   └── squareServices.ts   # Square service variation IDs + pricing config
│   └── pages/
│       └── RefundPolicyPage.tsx  # Standalone refund policy page
├── vercel.json                 # Vercel config (256MB / 15s for api/**)
├── .env.local.example          # Required env var template
├── index.html                  # Vite HTML entry
├── vite.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
└── eslint.config.js
```

---

## Routing

The app is a **single-page application with hash routing**. No React Router. The `App` component handles all routing:

```
/                         → MarketingSite (one-page landing)
/refund-policy            → RefundPolicyPage
/politique-remboursement  → RefundPolicyPage (FR)
#book / #booking / #pricing / #corporate  → scrolls to booking card
```

`normalizeSitePathname()` strips trailing slashes. When lang changes on the refund policy page, `history.replaceState` swaps the URL to the correct language path without reloading.

---

## Landing Page Sections (`src/App.tsx`)

All sections live in `App.tsx` as top-level function components. Order on the page:

1. **`HeroSection`** — Full-screen video (`/182991340eeb459d952466dcb9f2d778.mp4`) with title, subtitle, two CTA buttons
2. **`MarqueeTicker`** — Infinite scrolling marquee of brand phrases
3. **`ExperienceSection`** — 3-step session flow (Warm Up 15min → Gentle Flow with Pups 15min → Play & Connect 30min), step icons at `/step1Logo.png` etc.
4. **`ClassesSection`** — 3 class cards (Regular Class, Private Event, Corporate) using `CLASS_IMAGES`
5. **`PricingSection`** — Multi-step booking wizard (see detailed section below)
6. **`TestimonialsSection`** — Auto-advancing carousel (4.5s interval), 3 testimonial cards
7. **`GallerySection`** — Photo grid using `GALLERY_IMAGES`, IntersectionObserver animation
8. **`AboutSection`** — Studio story with floating paw icons
9. **`FAQSection`** — Accordion FAQ, links to refund policy via `<<REFUND_POLICY_LINK>>` token
10. **`Footer`**

All sections use a shared `useInView` hook (IntersectionObserver) for scroll-triggered CSS animations.

---

## Booking Flow (`PricingSection` in `src/App.tsx`)

The booking section is the core interactive piece. It uses a discriminated union `Flow` type with these states:

```
chooseClass
  ↓ (pick Regular Class / yin)
public { step: 'mat' }        → asks if they own a mat
  ↓
public { step: 'date' }       → shows Square availability calendar
  ↓ (pick date → time modal)
public { step: 'contact' }    → name/email/phone + waiver checkbox
  ↓ (submit → advances to payment)
public { step: 'payment' }    → Square PaymentForm (credit card)
  ↓ (token → POST /api/booking)
publicSuccess { source: 'regular' }  → confirmation screen

chooseClass
  ↓ (pick Private Event / gentle)
public { step: 'people' }     → group size picker (2–20)
  ↓
public { step: 'date' }
  ↓ (pick date + time)
public { step: 'contact' }    → name/email/phone (no waiver)
  ↓ (submit → POST /api/inquiry, email only)
publicSuccess { source: 'private' }  → "Request received" screen

chooseClass
  ↓ (pick Corporate)
corporate { step: 'people' }  → group size picker
  ↓
corporate { step: 'date' }
  ↓
corporate { step: 'contact' } → corp contact form
  ↓ (submit → POST /api/inquiry)
corporateSuccess              → "Request received" screen
```

**Key booking state:**
- `selectedSessionIso` — ISO date string `"YYYY-MM-DD"` for the chosen date
- `selectedTimeSlotId` — Full Square `startAt` ISO timestamp `"2025-03-01T14:30:00Z"`
- `flow` — discriminated union tracking where the user is in the funnel

**Waiver:** Required for Regular Class (yin) bookings only. Opens `BookingWaiverModal` as a portal on `document.body`. Gentle/Private and Corporate skip the waiver.

**Progress bar:** Width driven by `progressPercent()` which maps each flow state to a percentage (25% → 45% → 62% → 80% → 95% → 100%).

**Time slot modal:** When user clicks a date row in the date step, `pendingSessionIso` is set, which triggers an overlay modal showing available time slots for that date. Clicking a slot sets `selectedTimeSlotId` and advances the flow.

---

## Internationalization (`src/i18n/`)

### `siteStrings.ts`
Single file containing **all** user-visible text for EN and FR. The `SiteStrings` interface has every string key. Both `siteStrings.en` and `siteStrings.fr` implement this interface.

- `buildMarquee()` interspersed items with `·` separator
- `FAQ_REFUND_POLICY_LINK_TOKEN = '<<REFUND_POLICY_LINK>>'` — special token in FAQ answers, replaced by `FaqAnswerBody` with a real `<a>` to the refund policy page
- `interpolate(template, vars)` replaces `{key}` placeholders (used in success messages: `{email}`, `{date}`, `{time}`, `{phone}`)

### `LanguageProvider.tsx`
- Persists language in `localStorage` under key `studio-yopaw-lang`
- On first visit (no stored lang), shows a **language picker modal** (blocking the whole UI) until user picks EN or FR
- Updates `document.documentElement.lang`, `document.title`, and meta description on lang change
- Exports `useI18n()` hook → `{ lang, s, pickingLanguage, pickLang, toggleLang }`

---

## API Endpoints (`api/`)

All functions run as Vercel serverless functions. 256MB RAM, 15s timeout (configured in `vercel.json`).

### `api/_square.ts` — Square client singleton
```ts
export const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production'
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox,
})
```
Imported by `availability.ts` and `booking.ts`.

### `GET /api/availability`
Query params: `serviceVariationId`, `startDate` (YYYY-MM-DD), `endDate` (YYYY-MM-DD)  
Returns: `{ availabilities: Array<{ startAt: string }> }`  
Uses `square.bookings.searchAvailability()` to find open slots for a service within a date range at the configured location.

### `POST /api/booking`
Body: `{ givenName, familyName, email, phone, serviceVariationId, serviceVariationVersion, teamMemberId, startAt, cardNonce, amountCents }`  
Flow:
1. `square.customers.search()` by email → create if not found
2. `square.bookings.create()` for the appointment
3. `square.payments.create()` charging the card nonce (CAD)
4. Send notification email via Resend to `LEAD_NOTIFY_EMAIL`

Returns: `{ bookingId, paymentStatus }` or `{ error }` on failure.

### `POST /api/inquiry`
Body: `{ fullName, email, phone, classType, preferredDate?, preferredTime?, groupSize? }`  
Sends an email to `LEAD_NOTIFY_EMAIL` via Resend. Used for Private Event and Corporate booking requests (no Square payment taken — they're custom-quoted).

### `POST /api/square-webhook`
Validates Square HMAC-SHA256 signature (`x-square-hmacsha256-signature` header).  
Notification URL hardcoded: `https://studio-yopaw.vercel.app/api/square-webhook`  
Handles:
- `payment.completed` → email to `PAYMENT_NOTIFY_EMAIL`
- `customer.created` → email to `LEAD_NOTIFY_EMAIL`

Responds 200 immediately before processing to avoid Square retries.

---

## Square Services Config (`src/lib/squareServices.ts`)

```ts
export const SQUARE_SERVICE_VARIATIONS = {
  yin:       { serviceVariationId, serviceVariationVersion, teamMemberId, amountCents: 3500 },
  gentle:    { serviceVariationId, serviceVariationVersion, teamMemberId, amountCents: 3500 },
  corporate: { serviceVariationId, serviceVariationVersion, teamMemberId, amountCents: 15000 },
}
```

**All IDs are currently `'FILL_IN_FROM_SQUARE_DASHBOARD'`** — these must be replaced with real values from the Square Dashboard before the booking flow works end-to-end. Go to Square Dashboard → Items → Services to find `serviceVariationId` and `serviceVariationVersion`. Team member ID comes from Square Dashboard → Team.

The `amountCents` values are in CAD cents: 3500 = $35.00 CAD (note: pricing shown to user is $46 + taxes — these values may need updating to match).

---

## Frontend Hook (`src/hooks/useSquareAvailability.ts`)

```ts
useSquareAvailability(serviceVariationId, startDate, endDate)
// Returns: { slots: SquareSlot[], loading: boolean }
// SquareSlot = { startAt: string }
```

Fetches from `/api/availability`, skips if `serviceVariationId` is empty. Resets and refetches when any parameter changes. The `PricingSection` calls this with a 60-day window from today.

---

## Components

### `Navbar.tsx`
- Transparent by default, becomes opaque (`scrolled` class) after 60px scroll
- `variant="solid"` used on policy pages for always-opaque background
- EN/FR language toggle button (cycles via `toggleLang`)
- Mobile hamburger menu with same links
- Nav links: How It Works (`#experience`), Classes (`#classes`), Pricing (`#pricing`), Values/About (`#about`), FAQ (`#faq`), Reviews (`#testimonials`)

### `Footer.tsx`
- Logo, tagline, Instagram + Facebook links
- Navigation column with same links as navbar + Refund Policy link (lang-aware URL)
- Contact: address, email (`Studioyopaw@gmail.com`), phone (`514-242-4947`), website

### `BookingWaiverModal.tsx`
- Portal rendered on `document.body`
- Two full legal texts: `WaiverContentFr` and `WaiverContentEn`
- Covers: risk acknowledgement, voluntary participation, compliance, liability release, personal responsibility, emergency care, image use, minors
- Closes on Escape key or backdrop click

### `RefundPolicyPage.tsx` (`src/pages/`)
- Standalone page with Navbar (solid variant) + Footer
- Bilingual policy copy defined inline as `COPY` object (not from `siteStrings`)
- 7 sections: Payment, Client Cancellation (72h rule), Late Arrivals, Studio Cancellation (full refund + 25% discount), Private/Corporate, Acceptance, Refund Requests
- URL auto-corrects to canonical path when lang changes (`history.replaceState`)

---

## Environment Variables

```bash
# Server-only (Vercel env vars, never VITE_ prefixed)
SQUARE_ENVIRONMENT=sandbox|production
SQUARE_ACCESS_TOKEN=                   # Square API token
SQUARE_LOCATION_ID=                    # Square location ID (server side)
SQUARE_WEBHOOK_SIGNATURE_KEY=          # For webhook HMAC verification
RESEND_API_KEY=                        # Resend API key
LEAD_NOTIFY_EMAIL=                     # Where inquiry/booking emails are sent
PAYMENT_NOTIFY_EMAIL=                  # Where payment webhook emails are sent

# Browser-safe (exposed via Vite)
VITE_SQUARE_APP_ID=                    # Square application ID for Web Payments SDK
VITE_SQUARE_LOCATION_ID=              # Square location ID (frontend)
```

`VITE_SQUARE_APP_ID` and `VITE_SQUARE_LOCATION_ID` are read in `App.tsx` at the module level. If `VITE_SQUARE_APP_ID` is empty, the payment step shows a configuration error message instead of the card form.

---

## CSS Architecture

All styles are in `src/App.css`. Uses CSS custom properties (design tokens):
- `--sage`, `--sage-dark` — green palette for accents
- `--rose` — pink/red for errors
- Typography uses system font stack; italic `<em>` tags used extensively in headings

Key CSS classes: `.hero-section`, `.pricing-section`, `.pricing-card`, `.pricing-choice-card`, `.pricing-session-row`, `.pricing-time-modal`, `.waiver-modal-overlay`, `.lang-picker-overlay`, `.navbar`, `.mobile-menu`, `.footer`

Scroll animation pattern: section containers get `.visible` class via IntersectionObserver when in view, triggering CSS transitions. `transitionDelay` set inline per card for staggered effects.

---

## Business Rules

- **Pricing:** $46 + taxes per drop-in session. Mat rental available on-site for $5.
- **Cancellation:** 72-hour notice required for full refund on group classes.
- **Age:** Minimum 12 years old. Children 8+ may attend with an adult.
- **Group size:** Private/Corporate events: 2–20 participants.
- **Session length:** 60 minutes total (15 warm-up + 15 flow with pups + 30 free play).
- **Waiver:** Required for Regular Class (yin yoga) bookings. Not required for Private Event or Corporate inquiries.
- **Private/Corporate:** Not paid online — inquiry form only, studio follows up within 24h.

---

## What Still Needs To Be Done (Square Go-Live)

All placeholder IDs in `src/lib/squareServices.ts` must be replaced with real values:
1. Go to Square Dashboard (production environment)
2. Create services for "Regular Class", "Private Event", "Corporate" under Items → Services
3. Copy each service's variation ID and version into `SQUARE_SERVICE_VARIATIONS`
4. Copy team member ID(s) from Dashboard → Team
5. Set `SQUARE_ENVIRONMENT=production` in Vercel env vars
6. Update `VITE_SQUARE_APP_ID` and `VITE_SQUARE_LOCATION_ID` to production values
7. Register the webhook URL `https://studio-yopaw.vercel.app/api/square-webhook` in Square Dashboard and copy the signature key to `SQUARE_WEBHOOK_SIGNATURE_KEY`
8. Verify `amountCents` in `squareServices.ts` matches actual price (currently 3500 = $35.00, but site shows $46)
