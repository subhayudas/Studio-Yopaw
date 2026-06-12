import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { square, getLocationId } from './_square.js'
import { slotMontrealTime } from './_config.js'

export interface ClassSchedule {
  dates: string[]
  times: string[]
  maxSeats: number
  blockedSlots?: string[]
}

export function loadSchedule(): ClassSchedule {
  const raw = readFileSync(join(process.cwd(), 'class-schedule.json'), 'utf8')
  return JSON.parse(raw) as ClassSchedule
}

export const normalizeStartAt = (s: string) => s.replace(/\.\d+Z$/, 'Z')

function parseAttendeeCount(note: string | undefined | null): number {
  if (!note) return 1
  const m = note.match(/Total attendees:\s*(\d+)/)
  return m ? Math.max(1, parseInt(m[1], 10)) : 1
}

function dateChunks(startDate: string, endDate: string): Array<{ start: string; end: string }> {
  const chunks: Array<{ start: string; end: string }> = []
  let cursor = new Date(`${startDate}T00:00:00Z`)
  const finish = new Date(`${endDate}T00:00:00Z`)
  while (cursor <= finish) {
    const chunkEnd = new Date(cursor)
    chunkEnd.setDate(chunkEnd.getDate() + 29)
    if (chunkEnd > finish) chunkEnd.setTime(finish.getTime())
    chunks.push({ start: cursor.toISOString().slice(0, 10), end: chunkEnd.toISOString().slice(0, 10) })
    cursor = new Date(chunkEnd)
    cursor.setDate(cursor.getDate() + 1)
  }
  return chunks
}

export async function countBookings(startDate: string, endDate: string): Promise<Map<string, number>> {
  const bookingCounts = new Map<string, number>()
  try {
    const locationId = getLocationId()
    if (!locationId) return bookingCounts
    const chunks = dateChunks(startDate, endDate)
    const pages = await Promise.all(
      chunks.map(chunk =>
        square.bookings.list({
          locationId,
          startAtMin: `${chunk.start}T00:00:00Z`,
          startAtMax: `${chunk.end}T23:59:59Z`,
        }),
      ),
    )
    for (const page of pages) {
      for await (const booking of page) {
        if (!booking.startAt) continue
        const st = booking.status ?? ''
        if (st === 'CANCELLED_BY_SELLER' || st === 'CANCELLED_BY_CUSTOMER' || st === 'DECLINED') continue
        const key = normalizeStartAt(booking.startAt)
        bookingCounts.set(key, (bookingCounts.get(key) ?? 0) + parseAttendeeCount(booking.customerNote))
      }
    }
  } catch (bookingErr) {
    console.error('availability: bookings.list error (non-fatal)', {
      message: (bookingErr as Error)?.message,
      statusCode: (bookingErr as { statusCode?: number })?.statusCode,
      errors: (bookingErr as { errors?: unknown })?.errors,
    })
  }
  return bookingCounts
}

export async function buildAvailabilities(
  startDate: string,
  endDate: string,
): Promise<Array<{ startAt: string; seatsRemaining: number }>> {
  const schedule = loadSchedule()
  const allowedDates = new Set(schedule.dates.filter(d => d >= startDate && d <= endDate))
  const allowedTimes = new Set(schedule.times)
  const maxSeats = schedule.maxSeats
  const blockedSlots = new Set(schedule.blockedSlots ?? [])

  const bookingCounts = await countBookings(startDate, endDate)

  const availabilities: Array<{ startAt: string; seatsRemaining: number }> = []
  for (const dateIso of [...allowedDates].sort()) {
    for (const timeStr of [...allowedTimes].sort()) {
      const [h, m] = timeStr.split(':').map(Number)
      const utcGuess = new Date(`${dateIso}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`)
      const checkTime = slotMontrealTime(utcGuess.toISOString())
      const [ch, cm] = checkTime.split(':').map(Number)
      const offsetMinutes = h * 60 + m - (ch * 60 + cm)
      const corrected = new Date(utcGuess.getTime() + offsetMinutes * 60_000)
      const startAt = corrected.toISOString().replace(/\.\d{3}Z$/, 'Z')

      const booked = bookingCounts.get(normalizeStartAt(startAt)) ?? 0
      const blocked = blockedSlots.has(`${dateIso} ${timeStr}`)
      const seatsRemaining = blocked ? 0 : Math.max(0, maxSeats - booked)
      availabilities.push({ startAt, seatsRemaining })
    }
  }
  return availabilities
}
