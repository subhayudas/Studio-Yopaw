import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isRateLimited } from './_rateLimit.js'
import { lookupGiftCardByNonce } from './_giftcard.js'

// POST /api/giftcard  { nonce }  — nonce comes from Square Web Payments SDK giftCard().tokenize().
// Returns the usable balance only (never the full GAN).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  if (isRateLimited(req, 'giftcard')) return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes.' })
  res.setHeader('Cache-Control', 'no-store')

  const nonce = (req.body as { nonce?: unknown })?.nonce
  try {
    const result = await lookupGiftCardByNonce(typeof nonce === 'string' ? nonce : '')
    if (result.valid) {
      return res.status(200).json({ valid: true, balanceCents: result.balanceCents, last4: result.last4 })
    }
    return res.status(200).json({ valid: false, reason: result.reason })
  } catch (err) {
    console.error('gift card lookup error', {
      message: (err as Error)?.message,
      statusCode: (err as { statusCode?: number })?.statusCode,
    })
    return res.status(500).json({ error: 'Gift card lookup failed' })
  }
}
