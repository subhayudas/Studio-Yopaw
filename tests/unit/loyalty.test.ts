import { describe, it, expect } from 'vitest'
import { toE164 } from '../../api/_loyalty'

describe('toE164', () => {
  it('normalises common North-American formats', () => {
    expect(toE164('514-242-4947')).toBe('+15142424947')
    expect(toE164('(514) 242 4947')).toBe('+15142424947')
    expect(toE164('1 514 242 4947')).toBe('+15142424947')
    expect(toE164('+1 514-242-4947')).toBe('+15142424947')
  })
  it('accepts international numbers with a + prefix', () => {
    expect(toE164('+33 1 23 45 67 89')).toBe('+33123456789')
  })
  it('returns null for unusable input', () => {
    expect(toE164('12345')).toBeNull()
    expect(toE164('')).toBeNull()
  })
})
