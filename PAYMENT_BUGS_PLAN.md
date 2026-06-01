# Payment Bugs — Fix Plan

Two bugs to fix in `api/booking.ts`.

---

## Bug 1 — Taxes not always applied

### Root cause
`booking.ts` only computes taxes when **both** `SQUARE_GST_TAX_ID` and `SQUARE_QST_TAX_ID` env vars are set. If either is missing, it charges `baseAmountCents` with no taxes — no order is even created.

```ts
// current — taxes are conditional
if (gstTaxId && qstTaxId) {
  // create order with catalog taxes → chargeAmount = order.totalMoney
} else {
  chargeAmount = BigInt(baseAmountCents)  // ← no taxes, no order
}
```

### Fix
Always create a Square order. Include taxes as **inline percentage items** (no catalog IDs needed):

```ts
taxes: [
  { uid: 'gst', name: 'TPS/GST', percentage: '5',     scope: 'LINE_ITEM' },
  { uid: 'qst', name: 'TVQ/QST', percentage: '9.975', scope: 'LINE_ITEM' },
]
```

`chargeAmount` always comes from `order.totalMoney.amount`.  
`SQUARE_GST_TAX_ID` / `SQUARE_QST_TAX_ID` env vars can be removed (no longer needed).

### ❓ Question 1
Using inline percentage taxes means Square orders won't link to your catalog tax items — taxes show in Square Dashboard but aren't tied to a specific tax catalog entry.

**Does this matter for your Square tax reporting?**  
- **No → use inline percentages** (simpler, always applied, zero env-var config)  
- **Yes → keep catalog IDs required** (taxes still always applied, but `SQUARE_GST_TAX_ID` + `SQUARE_QST_TAX_ID` must be set in Vercel env vars or booking fails)

---

## Bug 2 — Charge uses custom total instead of booked service

### Root cause
The Square order line item uses a custom price sent from the frontend (`baseAmountCents`) instead of referencing the actual catalog service variation:

```ts
// current — custom price, not catalog item
lineItems: [{
  quantity: '1',
  name: serviceName,
  basePriceMoney: { amount: BigInt(baseAmountCents), currency: 'CAD' },
}]
```

When tax IDs are not set (Bug 1 path), no order is created at all — Square processes the payment with no line items, showing only a raw dollar amount.

### Fix
Reference the catalog service variation by ID so Square uses the canonical price:

```ts
// fixed — catalog item reference
lineItems: [{
  quantity: '1',
  catalogObjectId: serviceVariationId,
  catalogVersion: BigInt(serviceVariationVersion),
  appliedTaxes: [{ taxUid: 'gst' }, { taxUid: 'qst' }],
}]
```

Square fetches the price from its catalog. The frontend `VITE_SQUARE_YIN_BASE_CENTS` env var stays for **display only** (price shown to user before payment) but is no longer the source of truth for what gets charged.

### Mat rental add-on ($5)
Mat rental is not a catalog item. It needs a separate custom line item in the same order:

```ts
// additional line item when needsMatRental === true
{
  quantity: '1',
  name: 'Mat Rental / Location de tapis',
  basePriceMoney: { amount: 500n, currency: 'CAD' },
  appliedTaxes: [{ taxUid: 'gst' }, { taxUid: 'qst' }],
}
```

The mat rental flag is already sent from the frontend (`baseAmountCents` currently bakes it in). We need to send it as a separate `needsMatRental: boolean` field instead so the backend can build the correct line items.

### ❓ Question 2
Should taxes (GST + QST) apply to the **mat rental** line item?  
In Quebec, renting equipment for a taxable service is generally taxable — so yes is the safe answer.  
Just confirm so it matches what you want on Square receipts.

### ❓ Question 3
When we switch to `catalogObjectId`, Square charges whatever price is in the Square Dashboard catalog for that service variation — not the env var.  
**Are the prices in your Square catalog currently set to $46.00 per class?**  
If the catalog price and the displayed price diverge, the user sees $46 on the site but gets charged a different amount. We should verify this before deploying.

---

## Implementation order (once questions are answered)

1. Add `needsMatRental: boolean` to the booking API request body (sent from frontend alongside `baseAmountCents`)
2. Rewrite the order-creation block in `booking.ts`:
   - Always create the order
   - Main line item: `catalogObjectId: serviceVariationId`
   - Mat rental line item: conditional, custom price
   - Taxes: inline percentages (or catalog IDs per Q1 answer)
3. Remove the `if (gstTaxId && qstTaxId)` branch
4. `chargeAmount` always = `order.totalMoney.amount`
5. Update the Resend notification email (remove conditional tax line)
6. Remove `SQUARE_GST_TAX_ID` / `SQUARE_QST_TAX_ID` from env if going inline

Files changed: `api/booking.ts` only. Frontend stays the same (still shows tax breakdown, still sends `needsMatRental`).
