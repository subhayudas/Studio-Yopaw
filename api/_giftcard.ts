import { square } from './_square.js'

export type GiftCardLookup =
  | { valid: true; giftCardId: string; balanceCents: number; last4: string }
  | { valid: false; reason: 'not_found' | 'inactive' | 'empty' }

/**
 * Resolve a gift card from a Square Web Payments SDK gift-card nonce (the customer
 * types the GAN + PIN into Square's own iframe — we never see either).
 * All balances come from Square; the client never supplies an amount.
 *
 * Throws on unexpected Square API failures (callers map to 500).
 */
export async function lookupGiftCardByNonce(nonce: string): Promise<GiftCardLookup> {
  if (typeof nonce !== 'string' || !nonce.trim()) return { valid: false, reason: 'not_found' }

  let card
  try {
    const res = await square.giftCards.getFromNonce({ nonce: nonce.trim() })
    card = res.giftCard
  } catch (err) {
    // Square answers 404 NOT_FOUND / 400 for bad or expired tokens — that's an invalid card,
    // not a server error.
    const status = (err as { statusCode?: number })?.statusCode
    if (status === 404 || status === 400) return { valid: false, reason: 'not_found' }
    throw err
  }

  if (!card?.id) return { valid: false, reason: 'not_found' }
  if (card.state !== 'ACTIVE') return { valid: false, reason: 'inactive' }

  const balanceCents = Number(card.balanceMoney?.amount ?? 0n)
  if (!Number.isFinite(balanceCents) || balanceCents <= 0) return { valid: false, reason: 'empty' }

  return {
    valid: true,
    giftCardId: card.id,
    balanceCents,
    last4: (card.gan ?? '').slice(-4),
  }
}
