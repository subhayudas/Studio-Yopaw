const stripBom = (s: string | undefined): string => (s ?? '').replace(/^﻿/, '').trim()

export const TAX_RATES = { gst: 0.05, qst: 0.09975 } as const

export function computeTaxBreakdown(baseCents: number) {
  const gst = Math.round(baseCents * TAX_RATES.gst)
  const qst = Math.round(baseCents * TAX_RATES.qst)
  return { baseCents, gstCents: gst, qstCents: qst, totalCents: baseCents + gst + qst }
}

export type AppliedVoucher =
  | { code: string; name: string; kind: 'percentage'; percentage: number }
  | { code: string; name: string; kind: 'amount'; amountCents: number }

// Display-only discount math. The real charge is always the Square order total.
export function computeVoucherDiscountCents(baseCents: number, v: AppliedVoucher): number {
  const raw = v.kind === 'percentage'
    ? Math.round(baseCents * v.percentage / 100)
    : Math.min(v.amountCents, baseCents)
  return Math.max(0, Math.min(raw, baseCents))
}

export interface OrderQuote {
  subtotalCents: number
  discountCents: number
  gstCents: number
  qstCents: number
  totalCents: number
}

/**
 * Mirrors how the real Square order is built in api/booking.ts (display only):
 * - the ORDER-scoped discount applies to the whole subtotal (service + mat rental)
 *   and Square prorates it across line items,
 * - GST/QST apply to the SERVICE line only (mat rental is tax-free) on its
 *   discounted amount (MODIFY_TAX_BASIS).
 */
export function computeOrderQuote(
  serviceCents: number,
  matRentalCents: number,
  voucher: AppliedVoucher | null,
): OrderQuote {
  const subtotalCents = serviceCents + matRentalCents
  const discountCents = voucher ? computeVoucherDiscountCents(subtotalCents, voucher) : 0
  const serviceDiscount = subtotalCents > 0 ? Math.round(discountCents * serviceCents / subtotalCents) : 0
  const taxable = serviceCents - serviceDiscount
  const gstCents = Math.round(taxable * TAX_RATES.gst)
  const qstCents = Math.round(taxable * TAX_RATES.qst)
  return {
    subtotalCents,
    discountCents,
    gstCents,
    qstCents,
    totalCents: subtotalCents - discountCents + gstCents + qstCents,
  }
}

export interface AppliedGiftCard {
  nonce: string
  balanceCents: number
  last4: string
}

/** Split an order total between an applied gift card and the remaining card charge. */
export function splitGiftCard(totalCents: number, gift: AppliedGiftCard | null) {
  const giftCents = gift ? Math.min(gift.balanceCents, totalCents) : 0
  return { giftCents, cardCents: totalCents - giftCents }
}

export const SQUARE_SERVICE_VARIATIONS = {
  yin: {
    serviceVariationId: stripBom(import.meta.env.VITE_SQUARE_YIN_VARIATION_ID),
    serviceVariationVersion: Number(import.meta.env.VITE_SQUARE_YIN_VARIATION_VERSION ?? 0),
    teamMemberId: stripBom(import.meta.env.VITE_SQUARE_TEAM_MEMBER_ID),
    baseAmountCents: Number(import.meta.env.VITE_SQUARE_YIN_BASE_CENTS ?? 4600),
    serviceName: 'Regular Class',
    maxSeats: Number(import.meta.env.VITE_SQUARE_MAX_SEATS ?? 20),
  },
  gentle: {
    serviceVariationId: stripBom(import.meta.env.VITE_SQUARE_GENTLE_VARIATION_ID),
    serviceVariationVersion: Number(import.meta.env.VITE_SQUARE_GENTLE_VARIATION_VERSION ?? 0),
    teamMemberId: stripBom(import.meta.env.VITE_SQUARE_TEAM_MEMBER_ID),
    baseAmountCents: Number(import.meta.env.VITE_SQUARE_GENTLE_BASE_CENTS ?? 4600),
    serviceName: 'Private Event',
    maxSeats: Number(import.meta.env.VITE_SQUARE_MAX_SEATS ?? 20),
  },
  corporate: {
    serviceVariationId: stripBom(import.meta.env.VITE_SQUARE_CORP_VARIATION_ID),
    serviceVariationVersion: Number(import.meta.env.VITE_SQUARE_CORP_VARIATION_VERSION ?? 0),
    teamMemberId: stripBom(import.meta.env.VITE_SQUARE_TEAM_MEMBER_ID),
    baseAmountCents: Number(import.meta.env.VITE_SQUARE_CORP_BASE_CENTS ?? 4600),
    serviceName: 'Corporate Event',
    maxSeats: Number(import.meta.env.VITE_SQUARE_MAX_SEATS ?? 20),
  },
}
