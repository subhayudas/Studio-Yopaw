# Next Steps — Studio Yopaw

## 1. One Dashboard action (blocks everything else)

> Square Dashboard → Appointments → Services → Regular Puppy Yoga → assign team member

This is the only step that cannot be done via API. Without it, `searchAvailability` returns no slots.

---

## 2. Sandbox end-to-end test

```
vercel dev
```

Walk through the full Regular Class booking flow:

- [ ] Pick a date — slots appear (proves availability API + team member assignment worked)
- [ ] Slot shows seat count (proves `seatsRemaining` is wired through)
- [ ] Fill contact form + accept waiver
- [ ] Pay with sandbox card: `4111 1111 1111 1111` CVV `111` any future expiry
- [ ] Confirmation screen appears
- [ ] Email arrives at `leadpipecrm@gmail.com` (proves Resend key works)
- [ ] Book the same slot 15 times → 16th attempt should return "This class is full"

---

## 3. Show seat count in the UI

`seatsRemaining` is now returned by the API and stored in `SquareSlot` but not yet displayed anywhere in the booking UI. Add it to the time slot modal in `src/App.tsx` so users can see e.g. **"3 spots left"**.

This is a polish step — not blocking the test.

---

## 4. Production go-live

When sandbox test passes, switch to production:

### 4a. Re-run setup script against production
Update `.env.local` temporarily with production credentials, then:
```
npx tsx scripts/setup-square.ts
```
Copy the printed production variation ID + version into Vercel env vars.

### 4b. Set these in Vercel Dashboard → Settings → Environment Variables

| Variable | Value |
|---|---|
| `SQUARE_ENVIRONMENT` | `production` |
| `SQUARE_ACCESS_TOKEN` | production token from Square Developer Console |
| `SQUARE_LOCATION_ID` | production location ID (from setup script output) |
| `VITE_SQUARE_APP_ID` | production app ID (from Square Developer Console) |
| `VITE_SQUARE_LOCATION_ID` | same as `SQUARE_LOCATION_ID` |
| `VITE_SQUARE_YIN_VARIATION_ID` | from setup script run against production |
| `VITE_SQUARE_YIN_VARIATION_VERSION` | from setup script run against production |
| `VITE_SQUARE_TEAM_MEMBER_ID` | from setup script run against production |
| `RESEND_API_KEY` | already have it |
| `LEAD_NOTIFY_EMAIL` | real studio email |
| `PAYMENT_NOTIFY_EMAIL` | real studio email |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | from step 4c |

### 4c. Register webhook in Square
Square Developer Console → your app → Webhooks → Add endpoint:
```
https://www.studioyopaw.ca/api/square-webhook
```
Events to subscribe: `payment.completed`, `customer.created`
Copy the signature key → set as `SQUARE_WEBHOOK_SIGNATURE_KEY` in Vercel.

### 4d. Assign team member to production service in Dashboard
Same as step 1, but in the production Square account.

### 4e. Deploy
```
git push
```
Vercel auto-deploys on push to main.

---

## 5. After launch

- [ ] Update `LEAD_NOTIFY_EMAIL` / `PAYMENT_NOTIFY_EMAIL` to Joëlle's real address (`Studioyopaw@gmail.com`)
- [ ] Verify refund policy email link works in both EN and FR
- [ ] Set up custom email sender domain in Resend so emails come from `@studioyopaw.ca` instead of the default
- [ ] Monitor first few real bookings manually to confirm Square → email pipeline is solid
