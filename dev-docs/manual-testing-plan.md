# Manual Testing Plan — Studio Yopaw

Run this **after** all automated tests pass (`vitest` + Playwright). Automated tests cover pure logic and happy-path UI flows; this plan covers the things only a human can verify: Square Dashboard state, email delivery, Zapier webhooks, UX edge cases, and visual correctness.

**Environment:** Use Square **sandbox** credentials the whole time. Do not run against production until the end of the go-live checklist.

**Prerequisites:**
- `vite` dev server running on `http://localhost:5173` (for local) **or** open the Vercel preview URL
- Square sandbox Dashboard open: `developer.squareup.com` → sandbox → your location
- Resend dashboard open for email delivery checks
- Zapier dashboard open (or webhook inspector like webhook.site) to verify payloads

---

## 1. Regular Class — Single Person, No Mat

| # | Action | Expected result |
|---|---|---|
| 1 | Open `/#book`, language picker appears on first visit | Pick **EN**. Picker dismisses, booking section visible |
| 2 | Click **Regular Class** | Progress bar jumps to ~35%. Mat question appears |
| 3 | Click **I'll bring my own mat** | Advances to date picker. No mat line item in later summary |
| 4 | Click any available session date | Time-slot modal pops up |
| 5 | Click a time slot | Modal closes. Contact form appears. Date chip shows chosen date |
| 6 | Fill Name, Email, Phone | Fields accept input normally |
| 7 | Attempt to submit without checking waiver | **Confirm booking** button stays disabled |
| 8 | Check the waiver box → click **Confirm booking** | Waiver modal opens |
| 9 | Read waiver, click **I Agree** | Advances to payment step |
| 10 | Payment summary shows: `1 × Puppy Yoga Class · $46.00`, GST, QST, **Total** | No mat line item |
| 11 | Fill Square sandbox card: `4111 1111 1111 1111`, exp `12/30`, CVV `123`, ZIP `12345` | Card form accepts values |
| 12 | Click **Pay now** | Loading spinner appears; success screen arrives within ~10s |
| 13 | Success screen shows name, date, time, and "You're on the mat!" message | No error text visible |
| 14 | Open **Square Dashboard → Bookings → Calendar** | Appointment exists at chosen date/time |
| 15 | Click the appointment → check note field | Note reads: `Total attendees: 1 · Names: [your name] · Waiver confirmed: yes` |
| 16 | Open **Square Dashboard → Payments** | Payment exists; amount = $46 + taxes (≈ $53.29) |
| 17 | Open **Resend → Emails** | Notification email delivered to `LEAD_NOTIFY_EMAIL`; contains name, date, time, payment total |

---

## 2. Regular Class — Mat Rental

| # | Action | Expected result |
|---|---|---|
| 1 | Start Regular Class flow again | |
| 2 | Click **Rent a mat (+$5)** | Advances to date picker |
| 3 | Complete date + time selection | |
| 4 | Fill contact, check waiver, agree to waiver | Advances to payment |
| 5 | Payment summary shows: `1 × Puppy Yoga Class`, **Mat rental · $5.00**, GST, QST, Total | Mat line is present |
| 6 | Total is ≈ $58.62 (($46 + $5) × 1.14975) | |
| 7 | Pay with sandbox card | Success screen |
| 8 | Square Dashboard → Payment | Charge amount includes mat rental; order has two line items |

---

## 3. Regular Class — 3 Attendees (1 Primary + 2 Extra)

| # | Action | Expected result |
|---|---|---|
| 1 | Start Regular Class, choose "bring my own mat" | |
| 2 | Pick date + time | Contact form shows |
| 3 | Fill primary contact fields | |
| 4 | Click **Add another attendee** | Extra attendee card #1 appears with name input + waiver checkbox |
| 5 | Click **Add another attendee** again | Extra attendee card #2 appears |
| 6 | Leave one extra attendee name blank → try to submit | Button stays disabled (blank name blocks submit) |
| 7 | Fill both extra attendee names | |
| 8 | Check primary waiver only → try to submit | Button still disabled (extra waivers unchecked) |
| 9 | Check extra attendee #1 waiver only | Still disabled |
| 10 | Check extra attendee #2 waiver → click **Confirm booking** | Waiver modal opens |
| 11 | Agree to waiver → payment step | Summary shows `3 × Puppy Yoga Class · $138.00` |
| 12 | Pay → success | |
| 13 | Square Dashboard → appointment note | `Total attendees: 3 · Names: [Primary], [Extra1], [Extra2] · Waiver confirmed: yes` |
| 14 | Square Dashboard → payment amount | ≈ $158.87 (3 × $46 × 1.14975) |
| 15 | Notification email | Lists all three names and correct total |

