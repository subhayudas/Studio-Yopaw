import type { VercelRequest, VercelResponse } from '@vercel/node'
import { square, getLocationId } from './_square.js'
import { MAX_SEATS, ALLOWED_CLASS_TIMES, ALLOWED_CLASS_DATES, slotMontrealTime } from './_config.js'

/** Split [startDate, endDate] into ≤30-day chunks to stay within Square's 32-day limit. */
function dateChunks(startDate: string, endDate: string): Array<{ start: string; end: string }> {
  const chunks: Array<{ start: string; end: string }> = []
  let cursor = new Date(`${startDate}T00:00:00Z`)
  const finish = new Date(`${endDate}T00:00:00Z`)

  while (cursor <= finish) {
    const chunkEnd = new Date(cursor)
    chunkEnd.setDate(chunkEnd.getDate() + 29)
    if (chunkEnd > finish) chunkEnd.setTime(finish.getTime())
    chunks.push({
      start: cursor.toISOString().slice(0, 10),
      end: chunkEnd.toISOString().slice(0, 10),
    })
    cursor = new Date(chunkEnd)
    cursor.setDate(cursor.getDate() + 1)
  }
  return chunks
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const q = req.query as Record<string, string>
  const serviceVariationId = q.serviceVariationId?.replace(/^﻿/, '').trim()
  const startDate = q.startDate?.trim()
  const endDate = q.endDate?.trim()
  const teamMemberId = q.teamMemberId?.replace(/^﻿/, '').trim() || undefined

  if (!serviceVariationId || !startDate || !endDate) {
    return res.status(400).json({ error: 'serviceVariationId, startDate, endDate are required' })
  }

  try {
    const segmentFilter = teamMemberId
      ? { serviceVariationId, teamMemberIdFilter: { any: [teamMemberId] } }
      : { serviceVariationId }

    const chunks = dateChunks(startDate, endDate)

    const [chunkResults, bookingChunkResults] = await Promise.all([
      Promise.all(
        chunks.map(chunk =>
          square.bookings.searchAvailability({
            query: {
              filter: {
                startAtRange: {
                  startAt: `${chunk.start}T00:00:00Z`,
                  endAt: `${chunk.end}T23:59:59Z`,
                },
                locationId: getLocationId(),
                segmentFilters: [segmentFilter],
              },
            },
          }),
        ),
      ),
      Promise.all(
        chunks.map(chunk =>
          square.bookings.list({
            locationId: getLocationId(),
            startAtMin: `${chunk.start}T00:00:00Z`,
            startAtMax: `${chunk.end}T23:59:59Z`,
          }),
        ),
      ),
    ])

    const allAvailabilities = chunkResults.flatMap(r => r.availabilities ?? [])

    const bookingCounts = new Map<string, number>()
    for (const result of bookingChunkResults) {
      for (const booking of result.data ?? []) {
        if (booking.startAt && booking.status !== 'CANCELLED') {
          bookingCounts.set(booking.startAt, (bookingCounts.get(booking.startAt) ?? 0) + 1)
        }
      }
    }

    const availabilities = allAvailabilities
      .filter(slot => slot.startAt && ALLOWED_CLASS_DATES.has(slot.startAt.slice(0, 10)) && ALLOWED_CLASS_TIMES.has(slotMontrealTime(slot.startAt)))
      .map(slot => ({
        startAt: slot.startAt!,
        seatsRemaining: MAX_SEATS - (bookingCounts.get(slot.startAt!) ?? 0),
      }))
      .filter(slot => slot.seatsRemaining > 0)

    return res.status(200).json({ availabilities })
  } catch (err) {
    console.error('availability error', err)
    return res.status(500).json({ error: 'Failed to fetch availability' })
  }
}
