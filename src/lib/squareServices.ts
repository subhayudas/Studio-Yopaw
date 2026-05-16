const stripBom = (s: string | undefined): string => (s ?? '').replace(/^﻿/, '').trim()

export const SQUARE_SERVICE_VARIATIONS = {
  yin: {
    serviceVariationId: stripBom(import.meta.env.VITE_SQUARE_YIN_VARIATION_ID),
    serviceVariationVersion: Number(import.meta.env.VITE_SQUARE_YIN_VARIATION_VERSION ?? 0),
    teamMemberId: stripBom(import.meta.env.VITE_SQUARE_TEAM_MEMBER_ID),
    amountCents: 4600,   // $46 CAD per person
    maxSeats: 20,
  },
  gentle: {
    serviceVariationId: stripBom(import.meta.env.VITE_SQUARE_GENTLE_VARIATION_ID),
    serviceVariationVersion: Number(import.meta.env.VITE_SQUARE_GENTLE_VARIATION_VERSION ?? 0),
    teamMemberId: stripBom(import.meta.env.VITE_SQUARE_TEAM_MEMBER_ID),
    amountCents: 4600,   // $46 CAD per person × group size
    maxSeats: 20,
  },
  corporate: {
    serviceVariationId: stripBom(import.meta.env.VITE_SQUARE_CORP_VARIATION_ID),
    serviceVariationVersion: Number(import.meta.env.VITE_SQUARE_CORP_VARIATION_VERSION ?? 0),
    teamMemberId: stripBom(import.meta.env.VITE_SQUARE_TEAM_MEMBER_ID),
    amountCents: 4600,   // $46 CAD per person × group size
    maxSeats: 20,
  },
}
