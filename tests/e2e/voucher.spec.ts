import { test, expect, type Page } from '@playwright/test'

// ─── Helpers (mirrors booking-flow.spec.ts conventions) ─────────────────────────

function mockSlots() {
  const slots: { startAt: string; seatsRemaining: number }[] = []
  const base = new Date()
  base.setDate(base.getDate() + 10)
  for (let i = 0; i < 3; i++) {
    const d = new Date(base)
    d.setDate(d.getDate() + i)
    const iso = d.toISOString().split('T')[0]
    slots.push({ startAt: `${iso}T14:30:00Z`, seatsRemaining: 15 })
    slots.push({ startAt: `${iso}T16:00:00Z`, seatsRemaining: 10 })
  }
  return slots
}

async function mockApis(page: Page) {
  const slots = mockSlots()

  await page.route('**/api/availability**', (route) =>
    route.fulfill({ json: { availabilities: slots } })
  )
  await page.route('**/api/breeds**', (route) => {
    const schedule: Record<string, Array<{ breed: { en: string; fr: string }; serviceIds: string[] }>> = {}
    for (const slot of slots) {
      const date = slot.startAt.split('T')[0]
      if (!schedule[date]) {
        schedule[date] = [{ breed: { en: 'Golden Retriever', fr: 'Golden Retriever' }, serviceIds: [] }]
      }
    }
    route.fulfill({ json: { schedule } })
  })
  // Voucher: VALID10 → 10% off; everything else → not found.
  await page.route('**/api/voucher**', async (route) => {
    const req = route.request()
    let code = ''
    try {
      code = String((req.postDataJSON() as { code?: unknown })?.code ?? '').trim()
    } catch {
      code = ''
    }
    if (code.toLowerCase() === 'valid10') {
      await route.fulfill({ json: { valid: true, code, name: 'VALID10', kind: 'percentage', percentage: 10 } })
    } else {
      await route.fulfill({ json: { valid: false, reason: 'not_found' } })
    }
  })
}

async function openBooking(page: Page) {
  await mockApis(page)
  await page.addInitScript(() => {
    localStorage.setItem('studio-yopaw-lang', 'en')
  })
  await page.goto('/#book')
  await expect(page.getByText('What kind of class are you looking for?')).toBeVisible()
}

function clickClassChoice(page: Page, name: string) {
  return page.locator('.pricing-choice-card', { hasText: name }).click()
}

async function pickFirstDateAndTime(page: Page) {
  const dateRow = page.locator('.pricing-session-row').first()
  await expect(dateRow).toBeVisible({ timeout: 8_000 })
  await dateRow.click()
  const modal = page.locator('.pricing-time-modal')
  await expect(modal).toBeVisible()
  const timeSlot = page.locator('.pricing-time-slot-row').first()
  await expect(timeSlot).toBeVisible()
  await timeSlot.click()
  await expect(modal).not.toBeVisible()
}

/** Drive a Regular Class booking up to the payment step. */
async function reachPaymentStep(page: Page) {
  await openBooking(page)
  await clickClassChoice(page, 'Regular Class')
  await expect(page.getByText('Do you have your own yoga mat?')).toBeVisible()
  await page.getByText("Yes, I'll bring my own").click()
  await expect(page.getByText('Select your preferred time')).toBeVisible({ timeout: 5_000 })
  await pickFirstDateAndTime(page)
  await expect(page.getByText('Almost there')).toBeVisible()
  await page.locator('#pub-fullname').fill('John Doe')
  await page.locator('#pub-email').fill('john@example.com')
  await page.locator('#pub-phone').fill('514-555-0300')
  await page.locator('#pub-waiver').check()
  await page.getByText('Confirm booking').click()
  await expect(page.locator('#voucher-code')).toBeVisible({ timeout: 5_000 })
}

// ─── Tests ──────────────────────────────────────────────────────────────────────

test.describe('Voucher / discount code', () => {
  test('valid code applies a discount row and lowers the total', async ({ page }) => {
    await reachPaymentStep(page)

    // $46 base + GST 230 + QST 459 = $52.89 before discount.
    const totalRow = page.locator('.pricing-payment-summary-total .pricing-payment-summary-amount')
    await expect(totalRow).toHaveText('$52.89')

    await page.locator('#voucher-code').fill('VALID10')
    await page.getByRole('button', { name: 'Apply' }).click()

    // Applied chip appears
    await expect(page.locator('.pricing-voucher-applied')).toBeVisible()
    await expect(page.locator('.pricing-voucher-applied')).toContainText('VALID10')

    // Discount row shows the voucher name with a negative amount.
    const discountRow = page.locator('.pricing-payment-summary-discount')
    await expect(discountRow).toBeVisible()
    await expect(discountRow.locator('.pricing-payment-summary-amount')).toContainText('−$4.60')

    // Taxes recomputed on discounted base 4140 → gst 207 + qst 413 → total $47.60
    await expect(totalRow).toHaveText('$47.60')
  })

  test('invalid code shows an error and applies no discount', async ({ page }) => {
    await reachPaymentStep(page)

    await page.locator('#voucher-code').fill('NOPE')
    await page.getByRole('button', { name: 'Apply' }).click()

    await expect(page.locator('.pricing-voucher-error')).toBeVisible()
    await expect(page.getByText('This code is invalid or expired.')).toBeVisible()
    await expect(page.locator('.pricing-payment-summary-discount')).toHaveCount(0)
    await expect(page.locator('.pricing-voucher-applied')).toHaveCount(0)

    const totalRow = page.locator('.pricing-payment-summary-total .pricing-payment-summary-amount')
    await expect(totalRow).toHaveText('$52.89')
  })

  test('removing an applied voucher restores the full total', async ({ page }) => {
    await reachPaymentStep(page)

    await page.locator('#voucher-code').fill('VALID10')
    await page.getByRole('button', { name: 'Apply' }).click()

    const totalRow = page.locator('.pricing-payment-summary-total .pricing-payment-summary-amount')
    await expect(totalRow).toHaveText('$47.60')

    await page.getByRole('button', { name: 'Remove' }).click()

    await expect(page.locator('.pricing-voucher-applied')).toHaveCount(0)
    await expect(page.locator('.pricing-payment-summary-discount')).toHaveCount(0)
    await expect(page.locator('#voucher-code')).toBeVisible()
    await expect(totalRow).toHaveText('$52.89')
  })
})
