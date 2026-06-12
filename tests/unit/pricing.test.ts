import { describe, it, expect } from 'vitest'
import { computeTaxBreakdown, computeVoucherDiscountCents, type AppliedVoucher } from '../../src/lib/squareServices'

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

describe('computeVoucherDiscountCents', () => {
  const pct = (percentage: number): AppliedVoucher => ({ code: 'C', name: 'C', kind: 'percentage', percentage })
  const amt = (amountCents: number): AppliedVoucher => ({ code: 'C', name: 'C', kind: 'amount', amountCents })

  it('percentage discount rounds to nearest cent', () => {
    // 10% of $46.01 = 460.1 → 460
    expect(computeVoucherDiscountCents(4601, pct(10))).toBe(460)
    // 15% of $46.00 = 690
    expect(computeVoucherDiscountCents(4600, pct(15))).toBe(690)
    // 33% of 4600 = 1518 (1517.999... rounds to 1518)
    expect(computeVoucherDiscountCents(4600, pct(33))).toBe(1518)
  })

  it('fixed amount discount returns the amount', () => {
    expect(computeVoucherDiscountCents(4600, amt(1000))).toBe(1000)
  })

  it('fixed amount exceeding base clamps to base', () => {
    expect(computeVoucherDiscountCents(4600, amt(10000))).toBe(4600)
  })

  it('0% discount yields no discount', () => {
    expect(computeVoucherDiscountCents(4600, pct(0))).toBe(0)
  })

  it('100% discount clamps to base', () => {
    expect(computeVoucherDiscountCents(4600, pct(100))).toBe(4600)
  })
})
