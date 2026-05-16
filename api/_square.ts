import { SquareClient, SquareEnvironment } from 'square'

export function stripBom(s: string): string {
  while (s.charCodeAt(0) === 0xFEFF) s = s.slice(1)
  return s.trim()
}

const token  = stripBom(process.env.SQUARE_ACCESS_TOKEN  ?? '')
const envStr = stripBom(process.env.SQUARE_ENVIRONMENT   ?? '')

export const square = new SquareClient({
  token,
  environment: envStr === 'production'
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox,
})

export function getLocationId(): string {
  return stripBom(process.env.SQUARE_LOCATION_ID ?? '')
}
