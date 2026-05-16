# Studio Yopaw — Square Integration: Remaining Setup

> **Status check from your `.env` file**
>
> | Variable | Status |
> |---|---|
> | `SQUARE_ACCESS_TOKEN` | ✅ Filled (sandbox token) |
> | `SQUARE_ENVIRONMENT` | ✅ `sandbox` |
> | `SANDBOX_APPLICATION_ID` | ✅ Filled — but stored in the **wrong variable name** (see Step 1) |
> | `SQUARE_LOCATION_ID` | ❌ Still placeholder |
> | `VITE_SQUARE_APP_ID` | ❌ Still placeholder |
> | `VITE_SQUARE_LOCATION_ID` | ❌ Still placeholder |
> | `RESEND_API_KEY` | ❌ Still placeholder |
> | `SQUARE_WEBHOOK_SIGNATURE_KEY` | ❌ Empty (fill after Vercel deploy) |

---

## ⚠️ URGENT: Fix secret exposure before anything else

Your real `SQUARE_ACCESS_TOKEN` is in `.env` — which is **not** gitignored.
If you `git push` now, your sandbox token becomes public.

**Fix — rename the file right now:**

```powershell
# In your project root (PowerShell)
Rename-Item .env .env.local
```

Vite loads `.env.local` identically, and it matches the `*.local` rule already in your `.gitignore`. After renaming, verify with:

```powershell
git status   # .env.local should NOT appear in the list
```

If it still shows, add this line to `.gitignore`:

```
.env.local
```

---

## Step 1 — Fix `VITE_SQUARE_APP_ID` (2 minutes)

You already have your sandbox Application ID stored as `SANDBOX_APPLICATION_ID`. You need to copy that value into the right variable that the browser uses.

Open `.env.local` and change:

```env
# BEFORE
SANDBOX_APPLICATION_ID=sandbox-sq0idb-rL2Y-0H_Mj7Lal9jI4dbBw
VITE_SQUARE_APP_ID=sq0idp-xxxxxxxxxxxxxxxxxxxx

# AFTER — copy the sandbox ID into VITE_SQUARE_APP_ID, delete the other line
VITE_SQUARE_APP_ID=sandbox-sq0idb-rL2Y-0H_Mj7Lal9jI4dbBw
```

> **Why:** The browser-side Square Web Payments SDK (`PaymentForm` / `CreditCard` in the booking flow) reads `VITE_SQUARE_APP_ID` at runtime. In sandbox it must be the `sandbox-sq0idb-...` ID, not the production `sq0idp-...` one.

---

## Step 2 — Get your sandbox Location ID (5 minutes)

Run this one-liner in PowerShell — it calls the Square sandbox API with your token and returns all locations:

```powershell
$token = "EAAAl-6b7MQ-gsGUAFy2xB_8hJizixgOvg2PY2e3-fKJgpxbAU6jXhwGNYo9SDiB"
Invoke-RestMethod `
  -Uri "https://connect.squareupsandbox.com/v2/locations" `
  -Headers @{ Authorization = "Bearer $token"; "Square-Version" = "2025-01-23" } |
  ConvertTo-Json -Depth 5
```

You'll get back something like:

```json
{
  "locations": [
    {
      "id": "L1234ABCD5678",
      "name": "Default Test Account",
      ...
    }
  ]
}
```

Copy the `id` value. Then in `.env.local` set **both**:

```env
SQUARE_LOCATION_ID=L1234ABCD5678
VITE_SQUARE_LOCATION_ID=L1234ABCD5678
```

> `SQUARE_LOCATION_ID` is used by the serverless API functions (Node.js).
> `VITE_SQUARE_LOCATION_ID` is used by the browser-side Web Payments SDK.
> They must be the same value.

---

## Step 3 — Configure Square Dashboard (20–40 minutes)

This is the most important step. The Bookings API won't return any availability until the seller account has services, a team member, and online booking enabled.

### 3a. Go to Square Dashboard (sandbox)

Open: `https://squareupsandbox.com/dashboard`

