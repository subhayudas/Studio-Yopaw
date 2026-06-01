import { test, expect } from '@playwright/test'

test('time modal: full slot shows disabled + Full text, available slot is clickable', async ({ page }) => {
  const d = new Date()
  d.setDate(d.getDate() + 10)
  const iso = d.toISOString().split('T')[0]

  await page.addInitScript(() => localStorage.setItem('studio-yopaw-lang', 'en'))

  // One slot full (0), one available (5)
  await page.route('**/api/availability**', r => r.fulfill({ json: { availabilities: [
    { startAt: `${iso}T14:30:00Z`, seatsRemaining: 0 },
    { startAt: `${iso}T16:00:00Z`, seatsRemaining: 5 },
  ]}}))
  await page.route('**/api/breeds**', r => r.fulfill({ json: { schedule: {
    [iso]: [{ breed: { en: 'Poodle', fr: 'Caniche' }, serviceIds: [] }],
  }}}))

  await page.goto('/#book')
  await expect(page.getByText('What kind of class are you looking for?')).toBeVisible()
  await page.locator('.pricing-choice-card', { hasText: 'Regular Class' }).click()
  await page.getByText("Yes, I'll bring my own").click()

  // Date row must be a button (has 1 available slot — not fully sold out)
  const dateRow = page.locator('.pricing-session-row').first()
  await expect(dateRow).toBeVisible({ timeout: 5_000 })
  await expect(dateRow).not.toHaveClass(/is-disabled/)

  // Open time modal
  await dateRow.click()
  await expect(page.locator('.pricing-time-modal')).toBeVisible()

  const slots = page.locator('.pricing-time-slot-row')
  await expect(slots).toHaveCount(2)

  // Slot 1: 14:30 — seatsRemaining 0 → disabled div with "Full"
  const fullSlot = slots.nth(0)
  await expect(fullSlot).toHaveClass(/is-disabled/)
  await expect(fullSlot).toContainText('Full')
  // Must be a div, not a button
  await expect(fullSlot).not.toHaveAttribute('type', 'button')

  // Slot 2: 16:00 — seatsRemaining 5 → clickable button with seat count
  const availSlot = slots.nth(1)
  await expect(availSlot).not.toHaveClass(/is-disabled/)
  await expect(availSlot).toContainText('5 spots remaining')
  await expect(availSlot).toHaveAttribute('type', 'button')
})

test('time modal: all slots full — date shows as sold-out row, modal never opens', async ({ page }) => {
  const d = new Date()
  d.setDate(d.getDate() + 10)
  const iso = d.toISOString().split('T')[0]

  await page.addInitScript(() => localStorage.setItem('studio-yopaw-lang', 'en'))

  // Both slots full
  await page.route('**/api/availability**', r => r.fulfill({ json: { availabilities: [
    { startAt: `${iso}T14:30:00Z`, seatsRemaining: 0 },
    { startAt: `${iso}T16:00:00Z`, seatsRemaining: 0 },
  ]}}))
  await page.route('**/api/breeds**', r => r.fulfill({ json: { schedule: {
    [iso]: [{ breed: { en: 'Poodle', fr: 'Caniche' }, serviceIds: [] }],
  }}}))

  await page.goto('/#book')
  await expect(page.getByText('What kind of class are you looking for?')).toBeVisible()
  await page.locator('.pricing-choice-card', { hasText: 'Regular Class' }).click()
  await page.getByText("Yes, I'll bring my own").click()

  // Date row must be a disabled div (all slots sold out)
  const dateRow = page.locator('.pricing-session-row.is-disabled').first()
  await expect(dateRow).toBeVisible({ timeout: 5_000 })
  await expect(dateRow).toContainText('Full')

  // Clicking the disabled row must NOT open the time modal
  await dateRow.click({ force: true })
  await expect(page.locator('.pricing-time-modal')).not.toBeVisible()
})
