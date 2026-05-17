# Studio Yopaw — Session Changes Log

**Date:** 2026-05-17  
**Branch:** main  
**Scope:** UI/content corrections for both FR and EN versions

---

## 1. Breed Name Correction

**File:** `src/App.tsx` — `SESSION_BREEDS` map (line ~90)

**Change:**
```diff
- '2026-06-14': { en: 'Fox Red Labrador', fr: 'Labrador rouge renard' },
+ '2026-06-14': { en: 'Fox Red Labrador', fr: 'Labrador roux' },
```

**Why:** "Labrador rouge renard" is not a recognized French breed name. The correct French term is "Labrador roux". The English name "Fox Red Labrador" was correct and left unchanged.

---

## 2. Schedule Time Corrections

**File:** `api/_config.ts` — `ALLOWED_CLASS_TIMES`

**Change:**
```diff
- export const ALLOWED_CLASS_TIMES = new Set(['10:00', '10:30', '12:00', '13:30', '15:00', '17:30'])
+ export const ALLOWED_CLASS_TIMES = new Set(['10:30', '12:00', '13:30', '15:00'])
```

**Why:** The approved session start times are 10:30, 12:00, 13:30, and 15:00. The times `10:00` and `17:30` were incorrect and needed to be removed.

**How it works:**
- `api/_config.ts` is the **server-side source of truth** for allowed times. It is imported by `api/availability.ts`, which is the Vercel serverless function that responds to `/api/availability` requests.
- The `slotMontrealTime()` helper (also in `_config.ts`) converts each Square UTC timestamp to Montreal/Eastern time using `Intl.DateTimeFormat` with `America/Toronto` — this handles Daylight Saving Time automatically, no hardcoded UTC offsets.
- The filter runs **before** the data is sent to the browser, so no incorrect times ever reach the frontend.
- A redundant frontend filter that was briefly added to `src/App.tsx` was removed once the API-level config was identified as the correct place.

**Note for Square Dashboard:** The `ALLOWED_CLASS_TIMES` filter acts as a frontend/API safeguard regardless of what Square returns. However, for clean CRM data, you should also align the team member's availability schedule in **Square Dashboard → Team → [team member] → Availability** to only include these four time slots. That way Square itself never generates slots you don't want.

---

## 3. Refund Policy — "Submitting a Refund Request" Section Simplified

**File:** `src/pages/RefundPolicyPage.tsx` — `COPY` object, section `s7` (both EN and FR)

**Change (English):**
```diff
- s7h: 'Refund Requests',
- s7p: 'For regular classes cancelled 72h in advance, no action is required — everything is handled automatically. For any other situation, reach out:',
+ s7h: 'Need help?',
+ s7p: "For any exceptional situation not covered above, feel free to reach out — we're happy to assist:",
```

**Change (French):**
```diff
- s7h: 'Demande de remboursement',
- s7p: "Pour les cours réguliers annulés 72h à l'avance, aucune action n'est requise de votre part — tout est traité automatiquement. Pour toute autre situation, contactez-nous :",
+ s7h: 'Une question ?',
+ s7p: "Pour toute situation exceptionnelle non couverte ci-dessus, n'hésitez pas à nous contacter — nous serons heureux de vous aider :",
```

**Why:** Client feedback indicated the "Submitting a Refund Request" section was no longer relevant because:
1. Users can cancel bookings themselves through Square's booking portal.
2. Square automatically processes refunds when the cancellation meets the 72-hour policy — no manual request needed.

The old section was also **redundant** — the page's top callout banner already states "Client cancellations made 72 hours or more before your session are processed automatically. No need to contact us." Section 2 (Client Cancellation) repeats the same information. Keeping a third explanation of the automatic process added noise without value.

The replacement section is intentionally brief: it exists only as a catch-all contact point for edge cases not covered by Sections 2–5.

---

## 4. Broken Refund Policy Link — SPA Routing Fix

**File:** `vercel.json`

