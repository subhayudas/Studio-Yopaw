# Plan: Remove Payment for Private & Corporate Booking Flows

## Goal

For **Private Event** (gentle yoga) and **Corporate** classes:
- Skip the Square payment step entirely
- After the contact form is submitted, `await` the `/api/inquiry` call
- Show a "request received" success screen on success
- Show an error message on failure so the user can retry

Regular Class (yin) is **unchanged** — it still goes through Square payment.

---

## What Already Exists and Needs No Changes

| Thing | Why it's already good |
|---|---|
| `api/inquiry.ts` | Already sends a Resend email to the admin with name, email, phone, class type, date, time, group size. Also fires Zapier webhooks. |
| `renderPrivateOrCorporateRequestSuccess()` | Already renders a nice "request received / pending clock" success screen for both private and corporate. |
| Contact forms | Already collect name, email, phone for both flows. |
| Date/time picker | Already captures `selectedSessionIso` and `selectedTimeSlotId` — included in the inquiry email. |
| Group size picker | Already captures `privateGroupCount` — included in the inquiry email. |

---

## Current Flow (Before)

```
Private Event:  people → date → contact → payment (Square) → publicSuccess { source: 'private' }
Corporate:      people → date → contact → payment (Square) → corporateSuccess
```

In the contact step, `/api/inquiry` is called **fire-and-forget** (no await, errors swallowed), then the user is advanced to the Square card form.

---

## Target Flow (After)

```
Private Event:  people → date → contact → [await inquiry] → publicSuccess { source: 'private' }
Corporate:      people → date → contact → [await inquiry] → corporateSuccess
```

The inquiry submission becomes the **primary, awaited action**. On failure the user stays on the contact step and sees an error.

---

## Changes Required

### 1. `src/App.tsx` — New state variables

Add below the existing booking state variables:

```ts
const [inquiryLoading, setInquiryLoading] = useState(false)
const [inquiryError, setInquiryError]     = useState<string | null>(null)
```

---

### 2. `src/App.tsx` — `submitPublic` (for gentle / Private Event)

**Current** (simplified):
```ts
const submitPublic = (e: FormEvent) => {
  fetch('/api/inquiry', { ... }).catch(() => {})   // fire-and-forget
  const needsWaiver = flow.yoga !== 'gentle'
  if (needsWaiver && !waiverAccepted) return
  gtag(...)
  setFlow({ kind: 'public', step: 'payment', yoga: flow.yoga })
}
```

**New** — split into two paths:

```ts
const submitPublic = async (e: FormEvent) => {
  e.preventDefault()
  if (flow.kind !== 'public') return

  // ── Private Event path (gentle) ──────────────────────────────────────────
  if (flow.yoga === 'gentle') {
    setInquiryLoading(true)
    setInquiryError(null)
    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          classType: 'Private Event',
          preferredDate: selectedSessionIso ?? '',
          preferredTime: selectedTimeSlotId ?? '',
          groupSize: privateGroupCount,
        }),
      })
      if (!res.ok) throw new Error('inquiry failed')
      requestScrollPricingCardAfterAdvance()
      setFlow({ kind: 'publicSuccess', source: 'private' })
    } catch {
      setInquiryError(s.inquirySubmitError)   // new i18n string (see §6)
    } finally {
      setInquiryLoading(false)
    }
    return
  }

  // ── Regular Class path (yin) — unchanged ─────────────────────────────────
  fetch('/api/inquiry', { ... }).catch(() => {})   // keep fire-and-forget for lead capture
  if (!waiverAccepted) return
  gtag(...)
  requestScrollPricingCardAfterAdvance()
  setFlow({ kind: 'public', step: 'payment', yoga: flow.yoga })
}
```

---

### 3. `src/App.tsx` — `submitCorporate`

**Current**:
```ts
const submitCorporate = (e: FormEvent) => {
  fetch('/api/inquiry', { ... }).catch(() => {})   // fire-and-forget
  requestScrollPricingCardAfterAdvance()
  setFlow({ kind: 'corporate', step: 'payment' })
}
```

