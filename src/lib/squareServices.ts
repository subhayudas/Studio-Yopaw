export const SQUARE_SERVICE_VARIATIONS = {
  yin: {
    serviceVariationId: import.meta.env.VITE_SQUARE_YIN_VARIATION_ID ?? '',
    serviceVariationVersion: Number(import.meta.env.VITE_SQUARE_YIN_VARIATION_VERSION ?? 0),
    teamMemberId: import.meta.env.VITE_SQUARE_TEAM_MEMBER_ID ?? '',
    amountCents: 4600,   // $46 CAD per person
    maxSeats: 20,
  },
  gentle: {
    serviceVariationId: import.meta.env.VITE_SQUARE_GENTLE_VARIATION_ID ?? '',
    serviceVariationVersion: Number(import.meta.env.VITE_SQUARE_GENTLE_VARIATION_VERSION ?? 0),
    teamMemberId: import.meta.env.VITE_SQUARE_TEAM_MEMBER_ID ?? '',
    amountCents: 4600,   // $46 CAD per person × group size
    maxSeats: 20,
  },
  corporate: {
    serviceVariationId: import.meta.env.VITE_SQUARE_CORP_VARIATION_ID ?? '',
    serviceVariationVersion: Number(import.meta.env.VITE_SQUARE_CORP_VARIATION_VERSION ?? 0),
    teamMemberId: import.meta.env.VITE_SQUARE_TEAM_MEMBER_ID ?? '',
    amountCents: 4600,   // $46 CAD per person × group size
    maxSeats: 20,
  },
}
