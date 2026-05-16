# Studio Yopaw — Testing Guide

## Before You Start

```
vercel dev          # starts local server at http://localhost:3000
```

Make sure all env vars are loaded (`vercel env ls` to verify). If you see a Square 401
error, run `.\scripts\push-env-to-vercel.ps1` and restart.

**Square test card (safe to use in production — refund immediately after):**
```
Card number: 4111 1111 1111 1111
CVV:         111
Expiry:      Any future date (e.g. 12/28)
```

---

## A — Availability API (Agent-testable)

```bash
# Should return slots at 10:30, 12:00, 13:30, 15:00 Montreal time only
curl "http://localhost:3000/api/availability?serviceVariationId=UFR52E7LXZ7JT4FEGCVLMAWK&startDate=2026-05-18&endDate=2026-05-25"
```

**Pass criteria:**
- [ ] Response is `{ availabilities: [...] }` (no `error` key)
- [ ] Every `startAt` converts to exactly one of: 10:30, 12:00, 13:30, 15:00 in Montreal time
- [ ] Every slot shows `seatsRemaining: 20`
- [ ] No slots outside those 4 times appear

```bash
# Verify 32-day limit is respected (should not error)
curl "http://localhost:3000/api/availability?serviceVariationId=UFR52E7LXZ7JT4FEGCVLMAWK&startDate=2026-05-18&endDate=2026-06-17"
```

---

## B — Regular Class (Yin) — Full Booking Flow (Manual)

### B1. No mat rental — $46 charge

1. Open http://localhost:3000 → click **Book Now**
2. Select **Regular Class**
3. Mat question → click **"No, I have one"**
4. Pick any available date → pick any time slot
   - [ ] Slot shows correct time (10:30 / 12:00 / 13:30 / 15:00)
   - [ ] Slot shows **"20 spots remaining"** (EN) or **"20 places restantes"** (FR)
5. Fill contact form → check the waiver checkbox → click **Book my spot**
6. Payment form appears → enter test card → submit
   - [ ] Charge should be **$46.00 CAD**
   - [ ] Confirmation screen appears with booking date + time
   - [ ] Email arrives at `leadpipecrm@gmail.com`
7. Verify in Square Dashboard → Appointments → booking exists

### B2. With mat rental — $51 charge

1. Same flow, but at step 3 click **"Yes, I need a mat"**
6. Payment form:
   - [ ] Charge should be **$51.00 CAD** ($46 + $5 mat)

### B3. Seat limit (manual — requires 20 bookings)

Book the same slot 20 times (use different emails). On the 21st attempt:
- [ ] API returns 409 with `"This class is full"`
- [ ] UI shows the error message

---

## C — Private Group (Gentle) — Full Booking Flow (Manual)

1. Open http://localhost:3000 → **Book Now** → **Private Event**
2. Group size picker → set to **5 people**
3. Pick date → pick time slot
4. Fill contact: name, email, phone → click **Proceed to payment**
   - [ ] Page shows `Total: 5 × $46 = $230 + taxes`
5. Payment form appears → enter test card → submit
   - [ ] Charge should be **$230.00 CAD** (5 × $46)
   - [ ] Confirmation screen appears with date + time
   - [ ] Email arrives at `leadpipecrm@gmail.com`
6. Check Square Dashboard → booking created for Private Puppy Yoga

**Edge cases:**
- [ ] Group size minimum: 2 (– button stops at 2)
- [ ] Group size maximum: 20 (+ button stops at 20)

---

## D — Corporate — Full Booking Flow (Manual)

1. **Book Now** → **Corporate**
2. Group size → set to **10 people**
3. Pick date → pick time slot
4. Fill contact: company name, email, phone → click **Proceed to payment**
   - [ ] Page shows `Total: 10 × $46 = $460 + taxes`
5. Enter test card → submit
   - [ ] Charge should be **$460.00 CAD**
   - [ ] Confirmation screen appears
   - [ ] Email arrives at `leadpipecrm@gmail.com`
6. Check Square Dashboard → Corporate Puppy Yoga booking created

---

## E — Bilingual (Manual)

1. Switch to **FR** using the language toggle in the navbar
2. Walk through any booking flow
   - [ ] All labels, buttons, waiver text in French
   - [ ] "20 places restantes" on time slots
   - [ ] "Passer au paiement" for private/corporate contact submit
   - [ ] "Paiement sécurisé" on payment step
3. Switch back to EN mid-flow
   - [ ] Language updates immediately, no data lost

---

## F — Back Navigation (Manual)

For each class type, verify the back button works at every step:

| Flow | Step | Back goes to |
|------|------|-------------|
| Regular | mat → | choose class |
| Regular | date → | mat |
| Regular | contact → | date |
| Regular | payment → | contact |
| Private | people → | choose class |
| Private | date → | people |
| Private | contact → | date |
| Private | payment → | contact |
| Corporate | people → | choose class |
| Corporate | date → | people |
| Corporate | contact → | date |
| Corporate | payment → | contact |

- [ ] No state is lost incorrectly when going back
- [ ] Progress bar decreases correctly

---

## G — Booking API (Agent-testable)

```bash
# Should return 405 on GET
curl http://localhost:3000/api/booking

# Seat-full guard — book same slot 20 times then:
# Should return 409 {"error":"This class is full"}
```

---

## H — Square Dashboard (Manual — required before testing B/C/D)

These cannot be tested via API — must be done in Square Dashboard:

- [ ] **Regular Puppy Yoga** → Services → assign Joëlle as team member
- [ ] **Private Puppy Yoga** → Services → assign Joëlle as team member
- [ ] **Corporate Puppy Yoga** → Services → assign Joëlle as team member
- [ ] Working hours cover the days and times you want classes
  - For 10:30/12:00/13:30/15:00 slots, hours must include at least 10:30–16:30
  - For weekend classes: add Saturday and/or Sunday hours

---

## I — Refund After Testing

After every test booking using a real card:
1. Square Dashboard → Payments → find the charge
2. Click **Refund** → full amount
3. Confirms payment pipeline works without leaving real charges

---

## J — Production Deploy Checklist

- [ ] All flows tested and passing locally
- [ ] All 3 services have Joëlle assigned in Square Dashboard
- [ ] `LEAD_NOTIFY_EMAIL` updated to `Studioyopaw@gmail.com`
- [ ] `PAYMENT_NOTIFY_EMAIL` updated to `Studioyopaw@gmail.com`
- [ ] `SQUARE_WEBHOOK_SIGNATURE_KEY` set (register webhook at Square Developer Console)
- [ ] `git push` → Vercel auto-deploys
- [ ] Smoke-test one booking on production (then refund)