---

## 4. Regular Class — Max Attendees Cap

| # | Action | Expected result |
|---|---|---|
| 1 | Start Regular Class, reach contact form | |
| 2 | Click **Add another attendee** 4 times | 4 extra attendee cards appear (5 total including primary) |
| 3 | Try to click **Add another attendee** again | Button is gone / hidden (max is 4 extras = 5 total) |

---

## 5. Regular Class — Remove Extra Attendee

| # | Action | Expected result |
|---|---|---|
| 1 | Add 2 extra attendees to contact form | 2 cards visible |
| 2 | Click **×** / remove on extra attendee #2 | Card disappears immediately |
| 3 | Proceed to payment | Summary shows `2 × Puppy Yoga Class` (not 3) |

---

## 6. Regular Class — Declined Card

| # | Action | Expected result |
|---|---|---|
| 1 | Complete all steps up to payment | |
| 2 | Use declined sandbox nonce — in the card form enter any **invalid** card details that Square sandbox rejects | |
| 3 | Click **Pay now** | Error message appears below card form (e.g. "Your card was declined") |
| 4 | No success screen | User can re-enter card details and retry |
| 5 | Check Square Dashboard → Bookings | **No ghost booking** was created for this slot |

> Tip: Square sandbox declines cards when the card number is invalid. Try `4000 0000 0000 0002` or enter an expired date.

---

## 7. Private Event — Inquiry Flow

