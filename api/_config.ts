export const MAX_SEATS = 20

// Only show these four class start times (Montreal / ET timezone).
// Handles DST automatically via Intl — no hardcoded UTC offsets.
export const ALLOWED_CLASS_TIMES = new Set(['10:30', '12:00', '13:30', '15:00'])

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
