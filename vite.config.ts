import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin, Connect } from 'vite'
import type { ServerResponse } from 'node:http'

// Load .env / .env.local / .env.development into process.env so the dev
// API plugin (which runs in Node, not the browser) can read server-only
// secrets like SQUARE_ACCESS_TOKEN. Without this, the plugin always falls
// back to the synthetic full-capacity mock locally.
function loadServerEnv(mode: string) {
  const env = loadEnv(mode, process.cwd(), '')
  for (const [k, v] of Object.entries(env)) {
    if (process.env[k] === undefined) process.env[k] = v
  }
}

interface ClassSchedule {
  dates?: string[]
  times?: string[]
  maxSeats?: number
  blockedSlots?: string[]
  breeds?: Record<string, { en: string; fr: string }>
}

function loadSchedule(): ClassSchedule {
  return JSON.parse(readFileSync(resolve(__dirname, 'class-schedule.json'), 'utf8'))
}

function jsonResponse(res: ServerResponse, data: unknown) {
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

// Convert a Montreal local time string (HH:MM) on a given date to UTC ISO.
// Uses Intl to determine the correct offset for that specific date (handles DST).
function montrealLocalToUtc(dateIso: string, timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  // Start with a UTC guess at that wall-clock time
  const utcGuess = new Date(`${dateIso}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`)
  // Find what Montreal time that UTC instant corresponds to
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(utcGuess)
  const localH = Number(parts.find(p => p.type === 'hour')?.value ?? h)
  const localM = Number(parts.find(p => p.type === 'minute')?.value ?? m)
  const offsetMinutes = (h * 60 + m) - (localH * 60 + localM)
  const corrected = new Date(utcGuess.getTime() + offsetMinutes * 60_000)
  return corrected.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

function devApiPlugin(): Plugin {
  return {
    name: 'dev-api',
    configureServer(server) {
      // Mock /api/breeds — reads directly from class-schedule.json
      server.middlewares.use('/api/breeds', (req, res) => {
        try {
          const schedule = loadSchedule()
          const url = new URL(req.url ?? '/', 'http://localhost')
          const startDate = url.searchParams.get('startDate') ?? ''
          const endDate = url.searchParams.get('endDate') ?? ''
          const breeds = schedule.breeds ?? {}
          const result: Record<string, { breed: { en: string; fr: string }; serviceIds: string[] }[]> = {}

          for (const [date, breed] of Object.entries(breeds)) {
            if (date < startDate || date > endDate) continue
            if (!breed.en && !breed.fr) continue
            result[date] = [{ breed, serviceIds: [] }]
          }

          jsonResponse(res, { schedule: result })
        } catch {
          res.statusCode = 500
          jsonResponse(res, { error: 'Failed to read schedule' })
        }
      })

      // /api/availability — when SQUARE_ACCESS_TOKEN is set, fetch real bookings via
      // the shared buildAvailabilities helper. Otherwise fall back to a synthetic
      // full-capacity mock so offline dev still works.
      server.middlewares.use('/api/availability', async (req: Connect.IncomingMessage, res) => {
        try {
          const url = new URL(req.url ?? '/', 'http://localhost')
          const startDate = url.searchParams.get('startDate') ?? ''
          const endDate = url.searchParams.get('endDate') ?? ''
          res.setHeader('Cache-Control', 'no-store')

          if (process.env.SQUARE_ACCESS_TOKEN) {
            const mod = (await import('./api/_availability.ts')) as {
              buildAvailabilities: (s: string, e: string) => Promise<Array<{ startAt: string; seatsRemaining: number }>>
            }
            const availabilities = await mod.buildAvailabilities(startDate, endDate)
            jsonResponse(res, { availabilities })
            return
          }

          const schedule = loadSchedule()
          const dates = schedule.dates ?? []
          const times = schedule.times ?? ['10:30', '12:00', '13:30', '15:00']
          const maxSeats = schedule.maxSeats ?? 20
          const blockedSlots = new Set(schedule.blockedSlots ?? [])

          const availabilities: { startAt: string; seatsRemaining: number }[] = []

          for (const date of dates) {
            if (date < startDate || date > endDate) continue
            for (const time of times) {
              const blocked = blockedSlots.has(`${date} ${time}`)
              availabilities.push({
                startAt: montrealLocalToUtc(date, time),
                seatsRemaining: blocked ? 0 : maxSeats,
              })
            }
          }

          jsonResponse(res, { availabilities })
        } catch (err) {
          console.error('dev /api/availability error', err)
          res.statusCode = 500
          jsonResponse(res, { error: 'Failed to read schedule' })
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  loadServerEnv(mode)
  return {
    plugins: [react(), tailwindcss(), devApiPlugin()],
  }
})
