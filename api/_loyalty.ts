import { square, getLocationId } from './_square.js'

export interface LoyaltySummary {
  /** Points earned by this booking (0 if Square's accrual rules gave none). */
  pointsEarned: number
  /** Account balance after accrual. */
  balance: number
  /** Program's own wording, e.g. { one: 'Paw', other: 'Paws' }. */
  terminology: { one: string; other: string }
  /** Points still needed for the next reward tier, or null if all tiers reached / none defined. */
  pointsToNextReward: number | null
  nextRewardName: string | null
}

/** Best-effort E.164 for North-American-style input; null if it can't be normalised. */
export function toE164(raw: string): string | null {
  const trimmed = (raw ?? '').trim()
  const digits = trimmed.replace(/\D/g, '')
  if (trimmed.startsWith('+')) return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

/**
 * Accrue Square Loyalty points for a paid booking order and return the balance.
 *
 * Square loyalty accounts are keyed by phone number. We find (or create) the account for
 * the booker's phone, then call AccumulateLoyaltyPoints with the order so the program's own
 * accrual rules decide how many points the order is worth.
 *
 * NEVER throws — the customer has already paid, so loyalty problems must not fail the
 * booking. Returns null when there is no active program, no usable phone, or on any error.
 */
export async function awardLoyaltyForOrder(opts: {
  phone: string
  orderId: string
}): Promise<LoyaltySummary | null> {
  try {
    const phoneNumber = toE164(opts.phone)
    if (!phoneNumber) return null

    const { program } = await square.loyalty.programs.get({ programId: 'main' })
    if (!program?.id || program.status !== 'ACTIVE') return null

    const locationId = getLocationId()
    if (program.locationIds?.length && !program.locationIds.includes(locationId)) return null

    const found = await square.loyalty.accounts.search({
      query: { mappings: [{ phoneNumber }] },
      limit: 1,
    })
    let accountId = found.loyaltyAccounts?.[0]?.id
    if (!accountId) {
      const created = await square.loyalty.accounts.create({
        idempotencyKey: `loyalty-acct-${phoneNumber}`,
        loyaltyAccount: { programId: program.id, mapping: { phoneNumber } },
      })
      accountId = created.loyaltyAccount?.id
    }
    if (!accountId) return null

    const accrued = await square.loyalty.accounts.accumulatePoints({
      accountId,
      idempotencyKey: `loyalty-order-${opts.orderId}`,
      locationId,
      accumulatePoints: { orderId: opts.orderId },
    })
    const pointsEarned = Number(
      accrued.event?.accumulatePoints?.points ?? accrued.events?.[0]?.accumulatePoints?.points ?? 0,
    )

    const { loyaltyAccount } = await square.loyalty.accounts.get({ accountId })
    const balance = loyaltyAccount?.balance ?? 0

    const tiers = [...(program.rewardTiers ?? [])].sort((a, b) => a.points - b.points)
    const next = tiers.find(t => t.points > balance) ?? null

    return {
      pointsEarned,
      balance,
      terminology: program.terminology ?? { one: 'point', other: 'points' },
      pointsToNextReward: next ? next.points - balance : null,
      nextRewardName: next?.name ?? null,
    }
  } catch (err) {
    console.error('[Loyalty] accrual failed (booking unaffected)', {
      message: (err as Error)?.message,
      statusCode: (err as { statusCode?: number })?.statusCode,
    })
    return null
  }
}

