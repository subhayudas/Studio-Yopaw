import { useEffect, useState } from 'react'

export interface SquareSlot {
  startAt: string
  seatsRemaining: number
}

export function useSquareAvailability(
  serviceVariationId: string,
  startDate: string,
  endDate: string,
  teamMemberId?: string,
) {
  const [slots, setSlots] = useState<SquareSlot[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!serviceVariationId) return
    setLoading(true)
    setSlots([])
    const tmParam = teamMemberId ? `&teamMemberId=${encodeURIComponent(teamMemberId)}` : ''
    fetch(
      `/api/availability?serviceVariationId=${encodeURIComponent(serviceVariationId)}&startDate=${startDate}&endDate=${endDate}${tmParam}`,
    )
      .then(r => r.json())
      .then((data: { availabilities?: Array<{ startAt?: string; seatsRemaining?: number }> }) => {
        const mapped: SquareSlot[] = (data.availabilities ?? [])
          .filter(a => a.startAt)
          .map(a => ({ startAt: a.startAt!, seatsRemaining: a.seatsRemaining ?? 0 }))
        setSlots(mapped)
      })
      .catch(() => setSlots([]))
      .finally(() => setLoading(false))
  }, [serviceVariationId, startDate, endDate, teamMemberId])

  return { slots, loading }
}