Sign in with the **same** account you used to create the developer app. This is the sandbox seller account — it's separate from `developer.squareup.com`.

> If you see a blank seller account, that's expected — sandbox starts fresh.

### 3b. Confirm your plan level

Square's Bookings API with seller-level write access requires **Appointments Plus ($35 CAD/mo)** or Premium.

- Dashboard → **Account & Settings** → **Subscription**
- Check if Appointments Plus is active
- If not, you won't be able to create bookings via API in production
- **In sandbox, API calls still work regardless of plan** — plan enforcement only matters in production

### 3c. Add a location (if none exists)

- Dashboard → **Account & Settings** → **Business locations**
- Click **Add location** if none is listed
- Give it a name (e.g. "Studio Yopaw — Montreal")
- Set address, timezone (**America/Toronto** for Montreal), and business hours
- Save

### 3d. Create your three services

- Dashboard → **Items** → **Services**
- Click **Create service** for each:

| Service name | Duration | Price |
|---|---|---|
| Yin Yoga — Drop-in | 60 min | $35.00 CAD |
| Gentle Yoga — Private Group | 60 min | $35.00 CAD per person |
| Corporate Yoga Session | 90 min | $150.00 CAD (flat) |

For each service:
1. Set **"Available for booking online"** to ON
2. Under **"Max seats"** — set to `20` for Yin Yoga (class size), leave at 1 for others
3. Save

### 3e. Add a team member

- Dashboard → **Team** → **Team members** → **Add team member**
- Name: use a real staff name or "Studio Instructor"
- Under **Appointments** → assign them to all three services you just created
- Set their **availability hours** (e.g. Sat–Sun 9am–5pm) — the Bookings API only returns slots within these hours
- Save

### 3f. Enable online booking for the location

- Dashboard → **Appointments** → **Online booking**
- Toggle **"Enable online booking"** to ON for your location
- Save

> Without this toggle, `SearchAvailability` returns an empty array even with valid services and team members.

---

## Step 4 — Get service variation IDs and team member ID (10 minutes)

After creating your services, run these two API calls to get the IDs you need.

### 4a. Get service variation IDs

```powershell
$token = "EAAAl-6b7MQ-gsGUAFy2xB_8hJizixgOvg2PY2e3-fKJgpxbAU6jXhwGNYo9SDiB"
Invoke-RestMethod `
  -Uri "https://connect.squareupsandbox.com/v2/catalog/list?types=ITEM_VARIATION" `
  -Headers @{ Authorization = "Bearer $token"; "Square-Version" = "2025-01-23" } |
  ConvertTo-Json -Depth 8
```

Look for objects where `item_variation_data.item_variation_data.service_duration` is set (those are your bookable service variations). Note the `id` and `version` for each.

**Alternatively — search for your specific services:**

```powershell
$body = '{"object_types":["ITEM"],"include_related_objects":true}'
Invoke-RestMethod `
  -Uri "https://connect.squareupsandbox.com/v2/catalog/search" `
  -Method POST `
  -Headers @{
    Authorization  = "Bearer $token"
    "Square-Version" = "2025-01-23"
    "Content-Type" = "application/json"
  } `
  -Body $body |
  ConvertTo-Json -Depth 10
```

From the response, for each service item find:
- `object.catalog_v1_ids` or `object.id` (the item ID)
- `object.item_data.variations[0].id` → this is the **service variation ID** you need
- `object.item_data.variations[0].version` → the **version** number

### 4b. Get team member ID

```powershell
$token = "EAAAl-6b7MQ-gsGUAFy2xB_8hJizixgOvg2PY2e3-fKJgpxbAU6jXhwGNYo9SDiB"
Invoke-RestMethod `
  -Uri "https://connect.squareupsandbox.com/v2/bookings/team-member-booking-profiles?location_id=YOUR_LOCATION_ID" `
  -Headers @{ Authorization = "Bearer $token"; "Square-Version" = "2025-01-23" } |
  ConvertTo-Json -Depth 5
```

