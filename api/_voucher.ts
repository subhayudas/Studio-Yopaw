import { square, getLocationId } from './_square.js'
import type { Square } from 'square'

type CatalogObject = Square.CatalogObject

export type VoucherResult =
  | { valid: true; discountId: string; name: string; kind: 'percentage'; percentage: number }
  | { valid: true; discountId: string; name: string; kind: 'amount'; amountCents: number }
  | { valid: false; reason: 'not_found' | 'inactive' | 'unsupported_type' | 'expired' }

const MAX_CODE_LENGTH = 50

// Returns today's date in America/Toronto as YYYY-MM-DD (same pattern as _config.ts).
function montrealToday(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const y = parts.find(p => p.type === 'year')?.value ?? '0000'
  const m = parts.find(p => p.type === 'month')?.value ?? '01'
  const d = parts.find(p => p.type === 'day')?.value ?? '01'
  return `${y}-${m}-${d}`
}

// Walk every page of a catalog list. The Square v44 SDK `for await` iterator
// silently drops items (see api/_availability.ts) — use page.data + getNextPage.
async function listAllCatalog(types: string): Promise<CatalogObject[]> {
  const out: CatalogObject[] = []
  let page = await square.catalog.list({ types })
  while (true) {
    for (const obj of page.data) out.push(obj)
    if (!page.hasNextPage()) break
    page = await page.getNextPage()
  }
  return out
}

// Square Dashboard/Marketing coupons get names like
// "Get $5 off the next time you visit! — TESTDISCOUNT" — the redeemable code is
// the token after the trailing em-dash. Plain discounts are named as the code itself.
function extractCodeSuffix(name: string): string | null {
  const idx = name.lastIndexOf('—')
  if (idx === -1) return null
  const tail = name.slice(idx + 1).trim()
  return tail || null
}

// Is this catalog object available at the studio's location?
function isPresentAtLocation(obj: CatalogObject, locationId: string): boolean {
  if (!locationId) return true
  if (obj.absentAtLocationIds?.includes(locationId)) return false
  // presentAtAllLocations defaults to true when unset.
  if (obj.presentAtAllLocations === false) {
    return obj.presentAtLocationIds?.includes(locationId) ?? false
  }
  return true
}

/**
 * Validate a raw voucher code against Square Catalog DISCOUNT objects.
 * The code is matched (case-insensitively, trimmed) against the discount NAME.
 * All amounts come from Square — the client never supplies a discount value.
 *
 * Throws if Square API calls fail unexpectedly (caller maps to a 500); we never
 * silently treat an API error as a valid voucher.
 */
export async function validateVoucher(code: string): Promise<VoucherResult> {
  const normalized = (code ?? '').trim()
  if (!normalized || normalized.length > MAX_CODE_LENGTH) {
    return { valid: false, reason: 'not_found' }
  }

  const locationId = getLocationId()
  const target = normalized.toLowerCase()

  const discounts = await listAllCatalog('DISCOUNT')
  // A discount matches when its full name IS the code, or when the code follows
  // a trailing em-dash in a coupon-style name (see extractCodeSuffix).
  const matchesCode = (rawName: string | null | undefined): boolean => {
    const n = (rawName ?? '').trim()
    if (!n) return false
    if (n.toLowerCase() === target) return true
    return extractCodeSuffix(n)?.toLowerCase() === target
  }
  const match = discounts.find(
    obj => obj.type === 'DISCOUNT' && matchesCode(obj.discountData?.name),
  )

  if (!match || match.type !== 'DISCOUNT') {
    return { valid: false, reason: 'not_found' }
  }
  if (match.isDeleted) {
    return { valid: false, reason: 'not_found' }
  }
  if (!isPresentAtLocation(match, locationId)) {
    return { valid: false, reason: 'inactive' }
  }

  const data = match.discountData
  // Display the short code, not the full marketing sentence, when matched by suffix.
  const fullName = (data?.name ?? normalized).trim()
  const name = extractCodeSuffix(fullName)?.toLowerCase() === target
    ? extractCodeSuffix(fullName)!
    : fullName
  const discountType = data?.discountType

  // Resolve the discount value (server-side only).
  let result: VoucherResult
  if (discountType === 'FIXED_PERCENTAGE') {
    const pct = Number(data?.percentage ?? '')
    if (!Number.isFinite(pct) || pct <= 0) {
      return { valid: false, reason: 'unsupported_type' }
    }
    result = { valid: true, discountId: match.id, name, kind: 'percentage', percentage: pct }
  } else if (discountType === 'FIXED_AMOUNT') {
    const amountCents = Number(data?.amountMoney?.amount ?? 0n)
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return { valid: false, reason: 'unsupported_type' }
    }
    result = { valid: true, discountId: match.id, name, kind: 'amount', amountCents }
  } else {
    // VARIABLE_PERCENTAGE / VARIABLE_AMOUNT / anything else.
    return { valid: false, reason: 'unsupported_type' }
  }

  // Scheduling: if a pricing rule references this discount and has a valid-from/until
  // window, enforce today (Montreal) is inside it. No referencing rule = always valid.
  const rules = await listAllCatalog('PRICING_RULE')
  const today = montrealToday()
  for (const rule of rules) {
    if (rule.type !== 'PRICING_RULE') continue
    const rd = rule.pricingRuleData
    if (!rd || rd.discountId !== match.id) continue
    const from = rd.validFromDate ?? null
    const until = rd.validUntilDate ?? null
    if (from && today < from) return { valid: false, reason: 'expired' }
    if (until && today > until) return { valid: false, reason: 'expired' }
  }

  return result
}
