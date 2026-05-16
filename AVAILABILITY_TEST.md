# Availability Fix — Test Checklist

## What was broken
- `/api/availability` returned 500
- Square error: "Search did not find a team member who performs the selected service variation"
- Root cause 1: Team member not assigned to service in Square Dashboard
- Root cause 2: BOM character (`﻿`) prepended to `VITE_SQUARE_TEAM_MEMBER_ID` env var

## Fixes applied
- [x] Square Dashboard: team member assigned to all service variations
- [x] `api/availability.ts`: strips BOM from query params, passes `teamMemberIdFilter`
- [x] `src/hooks/useSquareAvailability.ts`: forwards `teamMemberId` to API
- [x] `src/App.tsx`: derives `currentTeamMemberId` and passes to hook
- [x] `src/lib/squareServices.ts`: `stripBom()` applied to all env var IDs
- [ ] Code changes committed and deployed

---

## Manual Test Steps

### 1. Availability API — direct call
Open in browser (replace dates if needed):
```
https://studio-yopaw.vercel.app/api/availability?serviceVariationId=UFR52E7LXZ7JT4FEGCVLMAWK&startDate=2026-05-16&endDate=2026-06-15&teamMemberId=TMQ833hLdwAMWKo7
```
**Expected:** `{ "availabilities": [ ... ] }` (array, may be empty if no slots configured)  
**Failure:** `{ "error": "Failed to fetch availability" }` or Square 400 error in logs

### 2. Booking flow — date picker loads
1. Go to https://studio-yopaw.vercel.app
2. Click "Book a Class" → select **Regular Class**
3. Proceed past the mat step to the **date picker**
4. **Expected:** Calendar shows dates with available slots (not a blank/error state)

### 3. Time slot modal
1. Click on an available date in the calendar
2. **Expected:** Modal opens with time slots (e.g. 10:30, 12:00, 13:30, 15:00)
3. **Expected:** Each slot shows `seatsRemaining > 0`

### 4. Check Vercel function logs
After any booking flow visit, check Vercel Dashboard → Logs:
- No `availability error` entries
- No `FUNCTION_INVOCATION_FAILED` for `/api/availability`

---

## Verify env vars are clean (no BOM)

Run in terminal:
```powershell
! Select-String -Path .env.local -Pattern "VITE_SQUARE_TEAM_MEMBER_ID"
```
Value should start exactly with `TM`, not with an invisible character before it.

Also check in Vercel Dashboard → Settings → Environment Variables:
- `VITE_SQUARE_TEAM_MEMBER_ID` value starts with `TM` (no leading space or invisible char)
- `VITE_SQUARE_YIN_VARIATION_ID` starts with the correct ID character
- `SQUARE_ACCESS_TOKEN` is set and correct for production environment

---

## If still failing after deploy

Check Vercel function log for the actual Square error body — it will be logged as `availability error <SquareError>`.

| Square error detail | Fix |
|---|---|
| "team member who performs the selected service variation" | Re-check Square Dashboard → Appointments → Services → team member assigned |
| "Invalid location" | Check `SQUARE_LOCATION_ID` server env var matches production |
| "Unauthorized" | Check `SQUARE_ACCESS_TOKEN` is production token and `SQUARE_ENVIRONMENT=production` |
| "serviceVariationId not found" | Service variation ID in Vercel env var is wrong — re-copy from Square Dashboard |
