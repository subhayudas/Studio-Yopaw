import { describe, it, expect } from 'vitest'
import { computeTaxBreakdown } from '../../src/lib/squareServices'

describe('computeTaxBreakdown', () => {
  it('computes GST + QST on a single $46 class', () => {
    const { baseCents, gstCents, qstCents, totalCents } = computeTaxBreakdown(4600)
    expect(baseCents).toBe(4600)
    expect(gstCents).toBe(230)
    expect(qstCents).toBe(459)
    expect(totalCents).toBe(baseCents + gstCents + qstCents)
  })

  it('scales correctly for 11 attendees (1 primary + 10 extra)', () => {
    const base = 4600 * 11
    const { totalCents } = computeTaxBreakdown(base)
    expect(totalCents).toBeGreaterThan(base)
  })

  it('mat rental adds $5 flat (not taxed in front-end summary)', () => {
    const with_ = computeTaxBreakdown(4600 + 500)
    const without = computeTaxBreakdown(4600)
    expect(with_.totalCents).toBeGreaterThan(without.totalCents)
  })

  it('2 attendees + mat = correct total', () => {
    const base = 4600 * 2 + 500
    const { gstCents, qstCents, totalCents } = computeTaxBreakdown(base)
    expect(totalCents).toBe(base + gstCents + qstCents)
  })
})