| # | Action | Expected result |
|---|---|---|
| 1 | Click **Private Event** from class picker | Group size picker appears (default 2) |
| 2 | Increase group to 8 → click **Continue** | Date picker appears |
| 3 | Pick date + time | Contact form appears (no payment step) |
| 4 | Fill Name, Email, Phone | |
| 5 | Verify **message textarea** is visible | Label visible, textarea accepts input |
| 6 | Type a message: "Birthday celebration — gluten-free options?" | |
| 7 | **No waiver checkbox** appears | (Private Event doesn't require waiver) |
| 8 | Click **Send my request** | Loading state shows ("Sending…"), then success screen |
| 9 | Success screen shows clock icon and "Request received" | Not the "You're on the mat!" screen |
| 10 | Notification email (Resend) | Received at `LEAD_NOTIFY_EMAIL`; contains group size 8 and the message |
| 11 | Zapier dashboard | `ZAPIER_INQUIRY_URL` webhook fired; payload includes `classType: "Private Event"`, `attendeeCount: 8`, `message` field |

---

## 8. Corporate Event — Inquiry Flow

| # | Action | Expected result |
|---|---|---|
| 1 | Click **Corporate** from class picker | Group size picker appears |
| 2 | Set group to 15 → Continue | Date picker |
| 3 | Pick date + time | Corporate contact form with **Company Name** field |
| 4 | Try to submit without filling Company Name | HTML5 `required` validation blocks form; browser highlights field |
| 5 | Fill all fields: Name, Company, Email, Phone, Message | |
| 6 | Click **Send my request** | Success screen |
| 7 | Notification email | Contains company name and message |
| 8 | Zapier | `ZAPIER_INQUIRY_URL` fires; payload has `companyName: "Acme Corp"`, `classType: "Corporate"` |

---

## 9. Back Navigation at Every Step

| Step | Back action | Expected destination |
|---|---|---|
| Mat step (yin) | Click ← back | Returns to class picker |
| Date step (yin, after mat) | Click ← back | Returns to mat question |
| Date step (gentle) | Click ← back | Returns to people picker |
| Date step (corporate) | Click ← back | Returns to people picker |
| Contact step | Click ← back | Returns to date picker |
| Payment step (yin only) | Click ← back | Returns to contact form; previously filled values still present |

---

## 10. French Language

| # | Check | Expected |
|---|---|---|
| 1 | Open site fresh, pick **Français** on language modal | Whole UI switches to French |
| 2 | Navigate to Regular Class → contact form | Extra attendee button reads "Ajouter un participant" |
| 3 | Extra attendee card labels | "Participant 2", "Participant 3" (not "Attendee 2") |
| 4 | Reach payment step with 2 people | Summary reads "2 × Cours de yoga avec chiots" |
| 5 | Corporate contact form | Company field label reads "Nom de l'entreprise" |
| 6 | Private Event success | Success message is in French |
| 7 | Toggle to EN mid-flow (navbar button) | UI switches to English; form values preserved |
| 8 | Refund policy page at `/politique-remboursement` | Loads French copy; Navbar says "Politique de remboursement" |
| 9 | Toggle lang on refund policy page | URL swaps to `/refund-policy`; copy switches to EN |

---

## 11. Seat Guard (Full Slot)

| # | Action | Expected result |
|---|---|---|
| 1 | In Square sandbox Dashboard, manually fill a slot to `maxSeats` (create dummy bookings) | |
| 2 | In the UI, select that same date + time | Slot should **not appear** in the time modal (filtered out by `/api/availability`) |
| 3 | If you can force the race condition (two tabs, submit simultaneously) | Second submission returns "This class is now full" error |

> This is hard to test manually in a controlled way. Mark as verified if the availability hook correctly hides full slots.

---

## 12. First-Visit Language Modal

| # | Action | Expected result |
|---|---|---|
| 1 | Open site in a fresh incognito window | Language picker modal appears immediately, blocking the page |
| 2 | Try to scroll or click behind modal | Nothing happens (modal is blocking) |
| 3 | Pick EN | Modal closes, `studio-yopaw-lang=en` set in localStorage |
| 4 | Refresh page | Language modal does **not** appear again |
| 5 | Clear localStorage, reload | Modal appears again |

---

## 13. Refund Policy & Static Pages

| # | Check | Expected |
|---|---|---|
| 1 | Navigate to `/refund-policy` | Page loads with Navbar (solid background) and policy text |
| 2 | Navigate to `/politique-remboursement` | Same page in French |
| 3 | FAQ section → "Refund Policy" link | Navigates to correct lang-aware policy URL |
| 4 | Navbar + Footer present on policy page | Same nav links; no broken styles |

---

## 14. Regression Checks

These existing features must still work after any recent changes.

| Feature | What to verify |
|---|---|
| Single-person Regular Class | Books 1 person, charges 1 × $46 + taxes |
| Mat rental | Adds $5 to base before tax; separate line in payment summary |
| Google Ads conversion | After successful yin payment, `gtag('event', 'conversion', ...)` fires (check browser DevTools → Network → `googleads` request, or Console for no `gtag is not defined` error) |
| Zapier — regular class | Fires **once** after payment with `attendeeCount: 1` (or 2/3 for multi); does **not** fire on the earlier fire-and-forget inquiry call |
| Zapier — inquiry | Fires for Private Event and Corporate only; NOT for Regular Class lead-capture |
| Lead capture email | Resend email delivered even if user abandons at payment (fire-and-forget fires on contact submit for yin) |
| Clarity / Analytics | No JS errors in console related to Clarity or Google Tag |
| Mobile layout | Booking flow is usable on a 390px-wide viewport (iPhone 14 size); no horizontal overflow |

---

## Sign-Off Checklist

Before approving a production deploy, confirm:

- [ ] Sections 1–3 completed in sandbox (single person, mat rental, multi-attendee)
- [ ] Section 7 (Private Event) and Section 8 (Corporate) completed
- [ ] Section 9 (back navigation) checked at all steps
- [ ] Section 10 (French) spot-checked for new strings
- [ ] Section 14 regression items verified
- [ ] Square Dashboard shows correct bookings, notes, and charge amounts
- [ ] Resend notification emails received and content is correct
- [ ] Zapier webhook payloads are correct for both webhook URLs
- [ ] No JS console errors on any flow
