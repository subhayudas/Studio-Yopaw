import { describe, it, expect } from 'vitest'
import { siteStrings } from '../../src/i18n/siteStrings'

const KEYS = [
  'pricingExtraAttendeesHelper',
  'pricingExtraAttendeeName',
  'pricingAddAttendee',
  'pricingRemoveAttendee',
  'pricingExtraAttendeeWaiver',
  'pricingLblMessage',
  'pricingLblCompanyName',
  'inquirySubmitLabel',
  'inquirySubmitting',
  'inquirySubmitError',
] as const

describe('i18n — all keys present in both languages', () => {
  for (const key of KEYS) {
    it(`EN["${key}"] is non-empty`, () => expect((siteStrings.en as Record<string, unknown>)[key]).toBeTruthy())
    it(`FR["${key}"] is non-empty`, () => expect((siteStrings.fr as Record<string, unknown>)[key]).toBeTruthy())
  }
})

describe('i18n — extra attendee limit is 10', () => {
  it('EN helper text mentions 10', () => expect(siteStrings.en.pricingExtraAttendeesHelper).toContain('10'))
  it('FR helper text mentions 10', () => expect(siteStrings.fr.pricingExtraAttendeesHelper).toContain('10'))
})
