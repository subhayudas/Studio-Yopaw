import type { VercelRequest, VercelResponse } from '@vercel/node'
import { buildAvailabilities } from './_availability.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const q = req.query as Record<string, string>
  const startDate = q.startDate?.trim()
  const endDate = q.endDate?.trim()

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' })
  }

  try {
    const availabilities = await buildAvailabilities(startDate, endDate)
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ availabilities })
  } catch (err) {
    console.error('availability error', {
      message: (err as Error)?.message,
      statusCode: (err as { statusCode?: number })?.statusCode,
      errors: (err as { errors?: unknown })?.errors,
    })
    return res.status(500).json({ error: 'Failed to fetch availability' })
  }
}
