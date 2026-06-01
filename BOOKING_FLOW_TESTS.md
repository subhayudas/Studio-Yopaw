# Booking Flow — Manual Test Plan

Run these tests on `localhost:5173` (vite dev). For payment tests use Square sandbox card numbers.
Mark each ✅ pass / ❌ fail / ⏭ skipped.

---

## 0. Setup

- [ ] `npm run dev` starts without errors
- [ ] `.env.local` has valid Square sandbox credentials
- [ ] Navigate to `/#pricing` — booking card is visible

---

## 1. Class Chooser (all flows start here)

| # | Test | Expected |
|---|---|---|
| 1.1 | Page loads | Shows 3 choice cards: Regular Class, Private Event, Corporate |
| 1.2 | Progress bar | Shows at 25% on `chooseClass` screen |
| 1.3 | Click Regular Class | Advances to mat step |
| 1.4 | Click Private Event | Advances to people step |
| 1.5 | Click Corporate | Advances to people step (corporate variant) |
| 1.6 | Switch language (EN→FR) | All 3 card labels update instantly, no reload |

---

## 2. Regular Class (Yin) — Happy Path

### 2a. Mat step
| # | Test | Expected |
|---|---|---|
| 2.1 | Step renders | Shows "Do you have your own mat?" question with Yes / No buttons |
| 2.2 | Progress bar | ~35% |
| 2.3 | Click "No — rent mat ($5)" | Advances to date step; `needsMatRental = true` |
| 2.4 | Click "Yes — I have my own" | Advances to date step; `needsMatRental = false` |
| 2.5 | Back button from mat | Returns to class chooser |

### 2b. Date step
| # | Test | Expected |
|---|---|---|
| 2.6 | Date step renders | Shows calendar rows for upcoming session dates |
| 2.7 | Progress bar | ~62% |
| 2.8 | Dog breed badge | Each date row shows breed name badge |
| 2.9 | Click a date with seats | Opens time modal |
| 2.10 | Time modal lists slots | Shows available time slots for that date |
| 2.11 | Full slot (0 seats) | Not shown (filtered out) |
| 2.12 | Click a time | Modal closes, advances to contact step |
| 2.13 | Click outside modal | Modal closes, stays on date step |
| 2.14 | Back from date step | Returns to mat step |
| 2.15 | All dates fully booked | Calendar shows no available dates (or empty state message) |

### 2c. Contact step
| # | Test | Expected |
|---|---|---|
| 2.16 | Contact step renders | Name, email, phone fields + waiver checkbox |
| 2.17 | Progress bar | ~80% |
| 2.18 | Submit with all fields empty | Form validation prevents submission |
| 2.19 | Submit with invalid email format | Form validation prevents submission |
| 2.20 | Submit without checking waiver | Form does NOT advance |
| 2.21 | Open waiver modal | Clicking waiver link opens the legal modal |
| 2.22 | Waiver modal closes on Escape | Modal dismisses |
| 2.23 | Waiver modal closes on backdrop click | Modal dismisses |
| 2.24 | Check waiver + submit valid form | Advances to payment step; Zapier lead fired (check network tab) |
| 2.25 | Back from contact | Returns to date step |

### 2d. Payment step
| # | Test | Expected |
|---|---|---|
| 2.26 | Payment step renders | Square card form appears (not config-error message) |
| 2.27 | Progress bar | ~95% |
| 2.28 | Price summary — no mat | Shows base price ($46.00) + GST + QST + total |
| 2.29 | Price summary — with mat | Shows base ($46.00) + mat rental ($5.00) + GST + QST + total |
| 2.30 | Back from payment | Returns to contact step |

### 2e. Payment — success
| # | Test | Expected |
|---|---|---|
| 2.31 | Enter valid sandbox card `4111 1111 1111 1111`, any future expiry, any CVV | Payment succeeds |
| 2.32 | Success screen | Progress at 100%, shows booking details (date, time, email) |
| 2.33 | Success — email field | Shows the email entered in contact step |
| 2.34 | "Book another" button | Resets entire flow back to class chooser |

---

## 3. Regular Class (Yin) — Payment Failure Cases

Use Square sandbox decline codes: https://developer.squareup.com/docs/testing/test-values

| # | Test | Card number | Expected error shown to user |
|---|---|---|---|
| 3.1 | Generic decline | `4000000000000002` | Generic decline message |
| 3.2 | Insufficient funds | `4000000000009995` | Insufficient funds message |
| 3.3 | CVV mismatch | `4000000000000127` | CVV failure message |
| 3.4 | Expired card | Any number, past expiry date | Expired card message |
| 3.5 | Error shown | — | Error text visible above/below payment form |
| 3.6 | Retry after error | Correct card after error | Error clears, payment succeeds |
| 3.7 | Network error during booking | (kill vite dev server briefly) | "Network error. Please try again." shown |
| 3.8 | Slot taken (race condition 409) | Complete payment after slot fills | "This time slot just filled up" message shown |

---

## 4. Private Event — Happy Path