Note the `team_member_id` from the response. If this returns empty, the team member isn't assigned to services or availability isn't set (go back to Step 3e).

### 4c. Fill in `src/lib/squareServices.ts`

Open the file and replace the three `FILL_IN_FROM_SQUARE_DASHBOARD` entries:

```typescript
export const SQUARE_SERVICE_VARIATIONS = {
  yin: {
    serviceVariationId: 'PASTE_YIN_YOGA_VARIATION_ID_HERE',
    serviceVariationVersion: 1234567890,          // the version number from the catalog API
    teamMemberId: 'PASTE_TEAM_MEMBER_ID_HERE',
    amountCents: 3500,                            // $35.00 CAD
  },
  gentle: {
    serviceVariationId: 'PASTE_GENTLE_YOGA_VARIATION_ID_HERE',
    serviceVariationVersion: 1234567890,
    teamMemberId: 'PASTE_TEAM_MEMBER_ID_HERE',
    amountCents: 3500,
  },
  corporate: {
    serviceVariationId: 'PASTE_CORPORATE_VARIATION_ID_HERE',
    serviceVariationVersion: 1234567890,
    teamMemberId: 'PASTE_TEAM_MEMBER_ID_HERE',
    amountCents: 15000,                           // $150.00 CAD
  },
}
```

---

## Step 5 — Set up Resend for emails (5 minutes)

