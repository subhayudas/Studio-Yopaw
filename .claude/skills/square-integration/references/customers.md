# Square Customers API Reference

## Customers API

### Create customer
```bash
POST /v2/customers
{
  "idempotency_key": "uuid",
  "given_name": "Jane",
  "family_name": "Doe",
  "email_address": "jane@example.com",
  "phone_number": "+16045551234",
  "note": "Has two dogs: Max and Bella",
  "reference_id": "your-internal-user-id"
}
```

### Search for existing customer (avoid duplicates)
```bash
POST /v2/customers/search
{
  "query": {
    "filter": {
      "email_address": { "exact": "jane@example.com" }
    }
  }
}
```
Best practice: always search before creating to avoid duplicates.

### Retrieve / Update / Delete
```bash
GET    /v2/customers/{customer_id}
PUT    /v2/customers/{customer_id}   # body: fields to update + version
DELETE /v2/customers/{customer_id}
```

### List customers
```bash
GET /v2/customers?limit=100&cursor={cursor_from_prev_response}
```

---

## Custom attributes on customers
Store domain-specific data (e.g. pet names, health notes) directly on customer profiles.

```bash
# 1. Define the schema (do once per app)
POST /v2/customers/custom-attribute-definitions
{
  "custom_attribute_definition": {
    "key": "pet_name",
    "name": "Pet Name",
    "schema": { "$ref": "https://developer-production-s.squarecdn.com/schemas/v1/common.json#squareup.common.String" },
    "visibility": "VISIBILITY_READ_WRITE_VALUES"
  }
}

# 2. Set value on a customer
POST /v2/customers/{customer_id}/custom-attributes/pet_name
{
  "custom_attribute": { "value": "Max" }
}

# 3. Read back
GET /v2/customers/{customer_id}/custom-attributes/pet_name
```

---

## Loyalty program
Enroll customers in a loyalty program and award points for bookings/purchases.

```bash
# Create loyalty account
POST /v2/loyalty/accounts
{
  "idempotency_key": "uuid",
  "loyalty_account": {
    "program_id": "PROGRAM_ID",  // from GET /v2/loyalty/programs/main
    "mapping": { "phone_number": "+16045551234" }
  }
}

# Accumulate points (after a payment)
POST /v2/loyalty/events/accumulate
{
  "idempotency_key": "uuid",
  "loyalty_account_id": "LOYALTY_ACCOUNT_ID",
  "accumulate_points": {
    "order_id": "ORDER_ID"
  },
  "location_id": "LOCATION_ID"
}
```

---

## Gift cards
```bash
# Create gift card
POST /v2/gift-cards
{
  "idempotency_key": "uuid",
  "location_id": "LOCATION_ID",
  "gift_card": { "type": "DIGITAL" }
}

# Activate (load initial balance)
POST /v2/gift-cards/activities
{
  "idempotency_key": "uuid",
  "activity": {
    "type": "ACTIVATE",
    "location_id": "LOCATION_ID",
    "gift_card_id": "GIFT_CARD_ID",
    "activate_activity_details": {
      "amount_money": { "amount": 5000, "currency": "CAD" },
      "order_id": "ORDER_ID"
    }
  }
}
```

---

## Customer groups & segments
Group customers for targeted marketing campaigns.

```bash
# List groups
GET /v2/customers/groups

# Add customer to group
PUT /v2/customers/{customer_id}/groups/{group_id}

# Segments (smart groups — auto-populated by Square)
GET /v2/customers/segments
```

---

## Webhooks for customers
- `customer.created`
- `customer.updated`
- `customer.deleted`
