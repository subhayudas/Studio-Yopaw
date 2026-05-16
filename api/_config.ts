export const MAX_SEATS = 20

// Only show these class start times (Montreal / ET timezone).
// Handles DST automatically via Intl — no hardcoded UTC offsets.
export const ALLOWED_CLASS_TIMES = new Set(['10:00', '10:30', '12:00', '13:30', '15:00', '17:30'])

// Scheduled puppy yoga session dates (YYYY-MM-DD, Montreal local).
// Update this list whenever new sessions are added in the Square Dashboard.
export const ALLOWED_CLASS_DATES = new Set([
  '2026-06-14',
  '2026-06-21',
  '2026-06-28',
  '2026-07-04',
  '2026-07-05',
])

export function slotMontrealTime(startAt: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(startAt))
  const h = parts.find(p => p.type === 'hour')?.value ?? '00'
  const m = parts.find(p => p.type === 'minute')?.value ?? '00'
  return `${h}:${m}`
}