1. Go to **[resend.com](https://resend.com)** → sign up (free — 3,000 emails/month)
2. Dashboard → **API Keys** → **Create API Key** → copy it
3. In `.env.local`:

```env
RESEND_API_KEY=re_YOUR_REAL_KEY_HERE
LEAD_NOTIFY_EMAIL=your-real-inbox@example.com
PAYMENT_NOTIFY_EMAIL=your-real-inbox@example.com
```

> **Domain note:** Resend's free tier lets you send from `onboarding@resend.dev` without domain verification. Our API code sends from `noreply@studio-yopaw.com` — if you haven't verified `studio-yopaw.com` in Resend yet, change the `from` address in `api/booking.ts`, `api/inquiry.ts`, and `api/square-webhook.ts` to `onboarding@resend.dev` for now. You can set up the domain later.

---

## Step 6 — Verify availability locally (5 minutes)

Before deploying, confirm the Bookings API actually returns slots.

```powershell
$token = "EAAAl-6b7MQ-gsGUAFy2xB_8hJizixgOvg2PY2e3-fKJgpxbAU6jXhwGNYo9SDiB"
$body = @'
{
  "query": {
    "filter": {
      "start_at_range": {
        "start_at": "2026-05-15T00:00:00Z",
        "end_at": "2026-07-15T23:59:59Z"
      },
      "location_id": "YOUR_LOCATION_ID",
      "segment_filters": [
        {
          "service_variation_id": "YOUR_YIN_YOGA_VARIATION_ID"
        }
      ]
    }
  }
}
'@

Invoke-RestMethod `
  -Uri "https://connect.squareupsandbox.com/v2/bookings/availability/search" `
  -Method POST `
  -Headers @{
    Authorization    = "Bearer $token"
    "Square-Version" = "2025-01-23"
    "Content-Type"   = "application/json"
  } `
  -Body $body |
  ConvertTo-Json -Depth 10
```

**Expected:** `availabilities` array with time slots.

**If empty:** Go back to Step 3 — the team member's availability hours may not overlap with the date range, or online booking isn't enabled.

---

## Step 7 — Deploy to Vercel (15 minutes)

### 7a. Push to GitHub

```powershell
git add .
git status          # confirm .env.local is NOT listed
git commit -m "Add Square integration"
git push
```

### 7b. Create Vercel project

1. Go to **[vercel.com](https://vercel.com)** → **New Project** → import your GitHub repo
2. Framework preset: **Vite** (auto-detected)
3. Click **Deploy** — don't worry about env vars yet, first deploy will fail on API calls but the site will load fine

### 7c. Add environment variables in Vercel

Go to: **Project → Settings → Environment Variables**

Add every variable from your `.env.local`, but use **Preview + Production** scope for all:

| Key | Value |
|---|---|
| `SQUARE_ENVIRONMENT` | `sandbox` |
| `SQUARE_ACCESS_TOKEN` | `EAAAl-6b7MQ-...` (your sandbox token) |
| `SQUARE_LOCATION_ID` | Your real location ID |
| `VITE_SQUARE_APP_ID` | `sandbox-sq0idb-rL2Y-...` |
| `VITE_SQUARE_LOCATION_ID` | Your real location ID |
| `RESEND_API_KEY` | Your Resend key |
| `LEAD_NOTIFY_EMAIL` | Your inbox |
| `PAYMENT_NOTIFY_EMAIL` | Your inbox |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | *(leave blank for now — fill in Step 8)* |

After adding vars → **Redeploy** (Deployments tab → Redeploy last deployment).

### 7d. Confirm API functions are live

Visit these URLs in your browser (replace with your real Vercel domain):

```
https://studio-yopaw.vercel.app/api/availability?serviceVariationId=TEST&startDate=2026-05-15&endDate=2026-07-15
```

You should get `{"availabilities":[...]}` or an error JSON — either way, a JSON response confirms the serverless function is running. A 405 means the function deployed but you hit it with the wrong method (normal for GET-only endpoints tested as POST, etc.).

---

## Step 8 — Register the webhook (10 minutes)

> **Do this after Vercel is deployed** — Square needs to be able to reach your live HTTPS URL.

### 8a. Add the webhook in Developer Console

1. Go to **[developer.squareup.com](https://developer.squareup.com)** → your `Studio Yopaw` app
2. Click **Webhooks** in the left nav
3. Click **Add subscription** (or **Add notification URL**)
4. Fill in:
   - **URL:** `https://studio-yopaw.vercel.app/api/square-webhook`
   - **API version:** `2025-01-23` (or whatever the latest shows)
   - **Events to subscribe:**
     - `booking.created`
     - `booking.cancelled`
     - `payment.completed`
     - `payment.failed`
     - `customer.created`
5. Click **Save**
6. After saving, click the subscription → copy the **Signature key**

### 8b. Add the signature key to Vercel

1. Vercel → Project → Settings → Environment Variables
2. Add `SQUARE_WEBHOOK_SIGNATURE_KEY` = *(the key you just copied)*
3. **Redeploy** once more so the function picks it up

### 8c. Send a test event

In Developer Console → Webhooks → your subscription → **Send test event** → pick `payment.completed`.

Check **Vercel → Project → Functions** tab (or the Logs tab) — you should see a `200 OK` response from `api/square-webhook`.

> **Note on raw body signature validation:** Our webhook handler uses `JSON.stringify(req.body)` which works for most payloads. If you see 403s on real events (not test events), it means Vercel's body parser is re-serializing the JSON differently from the original bytes. The fix is covered in the plan's Phase 3.4 raw body note — for sandbox testing this is fine.

---

## Step 9 — End-to-end sandbox test (20 minutes)

### 9a. Run locally with `vercel dev`

```powershell
npx vercel dev
```

This runs the Vite frontend AND the serverless functions together on `http://localhost:3000`. It reads your `.env.local` automatically.

> If prompted to link to a Vercel project, select your deployed project. This syncs remote env vars to local.

### 9b. Test the full Yin Yoga booking flow

1. Open `http://localhost:3000/#book`
2. Click **Yin Yoga (Drop-in)**
3. Select mat option
4. **Date picker** — you should now see real dates from Square instead of hardcoded weekends
   - If the list is empty, the availability API isn't returning slots — re-check Step 3 and Step 6
5. Pick a date → pick a time slot in the modal
6. Fill in contact form + accept waiver
7. Click **Book Spot** — the Square card form appears
8. Enter the sandbox test card:
   - **Card number:** `4111 1111 1111 1111`
   - **Expiry:** any future date (e.g. `12/28`)
   - **CVV:** `111`
   - **Postal code:** any 5 digits (e.g. `10001`)
9. Click the pay button inside the card form

**Expected outcomes:**
- ✅ Success screen appears
- ✅ Booking visible in Square Dashboard (sandbox) → Appointments
- ✅ Payment visible in Square Dashboard (sandbox) → Payments
- ✅ Email arrives at `LEAD_NOTIFY_EMAIL`

### 9c. Test the inquiry flows

- **Gentle Yoga:** go through people → date → contact → submit → should show "request received" and send email
- **Corporate:** same flow → submit → request received + email

### 9d. Test a declined card

Use card `4000 0000 0000 0002` — the booking API should return an error and the UI should show the error message above the card form (the red text).

---

## Step 10 — Go live checklist (when ready)

When the client is ready to take real payments, do this in order:

1. **Confirm Appointments Plus** is active on the real Square seller account ($35 CAD/mo)
2. In Vercel → Settings → Environment Variables, update:

   | Variable | New value |
   |---|---|
   | `SQUARE_ENVIRONMENT` | `production` |
   | `SQUARE_ACCESS_TOKEN` | Production access token (from Developer Console → Credentials → Production) |
   | `VITE_SQUARE_APP_ID` | Production Application ID (`sq0idp-...` format, from Credentials page) |
   | `VITE_SQUARE_LOCATION_ID` | Production location ID |
   | `SQUARE_LOCATION_ID` | Production location ID |

3. Register a **new webhook subscription** in Developer Console pointing to the same Vercel URL but using the production API version — update `SQUARE_WEBHOOK_SIGNATURE_KEY`
4. Run one real `$0.01` test transaction to confirm end-to-end
5. Update prices in `src/lib/squareServices.ts` if different from sandbox

---

## Current `.env.local` target state

Here is what your final `.env.local` should look like after completing all steps:

```env
# Square API — server-only
SQUARE_ENVIRONMENT=sandbox
SQUARE_ACCESS_TOKEN=EAAAl-6b7MQ-gsGUAFy2xB_8hJizixgOvg2PY2e3-fKJgpxbAU6jXhwGNYo9SDiB
SQUARE_LOCATION_ID=<from Step 2>
SQUARE_WEBHOOK_SIGNATURE_KEY=<from Step 8>

# Square — browser (Web Payments SDK)
VITE_SQUARE_APP_ID=sandbox-sq0idb-rL2Y-0H_Mj7Lal9jI4dbBw
VITE_SQUARE_LOCATION_ID=<same as SQUARE_LOCATION_ID>

# Email
RESEND_API_KEY=<from Step 5>
LEAD_NOTIFY_EMAIL=<your real inbox>
PAYMENT_NOTIFY_EMAIL=<your real inbox>
```

---

## Quick reference — what calls what

```
Browser (React)
  └─ useSquareAvailability → GET /api/availability → Square SearchAvailability (sandbox)
  └─ PaymentForm/CreditCard → tokenizes card in browser → nonce token
  └─ fetch('/api/booking') → POST /api/booking
                                ├─ Square Customers API (find/create)
                                ├─ Square Bookings API (create booking)
                                ├─ Square Payments API (charge nonce)
                                └─ Resend (email to studio)
  └─ fetch('/api/inquiry') → POST /api/inquiry → Resend (email to studio)

Square → POST /api/square-webhook → validate HMAC → Resend (email to studio)
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Date picker shows empty list | Online booking not enabled, or team member has no availability hours | Step 3f, Step 3e |
| `availabilities` API returns empty | Service variation ID wrong, or no matching team member | Step 4a, Step 4b |
| Card form doesn't render | `VITE_SQUARE_APP_ID` is still placeholder | Step 1 |
| 403 on webhook | Signature key not set or wrong | Step 8b |
| `UNAUTHORIZED` from Square API | Mixing sandbox token with production URL or vice versa | Check `SQUARE_ENVIRONMENT` |
| Booking created but payment fails | `amountCents` is `0` or `serviceVariationId` mismatch | Step 4c |
| Emails not arriving | `RESEND_API_KEY` placeholder, or `from` domain not verified | Step 5 |
