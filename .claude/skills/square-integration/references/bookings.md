# Square Bookings API Reference

## Prerequisites
- Square developer account + application
- Seller must be on **Appointments Plus or Premium** plan for seller-level write access
- OAuth scopes: `APPOINTMENTS_ALL_READ` + `APPOINTMENTS_ALL_WRITE`
  (or buyer-level: `APPOINTMENTS_READ` + `APPOINTMENTS_WRITE`)
- Locations, team members, and services must be configured in Square Dashboard first
  (team members must be manually added to services in Dashboard — cannot be done via API)

---

## Key concepts

- **Booking** — an agreement between seller + customer: service(s), team member(s), time, location
- **Appointment segment** — one service slot within a booking (multiple segments = multi-service)
- **Availability** — open time slots returned by `SearchAvailability`
- **Seller-level** — full calendar visibility + control → requires paid Appointments plan
- **Buyer-level** — limited access for customer self-service → works on free plan

---

## Complete booking flow (7 steps)

### Step 1: List locations
```bash
GET /v2/locations
```
Returns array of `Location` objects. Save `location.id` for subsequent calls.

### Step 2: Get business booking profile
```bash
GET /v2/bookings/business-booking-profile
```
Check `booking_enabled` and `online_booking_enabled`. Get `booking_policy`.

### Step 3: List bookable services (Catalog API)
```bash
POST /v2/catalog/search
{
  "object_types": ["ITEM"],
  "query": {
    "prefix_query": { "attribute_name": "service", "attribute_prefix": "" }
  }
}
```
Or use `GET /v2/catalog/list?types=ITEM_VARIATION` and filter for `available_for_booking: true`.
Save the **service variation ID** (not the parent item ID).

### Step 4: List team member booking profiles
```bash
GET /v2/bookings/team-member-booking-profiles?location_id={LOCATION_ID}
```
Returns bookable team members. Save `team_member_id`.

### Step 5: Search availability
```bash
POST /v2/bookings/availability/search
{
  "query": {
    "filter": {
      "start_at_range": {
        "start_at": "2025-03-01T00:00:00Z",
        "end_at": "2025-03-07T23:59:59Z"
      },
      "location_id": "LOCATION_ID",
      "segment_filters": [
        {
          "service_variation_id": "SERVICE_VARIATION_ID",
          "team_member_id_filter": {
            "any": ["TEAM_MEMBER_ID"]  // omit for any available member
          }
        }
      ]
    }
  }
}
```
Response: `{ availabilities: [{ start_at, location_id, appointment_segments }] }`

### Step 6: Create or find customer
```bash
POST /v2/customers
{
  "idempotency_key": "uuid-here",
  "given_name": "Jane",
  "family_name": "Doe",
  "email_address": "jane@example.com",
  "phone_number": "+16045551234"
}
```
Or search existing: `POST /v2/customers/search` with email/phone filter.
Save `customer.id`.

### Step 7: Create booking
```bash
POST /v2/bookings
{
  "idempotency_key": "uuid-here",
  "booking": {
    "location_id": "LOCATION_ID",
    "customer_id": "CUSTOMER_ID",
    "customer_note": "Bringing my dog Max",
    "start_at": "2025-03-03T10:00:00Z",
    "appointment_segments": [
      {
        "service_variation_id": "SERVICE_VARIATION_ID",
        "service_variation_version": 1234567890,  // from catalog lookup
        "team_member_id": "TEAM_MEMBER_ID",
        "duration_minutes": 60
      }
    ]
  }
}
```

---

## Retrieve a booking
```bash
GET /v2/bookings/{booking_id}
```

## List bookings
```bash
GET /v2/bookings?location_id={LOCATION_ID}&start_at_min=2025-03-01T00:00:00Z
```
Supports filters: `location_id`, `team_member_id`, `start_at_min`, `start_at_max`, `limit`, `cursor`.

## Update a booking
```bash
PUT /v2/bookings/{booking_id}
{
  "idempotency_key": "uuid-here",
  "booking": {
    "version": CURRENT_VERSION,  // required for optimistic concurrency
    "start_at": "2025-03-03T11:00:00Z"
  }
}
```

## Cancel a booking
```bash
POST /v2/bookings/{booking_id}/cancel
{
  "idempotency_key": "uuid-here",
  "booking_version": CURRENT_VERSION
}
```

---

## Class booking specifics (group sessions)

Square Appointments Plus supports group class booking natively.
Classes appear as services with `max_seats` set in the Dashboard.
Multiple customers can book the same slot until capacity is reached.

When building the UI:
- Show available slots from `SearchAvailability`
- Slot disappears from results when `max_seats` is reached
- You can show remaining seats by listing bookings for that slot and comparing to `max_seats`

---

## Custom attributes
Attach custom data to bookings (e.g. pet name, pet breed, health notes):
```bash
POST /v2/bookings/{booking_id}/custom-attributes/{key}
{
  "custom_attribute": {
    "value": "Golden Retriever"
  }
}
```
Define the schema first via `POST /v2/bookings/custom-attribute-definitions`.

---

## Limitations
- Cannot create bookings with non-zero cancellation fees via API (set in Dashboard)
- Cannot add team members to services via API (must use Dashboard)
- Cannot create double-bookings or bookings outside business hours
- Webhooks: `booking.created`, `booking.updated`, `booking.cancelled`
