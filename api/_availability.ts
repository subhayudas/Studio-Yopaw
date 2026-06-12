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

// Booking statuses that should NOT count toward seat consumption. Anything
// else — confirmed (ACCEPTED), pending, no-show, or any future Square
// status — takes a seat. The studio wants every booking they see in Square
// to consume capacity unless it was explicitly cancelled or declined.
const EXCLUDED_STATUSES = new Set(['CANCELLED_BY_SELLER', 'CANCELLED_BY_CUSTOMER', 'DECLINED'])

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

const DEBUG = () => process.env.AVAILABILITY_DEBUG === '1'

/**
 * Look up order line-item quantities by referenceId (= booking.id).
 * Orders are created with referenceId set to the booking ID and the catalog
 * service's line-item quantity equal to the total attendees. This is the
 * source of truth for "how many seats did we actually sell".
 *
 * Searches in a generous rolling window (1 year back, 60 days forward) to
 * cover all booking-related orders. Returns an empty map on any failure so
 * the caller falls back to customerNote parsing.
 */
async function fetchOrderQuantitiesByBookingId(
  locationId: string,
  bookingIds: Set<string>,
): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  if (bookingIds.size === 0) return out

  try {
    const now = new Date()
    const startAt = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()
    const endAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString()

    let cursor: string | undefined = undefined
    let safety = 50 // hard cap on pages, ~25k orders
    do {
      const resp = await square.orders.search({
        locationIds: [locationId],
        cursor,
        limit: 500,
        query: {
          filter: {
            dateTimeFilter: { createdAt: { startAt, endAt } },
          },
          sort: { sortField: 'CREATED_AT', sortOrder: 'DESC' },
        },
      })
      const orders = resp.orders ?? []
      for (const order of orders) {
        const ref = order.referenceId
        if (!ref || !bookingIds.has(ref)) continue
        const qty = Number(order.lineItems?.[0]?.quantity ?? '0')
        if (qty > 0) out.set(ref, qty)
      }
      cursor = resp.cursor
      safety -= 1
    } while (cursor && safety > 0)
  } catch (err) {
    console.error('availability: orders.search error (non-fatal)', {
      message: (err as Error)?.message,
      statusCode: (err as { statusCode?: number })?.statusCode,
      errors: (err as { errors?: unknown })?.errors,
    })
  }
  return out
}

/**
 * Returns a Map keyed by booking-startAt epoch milliseconds → total attendees.
 * Uses Date.parse so Square's `2026-06-14T14:30:00Z` and `…+00:00` and
 * any trailing-millisecond variation all collapse to the same key.
 */
export async function countBookings(startDate: string, endDate: string): Promise<Map<number, number>> {
  const bookingCounts = new Map<number, number>()
  const debug = DEBUG()

  try {
    const locationId = getLocationId()
    if (!locationId) return bookingCounts

    // 1. Pull every booking in the window.
    const chunks = dateChunks(startDate, endDate)
    const pages = await Promise.all(
      chunks.map(chunk =>
        square.bookings.list({
          locationId,
          startAtMin: `${chunk.start}T00:00:00Z`,
          startAtMax: `${chunk.end}T23:59:59Z`,
          // Square's default page size is small and we've observed it dropping
          // items via cursor pagination. Request the max page size to minimize
          // pagination round-trips and avoid the bug entirely on small datasets.
          limit: 200,
        }),
      ),
    )

    type BookingRow = { id: string; startMs: number; status: string; customerNote?: string | null }
    const counted: BookingRow[] = []
    const bookingIds = new Set<string>()

    // Manually walk pagination via page.data + page.getNextPage(). The Square v44
    // SDK's `for await` async iterator on the Page class silently drops items
    // (verified empirically: a 30-day query yields 82 items via `for await`,
    // 91 items via this manual loop). Don't use `for await` on Square pages.
    for (let page of pages) {
      while (true) {
        for (const booking of page.data) {
          if (!booking.startAt || !booking.id) continue
          const status = booking.status ?? ''
          if (EXCLUDED_STATUSES.has(status)) {
            if (debug) console.log('[avail] skip booking', { id: booking.id, status, startAt: booking.startAt })
            continue
          }
          const startMs = Date.parse(booking.startAt)
          if (Number.isNaN(startMs)) {
            console.warn('[avail] unparseable booking.startAt', { id: booking.id, startAt: booking.startAt })
            continue
          }
          counted.push({ id: booking.id, startMs, status, customerNote: booking.customerNote })
          bookingIds.add(booking.id)
        }
        if (!page.hasNextPage()) break
        page = await page.getNextPage()
      }
    }

    // 2. Look up order quantities for those bookings.
    const orderQty = await fetchOrderQuantitiesByBookingId(locationId, bookingIds)

    // 3. Sum attendees per slot, picking the strongest available signal.
    for (const row of counted) {
      const qtyFromOrder = orderQty.get(row.id) ?? 0
      const parsedFromNote = parseAttendeeCount(row.customerNote)
      const finalCount = qtyFromOrder > 0 ? qtyFromOrder : parsedFromNote
      bookingCounts.set(row.startMs, (bookingCounts.get(row.startMs) ?? 0) + finalCount)
      if (debug) {
        console.log('[avail] count booking', {
          id: row.id,
          status: row.status,
          startAt: new Date(row.startMs).toISOString(),
          customerNote: row.customerNote?.slice(0, 80),
          qtyFromOrder,
          parsedFromNote,
          finalCount,
        })
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

/**
 * Sum the attendees already booked into a specific slot. Used by the
 * booking endpoint's race-check so a party-of-N can't book into a full slot.
 */
export async function countSlotAttendees(slotStartAt: string): Promise<number> {
  const slotMs = Date.parse(slotStartAt)
  if (Number.isNaN(slotMs)) return 0
  const day = slotStartAt.slice(0, 10)
  const counts = await countBookings(day, day)
  return counts.get(slotMs) ?? 0
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
      const slotMs = corrected.getTime()

      const booked = bookingCounts.get(slotMs) ?? 0
      const blocked = blockedSlots.has(`${dateIso} ${timeStr}`)
      const seatsRemaining = blocked ? 0 : Math.max(0, maxSeats - booked)
      availabilities.push({ startAt, seatsRemaining })
    }
  }
  return availabilities
}
