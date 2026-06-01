# Studio Yopaw — Booking & Payment Flow

---

## Booking Flow

```
Booking Start
Choose your experience
        │
        ├─────────────────────┬─────────────────────┐
        ▼                     ▼                     ▼
  Regular Class          Private Class        Corporate Event
  Drop-in or booked    For you & your group  Team wellness &
  session                                     offsites
        │                     │                     │
        ▼                     ▼                     ▼
Do you have a         How many attendees?   How many attendees?
yoga mat?             Number picker         Number picker
Yes / No                    │                     │
(rent on site)              ▼                     ▼
        │             Inquiry Form           Inquiry Form
        ▼             Name · Email           Name · Email
Select date & time    Phone · Preferred      Phone · Company name
Calendar picker       date & time            Preferred date & time
        │             Message / special      Message / special
        ▼             request                requests
Contact information         │                     │
Name · Email · Phone        ▼                     ▼
+ Add extra attendees  Inquiry Submitted    Inquiry Submitted
  (1–10)               Team will follow up  Team will follow up
        │
        ▼
Waiver Agreement
☑ Checkbox per attendee
Must agree before payment
        │
        ▼
Payment
Price × number of attendees
Credit card / online
        │
        ▼
Booking Confirmed
Email confirmation sent
```

---

## Path Summary

| Step | Regular Class | Private Class | Corporate Event |
|---|---|---|---|
| 1 | Yoga mat? (Yes / No) | How many attendees? | How many attendees? |
| 2 | Select date & time | Inquiry form | Inquiry form (+ company name) |
| 3 | Contact info + extra attendees | Inquiry submitted | Inquiry submitted |
| 4 | Waiver agreement (all attendees) | — | — |
| 5 | Payment (card online) | — | — |
| 6 | Booking confirmed | — | — |

> **Private Class and Corporate Event** do not go through online payment. The team reviews the inquiry and follows up directly.

---

## Payment Flow (Regular Class only)

Triggered after all waivers are checked and the user clicks **Confirm & proceed to payment**.

> Up to 4 extra people. Each card has its own waiver checkbox. All must be checked to proceed.

```
Confirm & proceed to payment
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│                   Square API — fires on confirm             │
│                                                             │
│        Try: create client per attendee                      │
│        Square Customers API — one call each                 │
│                                                             │
│          success ◄──────────────────► fallback             │
│              │                              │               │
│              ▼                              ▼               │
│   If success: all clients          If API limits:           │
│   created                          fallback                 │
│   Book appointment —               Create primary           │
│   attendee count = total people    client only              │
│              │                              │               │
│              └──────────────┬───────────────┘               │
│                             ▼                               │
│           Booking note on appointment (always)              │
│     Total attendees: N · Names · Waiver confirmed: yes      │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
Payment
Price × total attendees — charged via Square
        │
        ▼
Booking Confirmed
```

---

## Square API Steps Detail

| Step | Action | Notes |
|---|---|---|
| 1 | Create customer per attendee | Square Customers API — one call each |
| 1a (fallback) | Create primary client only | Used when API rate limit is hit |
| 2 | Create booking (appointment) | `attendee count` = total people in group |
| 3 | Add booking note | Always written: total attendees, names, waiver status |
| 4 | Charge payment | `price × total attendees` via Square Payments API |
| 5 | Booking confirmed | Confirmation sent to user |

---

## Key Rules

- **Mat rental** is offered at booking for Regular Class (on-site, adds $5 to total).
- **Waiver** is required for every attendee before payment can proceed — one checkbox per person.
- **Extra attendees** (up to 10 additional beyond the primary booker) can be added at the contact step.
- **Private and Corporate** flows are inquiry-only — no online payment is collected.
- **Fallback behaviour:** if Square's API limits prevent creating a customer record for every attendee, the system falls back to creating only the primary client and still completes the booking.