**New**:
```ts
const submitCorporate = async (e: FormEvent) => {
  e.preventDefault()
  setInquiryLoading(true)
  setInquiryError(null)
  try {
    const res = await fetch('/api/inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: corpName,
        email: corpEmail,
        phone: corpPhone,
        classType: 'Corporate',
        preferredDate: selectedSessionIso ?? '',
        preferredTime: selectedTimeSlotId ?? '',
        groupSize: privateGroupCount,
      }),
    })
    if (!res.ok) throw new Error('inquiry failed')
    requestScrollPricingCardAfterAdvance()
    setFlow({ kind: 'corporateSuccess' })
  } catch {
    setInquiryError(s.inquirySubmitError)
  } finally {
    setInquiryLoading(false)
  }
}
```

---

### 4. `src/App.tsx` — Error display in contact forms

Both the private event contact form (`flow.kind === 'public' && flow.step === 'contact' && flow.yoga === 'gentle'`) and the corporate contact form (`flow.kind === 'corporate' && flow.step === 'contact'`) need to show `inquiryError` if set, and disable the submit button while `inquiryLoading` is true.

Pattern (same for both forms):
```tsx
{inquiryError && (
  <p className="pricing-error" role="alert">{inquiryError}</p>
)}
<button
  type="submit"
  className="pricing-submit-btn"
  disabled={inquiryLoading}
>
  {inquiryLoading ? s.inquirySubmitting : s.contactSubmitLabel}
</button>
```

---

### 5. `src/App.tsx` — Flow type & cleanup

**a. Remove `'payment'` from the corporate step union** — corporate will never reach it:
```ts
// Before
| { kind: 'corporate'; step: 'people' | 'date' | 'contact' | 'payment' }

// After
| { kind: 'corporate'; step: 'people' | 'date' | 'contact' }
```

**b. Remove `showBack` guard for corporate payment** — the line `else if (flow.kind === 'corporate' && flow.step === 'payment') showBack = false` (it currently is not in showBack anyway, but the `goBack` handler for `corporate payment` can be removed).

**c. Simplify `submitBookingWithPayment`** — remove the corporate branch and the gentle-group-pricing branch since neither will ever call it:
- Delete the `if (flow.kind === 'corporate') { ... }` block
- Delete the `if (flow.yoga === 'gentle') { ... }` branch in the else block
- After removal, the function only handles yin bookings

**d. Remove the payment render block for corporate** — find where `flow.kind === 'corporate' && flow.step === 'payment'` renders the Square card form and delete it. Only `flow.kind === 'public' && flow.step === 'payment'` should show the card form (and it already implicitly only handles yin since gentle will never reach it).

---

### 6. `src/i18n/siteStrings.ts` — New strings

Add to both `siteStrings.en` and `siteStrings.fr` (and the `SiteStrings` interface):

| Key | EN | FR |
|---|---|---|
| `inquirySubmitError` | `'Failed to send your request. Please try again.'` | `'Impossible d\'envoyer votre demande. Veuillez réessayer.'` |
| `inquirySubmitting` | `'Sending…'` | `'Envoi en cours…'` |

---

### 7. `CLAUDE.md` — Update booking flow documentation

The CLAUDE.md description for the Gentle path incorrectly says it goes to `publicSuccess` directly (matching the intended behavior, not the actual code). After this change the code will match. Update both the Gentle and Corporate path docs to reflect no payment step.

---

## Files Changed

| File | Type of change |
|---|---|
| `src/App.tsx` | Primary — logic, state, render |
| `src/i18n/siteStrings.ts` | Add 2 string keys (EN + FR + interface) |
| `CLAUDE.md` | Doc update — booking flow section |
| `api/inquiry.ts` | No changes needed |
| `api/booking.ts` | No changes needed |

---

## Questions Before Starting

1. **Inquiry failure behaviour**: If the `/api/inquiry` network call fails (Resend down, server error), should we:
   - **(A — Recommended)** Show an error on the contact form and let the user retry; or
   - **(B)** Proceed to the success screen anyway (silently swallow the error)?

2. **Email date/time format**: The current inquiry email sends raw values — `preferredDate` as `"2026-06-14"` and `preferredTime` as a full UTC ISO string. Should I format these into human-readable strings (e.g., `"June 14, 2026"` and `"10:30 AM (Montreal)"`) inside `api/inquiry.ts`?

3. **Submit button loading text**: The button currently says e.g. "Send request". While submitting should it say "Sending…" (with a spinner), or just be disabled silently?
