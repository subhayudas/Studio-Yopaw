import { useCallback, useEffect, useRef, useState } from 'react'

export interface SquareSlot {
  startAt: string
  seatsRemaining: number
}

interface Options {
  pollMs?: number
}

export function useSquareAvailability(
  serviceVariationId: string,
  startDate: string,
  endDate: string,
  teamMemberId?: string,
  options: Options = {},
) {
  const { pollMs = 30_000 } = options
  const [slots, setSlots] = useState<SquareSlot[]>([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const reqIdRef = useRef(0)

  const fetchSlots = useCallback(() => {
    if (!serviceVariationId) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const reqId = ++reqIdRef.current
    setLoading(true)
    const tmParam = teamMemberId ? `&teamMemberId=${encodeURIComponent(teamMemberId)}` : ''
    fetch(
      `/api/availability?serviceVariationId=${encodeURIComponent(serviceVariationId)}&startDate=${startDate}&endDate=${endDate}${tmParam}`,
      { signal: controller.signal, cache: 'no-store' },
    )
      .then(r => r.json())
      .then((data: { availabilities?: Array<{ startAt?: string; seatsRemaining?: number }> }) => {
        if (reqId !== reqIdRef.current) return
        const mapped: SquareSlot[] = (data.availabilities ?? [])
          .filter(a => a.startAt)
          .map(a => ({ startAt: a.startAt!, seatsRemaining: a.seatsRemaining ?? 0 }))
        setSlots(mapped)
      })
      .catch(err => {
        if ((err as { name?: string })?.name === 'AbortError') return
        if (reqId !== reqIdRef.current) return
        setSlots([])
      })
      .finally(() => {
        if (reqId === reqIdRef.current) setLoading(false)
      })
  }, [serviceVariationId, startDate, endDate, teamMemberId])

  useEffect(() => {
    if (!serviceVariationId) {
      setSlots([])
      return
    }
    setSlots([])
    fetchSlots()
    return () => {
      abortRef.current?.abort()
    }
  }, [fetchSlots, serviceVariationId])

  useEffect(() => {
    if (!serviceVariationId || !pollMs) return
    const id = window.setInterval(fetchSlots, pollMs)
    return () => window.clearInterval(id)
  }, [fetchSlots, serviceVariationId, pollMs])

  useEffect(() => {
    if (!serviceVariationId) return
    const onFocus = () => fetchSlots()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchSlots()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [fetchSlots, serviceVariationId])

  return { slots, loading, refresh: fetchSlots }
}
