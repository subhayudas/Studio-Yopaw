# Square Integration — What Was Done via Code

Everything below was done programmatically to minimize Square Dashboard dependence.

---

## 1. Seat limits enforced in code

**Goal:** Limit Regular Class to 15 seats without relying on a Square Dashboard setting that doesn't surface cleanly on Appointments Plus.

**Files changed:**

`api/_config.ts` — single source of truth for seat cap:
```ts
export const MAX_SEATS = 15
```

`api/availability.ts` — fetches open slots AND existing bookings in parallel, counts bookings per slot, strips full slots, returns `seatsRemaining` per slot:
```ts
const [availResult, bookingsResult] = await Promise.all([
  square.bookings.searchAvailability({ ... }),
  square.bookings.list({ locationId, startAtMin, startAtMax }),
])
// count, filter, return seatsRemaining
```

`api/booking.ts` — checks seat count again right before creating the booking (race condition guard — two users clicking simultaneously):
```ts
const slotBookings = await square.bookings.list({ locationId, startAtMin: startAt, startAtMax: slotEnd })
const taken = slotBookings.bookings.filter(b => b.startAt === startAt && b.status !== 'CANCELLED').length
if (taken >= MAX_SEATS) return res.status(409).json({ error: 'This class is full' })
```

`src/hooks/useSquareAvailability.ts` — `SquareSlot` type now includes `seatsRemaining: number` so the UI can display "X spots left".

---

## 2. Service IDs moved from hardcoded strings to env vars

**Goal:** No more copy-pasting IDs from the Dashboard into code.

`src/lib/squareServices.ts` — all IDs now read from `VITE_*` env vars:
```ts
yin: {
  serviceVariationId: import.meta.env.VITE_SQUARE_YIN_VARIATION_ID ?? '',
  serviceVariationVersion: Number(import.meta.env.VITE_SQUARE_YIN_VARIATION_VERSION ?? 0),
  teamMemberId: import.meta.env.VITE_SQUARE_TEAM_MEMBER_ID ?? '',
  amountCents: 4600,   // was wrongly 3500 — fixed to match $46 CAD price
  maxSeats: 15,
}
```

---

## 3. Setup script — creates Square catalog service and prints all IDs

**Goal:** Run once, get all Square IDs printed, paste into `.env.local`. No Dashboard navigation needed for service creation.

**Command:**
```
npx tsx scripts/setup-square.ts
```

**What it does:**
1. Loads `.env.local` without a dotenv dependency (native `fs.readFileSync`)
2. Lists active team members and prints their IDs
3. Checks if an `APPOINTMENTS_SERVICE` catalog item already exists
4. If not, creates one ("Regular Puppy Yoga", 60 min, $46 CAD, bookable online)
5. Prints the exact lines to paste into `.env.local`

**Output from first run:**
```
VITE_SQUARE_YIN_VARIATION_ID=MBZEWAOGCQF55XHSABSZZSHF
VITE_SQUARE_YIN_VARIATION_VERSION=1778908161422
VITE_SQUARE_TEAM_MEMBER_ID=TMhDF7_-c7iCvXgv
```

**SDK method discovered via inspection (wrong docs):**
```
# catalog.upsertObject does NOT exist in SDK v44
# correct method is:
square.catalog.object.upsert({ ... })

# discovered with:
node -e "const{SquareClient,SquareEnvironment}=require('square'); \
  const s=new SquareClient({token:'x',environment:SquareEnvironment.Sandbox}); \
  console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(s.catalog)))"
```

---

## 4. Location ID and App ID fetched via API

**Goal:** Fill in `SQUARE_LOCATION_ID` and `VITE_SQUARE_LOCATION_ID` without going to the Dashboard.

**Command:**
```
node --env-file=.env.local -e "const{SquareClient,SquareEnvironment}=require('square'); \
  const s=new SquareClient({token:process.env.SQUARE_ACCESS_TOKEN,environment:SquareEnvironment.Sandbox}); \
  s.locations.list().then(r=>r.locations?.forEach(l=>console.log(l.id+'|'+l.name+'|'+l.status)))"
```

**Output:** `L202ENK9N2JFP | Default Test Account | ACTIVE`

`VITE_SQUARE_APP_ID` was already in `.env.local` as `SANDBOX_APPLICATION_ID` — just copied the value across.

---

## Current `.env.local` state

| Variable | Status |
|---|---|
| `SQUARE_ENVIRONMENT` | `sandbox` |
| `SQUARE_ACCESS_TOKEN` | set |
| `SQUARE_LOCATION_ID` | `L202ENK9N2JFP` — set via API |
| `VITE_SQUARE_APP_ID` | set (sandbox app ID) |
| `VITE_SQUARE_LOCATION_ID` | `L202ENK9N2JFP` — set via API |
| `VITE_SQUARE_YIN_VARIATION_ID` | set via setup script |
| `VITE_SQUARE_YIN_VARIATION_VERSION` | set via setup script |
| `VITE_SQUARE_TEAM_MEMBER_ID` | set via setup script |
| `RESEND_API_KEY` | **still placeholder** — get from resend.com |
| `LEAD_NOTIFY_EMAIL` | placeholder — update to real email |
| `PAYMENT_NOTIFY_EMAIL` | placeholder — update to real email |

---

## What still requires Dashboard (API hard limits)

| Task | Why |
|---|---|
| Assign team member to service | Square explicitly blocks this via API — must be done in Dashboard → Appointments → Services → assign member |
| Business hours | Set in Dashboard → Appointments → Settings |
| Production go-live | Swap `SQUARE_ENVIRONMENT=production`, replace all IDs with production equivalents, re-run setup script against production |

---

## To test end-to-end (sandbox)

1. Add your Resend key to `.env.local`
2. Run `vercel dev`
3. Go through the booking flow
4. Use sandbox card: `4111 1111 1111 1111`, CVV `111`, any future expiry
5. Check that confirmation email arrives at `LEAD_NOTIFY_EMAIL`
