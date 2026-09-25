import type { VercelRequest } from '@vercel/node'

// Best-effort, in-memory limiter for unauthenticated code-lookup endpoints
// (voucher / gift card). Serverless instances don't share memory, so this only slows
// down brute-force guessing per warm instance — it is not a hard guarantee.
const WINDOW_MS = 10 * 60 * 1000
const MAX_HITS = 30
const hits = new Map<string, number[]>()

export function isRateLimited(req: VercelRequest, bucket: string): boolean {
  const fwd = req.headers['x-forwarded-for']
  const ip = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown'
  const key = `${bucket}:${ip}`
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter(t => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every(t => now - t >= WINDOW_MS)) hits.delete(k)
  }
  return recent.length > MAX_HITS
}
