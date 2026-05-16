import type { VercelRequest, VercelResponse } from '@vercel/node'
import { square, getLocationId } from './_square.js'
import { MAX_SEATS, ALLOWED_CLASS_TIMES, slotMontrealTime } from './_config.js'

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

    const [availResult, bookingsResult] = await Promise.all([
      square.bookings.searchAvailability({
        query: {
          filter: {
            startAtRange: {
              startAt: `${startDate}T00:00:00Z`,
              endAt: `${endDate}T23:59:59Z`,
            },
            locationId: getLocationId(),
            segmentFilters: [segmentFilter],
          },
        },
      }),
      square.bookings.list({
        locationId: getLocationId(),
        startAtMin: `${startDate}T00:00:00Z`,
        startAtMax: `${endDate}T23:59:59Z`,
      }),
    ])

    const bookingCounts = new Map<string, number>()
    for (const booking of bookingsResult.data ?? []) {
      if (booking.startAt && booking.status !== 'CANCELLED') {
        bookingCounts.set(booking.startAt, (bookingCounts.get(booking.startAt) ?? 0) + 1)
      }
    }

    const availabilities = (availResult.availabilities ?? [])
      .filter(slot => slot.startAt && ALLOWED_CLASS_TIMES.has(slotMontrealTime(slot.startAt)))
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