**Change:**
```diff
  {
+   "rewrites": [
+     { "source": "/(.*)", "destination": "/index.html" }
+   ],
    "functions": {
      "api/**/*.ts": {
        "memory": 256,
        "maxDuration": 15
      }
    }
  }
```

**Why:** The app is a Single-Page Application (SPA). React handles routing internally by reading `window.location.pathname` and rendering the correct page component. However, when a user clicks the refund policy link (`/refund-policy` or `/politique-remboursement`), the browser makes a real HTTP request to Vercel for that path. Without a rewrite rule, Vercel looks for a file at that path, finds nothing, and returns a **404 error**.

The rewrite rule tells Vercel: "For any path, serve `index.html`." React then boots up, reads the URL, and renders `RefundPolicyPage` (as defined in `App.tsx`'s routing logic). This fix applies to both language URLs:
- `/refund-policy` (English)
- `/politique-remboursement` (French)

---

## 5. Text Color Fix — Green Links Updated to Brand Pink

**File:** `src/index.css`

The site underwent a brand palette change from sage green to pink/rose. Several CSS rules still referenced the old green color values and were updated.

### 5a. FAQ Refund Policy Link

```diff
  .faq-refund-policy-placeholder-link {
-   color: rgb(107, 143, 113);
+   color: var(--sage-dark);
    text-decoration: underline;
    font-weight: 500;
  }
  .faq-refund-policy-placeholder-link:hover {
-   color: rgb(84, 118, 88);
+   color: var(--sage);
  }
```

**Why:** This is the "Refund policy" / "Politique de remboursement" clickable link inside the FAQ cancellation answer. It was the most visible instance of the incorrect green color — appearing as a text link users interact with directly.

### 5b. Open FAQ Item Border and Shadow

```diff
  .faq-item.open {
    background: rgba(255,255,255,0.82);
-   border-color: rgba(107,143,113,0.25);
-   box-shadow: 0 8px 32px rgba(107,143,113,0.12);
+   border-color: rgba(244,114,182,0.25);
+   box-shadow: 0 8px 32px rgba(244,114,182,0.12);
  }
```

**Why:** When a FAQ accordion item is open, its border and glow highlight were green instead of the brand pink.

### 5c. FAQ Answer Separator Line

```diff
  .faq-answer {
-   border-top: 1px solid rgba(107,143,113,0.15);
+   border-top: 1px solid rgba(244,114,182,0.15);
  }
```

**Why:** The thin divider line between the question and the expanded answer body was using the old green.

### 5d. Footer Social Icon Hover Background

```diff
  .footer-social a:hover {
    border-color: var(--sage);
    color: var(--sage);
-   background: rgba(107,143,113,0.1);
+   background: rgba(244,114,182,0.1);
  }
```

**Why:** Hovering over Instagram/Facebook icons in the footer showed a faint green background tint instead of the brand pink tint.

**Brand palette reference** (defined in `src/index.css` `:root`):
| Variable | Value | Role |
|---|---|---|
| `--sage` | `#F472B6` | Primary accent (pink) |
| `--sage-dark` | `#DB2777` | Darker accent / interactive links |
| `--sage-light` | `#FCE7F3` | Soft background tint |

---

## 6. Both Languages

All changes above automatically apply to both English and French:
- Items 1–2: Code is language-aware and serves both from the same logic.
- Item 3: Both `COPY.en` and `COPY.fr` objects in `RefundPolicyPage.tsx` were updated.
- Item 4: The Vercel rewrite covers both `/refund-policy` and `/politique-remboursement`.
- Item 5: CSS has no language distinction — styles apply globally.

---

## Files Changed

| File | What changed |
|---|---|
| `src/App.tsx` | Breed name FR corrected |
| `api/_config.ts` | `ALLOWED_CLASS_TIMES` trimmed to 4 correct times |
| `src/pages/RefundPolicyPage.tsx` | Section s7 simplified in both EN and FR |
| `vercel.json` | SPA rewrite rule added |
| `src/index.css` | 4 green color values replaced with brand pink |
