import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

interface ClassSchedule {
  dates: string[]
  times: string[]
  maxSeats: number
  breeds?: Record<string, { en: string; fr: string }>
}

function loadSchedule(): ClassSchedule {
  const dir = dirname(fileURLToPath(import.meta.url))
  const raw = readFileSync(join(dir, '..', 'class-schedule.json'), 'utf8')
  return JSON.parse(raw) as ClassSchedule
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const q = req.query as Record<string, string>
  const startDate = q.startDate?.trim()
  const endDate = q.endDate?.trim()

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' })
  }

  try {
    const schedule = loadSchedule()
    const breeds = schedule.breeds ?? {}

    const result: Record<string, { breed: { en: string; fr: string }; serviceIds: string[] }[]> = {}

    for (const [date, breed] of Object.entries(breeds)) {
      if (date < startDate || date > endDate) continue
      if (!breed.en && !breed.fr) continue
      result[date] = [{ breed, serviceIds: [] }]
    }

    return res.status(200).json({ schedule: result })
  } catch (err) {
    console.error('breeds error', err)
    return res.status(500).json({ error: 'Failed to fetch breed schedule' })
  }
}