| # | Test | Expected |
|---|---|---|
| 4.1 | People step renders | Group size stepper defaults to 2 |
| 4.2 | Progress bar | ~45% |
| 4.3 | Decrement below 2 | Minus button disabled at 2 |
| 4.4 | Increment above 20 | Plus button disabled at 20 |
| 4.5 | Set group size to 8, click Next | Advances to date step with count = 8 |
| 4.6 | Date step | Same calendar as yin — shows available dates |
| 4.7 | Pick date + time | Advances to contact step |
| 4.8 | Contact step | Name, email, phone fields — **no waiver checkbox** |
| 4.9 | Submit with empty fields | Form validation prevents submission |
| 4.10 | Submit with invalid email | Form validation prevents submission |
| 4.11 | Submit button while loading | Button text changes to "Sending…" and is disabled |
| 4.12 | Successful submission | Advances to "request received" success screen (clock icon) |
| 4.13 | Success screen content | Shows "We'll be in touch" message (not booking confirmation) |
| 4.14 | No Square payment step | Payment card form is **never shown** for private event |
| 4.15 | Admin email received | Check `LEAD_NOTIFY_EMAIL` inbox — email contains name, email, phone, date, time (human-readable), group size |
| 4.16 | Admin email date format | Date shows as e.g. "June 14, 2026" not "2026-06-14" |
| 4.17 | Admin email time format | Time shows as e.g. "10:30 AM (Montréal)" not raw ISO string |
| 4.18 | Back from contact | Returns to date step |
| 4.19 | Back from date | Returns to people step |
| 4.20 | Back from people | Returns to class chooser |

---

## 5. Private Event — Failure / Edge Cases

| # | Test | Expected |
|---|---|---|
| 5.1 | API returns 500 | Error message shown on contact form: "Failed to send your request. Please try again." |
| 5.2 | Network error (server offline) | Same error message shown |
| 5.3 | Retry after failure | Error clears, user can resubmit |
| 5.4 | Submit button re-enables after failure | Yes — user can retry |
| 5.5 | Double-click submit | Only one request fired (button disabled while loading) |

---

## 6. Corporate — Happy Path

| # | Test | Expected |
|---|---|---|
| 6.1 | Corporate people step | Same stepper as private event, defaults to 2 |
| 6.2 | Progress bar | ~45% |
| 6.3 | Min/max group size | Same 2–20 limits |
| 6.4 | Date step | Calendar shown |
| 6.5 | Pick date + time | Advances to contact step |
| 6.6 | Contact step | Name, email, phone fields |
| 6.7 | Submit valid form | Button shows "Sending…", then advances to success screen |
| 6.8 | Success screen | Clock icon "request received" screen |
| 6.9 | No payment step | Square card form is **never shown** for corporate |
| 6.10 | Admin email received | Check inbox — contains all fields |
| 6.11 | "Back to home" link | Navigates to `/` |

---

## 7. Corporate — Failure / Edge Cases

| # | Test | Expected |
|---|---|---|
| 7.1 | API 500 on submit | Error shown on contact form |
| 7.2 | Network offline | Error shown |
| 7.3 | Retry after error | Works correctly |
| 7.4 | Double-click submit | Only one request (button disabled) |

---

## 8. Back Navigation — All Flows

| # | Flow | From step | Expected destination |
|---|---|---|---|
| 8.1 | Yin | mat | chooseClass |
| 8.2 | Yin | date | mat |
| 8.3 | Yin | contact | date |
| 8.4 | Yin | payment | contact |
| 8.5 | Gentle | people | chooseClass |
| 8.6 | Gentle | date | people |
| 8.7 | Gentle | contact | date |
| 8.8 | Corporate | people | chooseClass |
| 8.9 | Corporate | date | people |
| 8.10 | Corporate | contact | date |
| 8.11 | Any success screen | — | No back button shown |

---

## 9. Progress Bar

| # | Flow + Step | Expected % |
|---|---|---|
| 9.1 | chooseClass | 25% |
| 9.2 | public · mat | 35% |
| 9.3 | public · people (gentle) | 45% |
| 9.4 | corporate · people | 45% |
| 9.5 | public · date | 62% |
| 9.6 | corporate · date | 62% |
| 9.7 | public · contact | 80% |
| 9.8 | corporate · contact | 80% |
| 9.9 | public · payment (yin) | 95% |
| 9.10 | publicSuccess / corporateSuccess | 100% |

---

## 10. Internationalisation

| # | Test | Expected |
|---|---|---|
| 10.1 | Toggle EN→FR on class chooser | All labels switch to French immediately |
| 10.2 | Toggle FR→EN mid-flow (e.g. date step) | Step content switches; state (selected date etc.) is preserved |
| 10.3 | Dog breed badge in FR | Shows FR breed name |
| 10.4 | Error messages in FR | Inquiry error + payment error messages are in French |
| 10.5 | "Sending…" button in FR | Shows "Envoi en cours…" |
| 10.6 | Admin email classType in FR flow | Email still sends English class type labels (server-side, not affected by frontend lang) |

---

## 11. Regression — Sections Unrelated to Booking

| # | Test | Expected |
|---|---|---|
| 11.1 | Hero section video plays | Background video loads and autoplays |
| 11.2 | Navbar scroll behaviour | Becomes opaque after scrolling 60px |
| 11.3 | Gallery section loads | Images visible, animations trigger on scroll |
| 11.4 | FAQ accordion | Each item expands/collapses |
| 11.5 | Refund policy link in FAQ | Navigates to `/refund-policy` (EN) or `/politique-remboursement` (FR) |
| 11.6 | Footer links | All nav links scroll to correct sections |
| 11.7 | Language picker on first visit | Clears `studio-yopaw-lang` from localStorage, reload — picker modal appears |

---

## Square Sandbox Card Numbers Reference

| Card | Number |
|---|---|
| Visa — success | `4111 1111 1111 1111` |
| Generic decline | `4000 0000 0000 0002` |
| Insufficient funds | `4000 0000 0000 9995` |
| CVV failure | `4000 0000 0000 0127` |
Use expiry `12/26`, CVV `111`, postal code `12345` for all sandbox tests.
