import type { VercelRequest, VercelResponse } from '@vercel/node'
import { validateVoucher } from './_voucher.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const code = (req.body as { code?: unknown })?.code
  const raw = typeof code === 'string' ? code : ''
  const normalized = raw.trim()

  res.setHeader('Cache-Control', 'no-store')

  try {
    const result = await validateVoucher(normalized)
    if (result.valid) {
      // Return ONLY the matched voucher — never the catalog or other discounts.
      if (result.kind === 'percentage') {
        return res.status(200).json({
          valid: true,
          code: normalized,
          name: result.name,
          kind: 'percentage',
          percentage: result.percentage,
        })
      }
      return res.status(200).json({
        valid: true,
        code: normalized,
        name: result.name,
        kind: 'amount',
        amountCents: result.amountCents,
      })
    }
    // Invalid code is not a server error — still 200.
    return res.status(200).json({ valid: false, reason: result.reason })
  } catch (err) {
    console.error('voucher lookup error', {
      message: (err as Error)?.message,
      statusCode: (err as { statusCode?: number })?.statusCode,
      errors: (err as { errors?: unknown })?.errors,
    })
    return res.status(500).json({ error: 'Voucher lookup failed' })
  }
}
