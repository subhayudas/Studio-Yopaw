import { useEffect, useRef, useCallback, useState } from 'react'

/**
 * Vanilla Square Web Payments SDK hook.
 *
 * Uses the global `window.Square` object loaded via
 * `<script src="https://web.squarecdn.com/v1/square.js">` in index.html.
 *
 * Unlike `react-square-web-payments-sdk`, this works perfectly with
 * conditional rendering because we manually attach/detach the card element.
 */

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => Promise<SquarePayments>
    }
  }
}

interface SquarePayments {
  card: () => Promise<SquareCard>
  giftCard: () => Promise<SquareCard>
}

interface SquareCard {
  attach: (selector: string) => Promise<void>
  destroy: () => Promise<void>
  tokenize: () => Promise<{ status: string; token?: string; errors?: Array<{ message: string }> }>
}

interface UseSquareCardReturn {
  /** Ref to assign to the container div where the card form renders */
  containerRef: React.RefObject<HTMLDivElement | null>
  /** Call this to tokenize the entered card and get a nonce */
  tokenize: () => Promise<{ nonce: string } | { error: string }>
  /** Whether the card form is currently initializing */
  loading: boolean
  /** Whether the card form has been successfully attached */
  ready: boolean
  /** SDK-level error (script not loaded, init failed, etc.) */
  sdkError: string | null
}

interface UseSquareCardOptions {
  /** Which Web Payments SDK element to mount. Default 'card'. */
  method?: 'card' | 'giftCard'
  /** DOM id of the container div (without #). Default 'sq-card-container'. */
  containerId?: string
  /** Set false to defer initialisation (e.g. gift-card panel not opened yet). Default true. */
  enabled?: boolean
}

export function useSquareCard(
  appId: string,
  locationId: string,
  { method = 'card', containerId = 'sq-card-container', enabled = true }: UseSquareCardOptions = {},
): UseSquareCardReturn {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const cardRef = useRef<SquareCard | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [ready, setReady] = useState(false)
  const [sdkError, setSdkError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function init() {
      setLoading(true)
      setReady(false)
      setSdkError(null)

      // Wait for square.js to load (it may still be downloading)
      let attempts = 0
      while (!window.Square && attempts < 40) {
        await new Promise(r => setTimeout(r, 250))
        attempts++
      }

      if (!window.Square) {
        setSdkError('Square.js failed to load')
        setLoading(false)
        return
      }

      if (cancelled) return

      try {
        const payments = await window.Square.payments(appId, locationId)
        const card = method === 'giftCard' ? await payments.giftCard() : await payments.card()

        if (cancelled) {
          await card.destroy()
          return
        }

        cardRef.current = card

        // Wait a tick for the container div to be in the DOM
        await new Promise(r => setTimeout(r, 50))

        if (containerRef.current && !cancelled) {
          await card.attach(`#${containerId}`)
          setReady(true)
        }
      } catch (err) {
        if (!cancelled) {
          setSdkError(err instanceof Error ? err.message : 'Card form failed to initialize')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (!enabled) {
      setLoading(false)
      setReady(false)
    } else if (appId && locationId) {
      void init()
    } else {
      setLoading(false)
      setSdkError('Square credentials not configured')
    }

    return () => {
      cancelled = true
      if (cardRef.current) {
        void cardRef.current.destroy().catch(() => {})
        cardRef.current = null
      }
    }
  }, [appId, locationId, method, containerId, enabled])

  const tokenize = useCallback(async (): Promise<{ nonce: string } | { error: string }> => {
    if (!cardRef.current) return { error: 'Card form not ready' }
    try {
      const result = await cardRef.current.tokenize()
      if (result.status === 'OK' && result.token) {
        return { nonce: result.token }
      }
      const msg = result.errors?.[0]?.message ?? 'Card tokenization failed'
      return { error: msg }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Tokenization error' }
    }
  }, [])

  return { containerRef, tokenize, loading, ready, sdkError }
}
