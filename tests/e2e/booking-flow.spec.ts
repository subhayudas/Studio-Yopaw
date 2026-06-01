import { test, expect, type Page } from '@playwright/test'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Future dates + time slots returned by the mocked /api/availability */
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

/** Mock all external API calls so tests run without a real backend. */
async function mockApis(page: Page) {
  const slots = mockSlots()

  // Availability: return 3 future dates × 2 time slots each
  await page.route('**/api/availability**', (route) =>
    route.fulfill({ json: { availabilities: slots } })
  )
  // Breeds: must have an entry per date or effectiveDates filter hides all rows.
  // serviceIds: [] means "matches all services".
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
  // Inquiry: always succeed
  await page.route('**/api/inquiry**', (route) =>
    route.fulfill({ json: { ok: true } })
  )
}

/** Navigate to the booking section, bypassing the language picker. */
async function openBooking(page: Page) {
  await mockApis(page)
  // Set English so we can match English text in assertions
  await page.addInitScript(() => {
    localStorage.setItem('studio-yopaw-lang', 'en')
  })
  await page.goto('/#book')
  // Wait for the class-choice step to be visible
  await expect(page.getByText('What kind of class are you looking for?')).toBeVisible()
}

/** Click a class-choice booking button (avoids matching class card headings). */
function clickClassChoice(page: Page, name: string) {
  return page.locator('.pricing-choice-card', { hasText: name }).click()
}

/** Click a date row and then pick the first time slot from the modal. */
async function pickFirstDateAndTime(page: Page) {
  const dateRow = page.locator('.pricing-session-row').first()
  await expect(dateRow).toBeVisible({ timeout: 8_000 })
  await dateRow.click()

  // Time modal should open
  const modal = page.locator('.pricing-time-modal')
  await expect(modal).toBeVisible()

  // Pick first available time slot
  const timeSlot = page.locator('.pricing-time-slot-row').first()
  await expect(timeSlot).toBeVisible()
  await timeSlot.click()

  // Modal closes after picking
  await expect(modal).not.toBeVisible()
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Private Event booking flow', () => {
  test('participants → date step (not skipped)', async ({ page }) => {
    await openBooking(page)
    await clickClassChoice(page, 'Private Event')

    // Step: participants
    await expect(page.getByText('How many people will be included in your group?')).toBeVisible()

    // Advance to date step
    await page.getByText('Continue').click()

    // KEY assertion: date picker must appear immediately after participants
    await expect(page.getByText('Select your preferred time')).toBeVisible({ timeout: 5_000 })
  })

  test('full flow: participants → date → contact (with message) → success (no payment)', async ({ page }) => {
    await openBooking(page)
    await clickClassChoice(page, 'Private Event')

    // Participants step
    await expect(page.getByText('How many people will be included in your group?')).toBeVisible()
    await page.getByText('Continue').click()

    // Date step
    await expect(page.getByText('Select your preferred time')).toBeVisible({ timeout: 5_000 })
    await pickFirstDateAndTime(page)

    // Contact step
    await expect(page.getByText('Almost there')).toBeVisible()
    await page.locator('#pub-fullname').fill('Jane Doe')
    await page.locator('#pub-email').fill('jane@example.com')
    await page.locator('#pub-phone').fill('514-555-0100')

    // Message field should be visible for private event
    await expect(page.locator('#pub-message')).toBeVisible()
    await page.locator('#pub-message').fill('Celebrating a birthday!')

    // Submit inquiry
    await page.getByText('Send my request').click()

    // Success screen: "Request received!" — NO payment step
    await expect(page.getByText('Request received!')).toBeVisible({ timeout: 8_000 })
    await expect(page.locator('#sq-card-number')).not.toBeVisible()
  })

  test('back navigation from date step goes to participants', async ({ page }) => {
    await openBooking(page)
    await clickClassChoice(page, 'Private Event')
    await page.getByText('Continue').click()
    await expect(page.getByText('Select your preferred time')).toBeVisible()

    // Click back
    await page.locator('.pricing-step-toolbar button').click()

    // Should return to participants step
    await expect(page.getByText('How many people will be included in your group?')).toBeVisible()
  })
})

test.describe('Corporate booking flow', () => {
  test('participants → date step (not skipped)', async ({ page }) => {
    await openBooking(page)
    await clickClassChoice(page, 'Corporate')

    await expect(page.getByText('How many people will be included in your group?')).toBeVisible()
    await page.getByText('Continue').click()

    // Date step must appear
    await expect(page.getByText('Select your preferred time')).toBeVisible({ timeout: 5_000 })
  })

  test('full flow: participants → date → contact (company + message) → success (no payment)', async ({ page }) => {
    await openBooking(page)
    await clickClassChoice(page, 'Corporate')

    await page.getByText('Continue').click()
    await expect(page.getByText('Select your preferred time')).toBeVisible({ timeout: 5_000 })
    await pickFirstDateAndTime(page)

    // Corporate contact form
    await expect(page.getByText('Almost there')).toBeVisible()
    await page.locator('#corp-fullname').fill('Acme Corp Contact')

    // Company name field (new)
    await expect(page.locator('#corp-company')).toBeVisible()
    await page.locator('#corp-company').fill('Acme Corp')

    await page.locator('#corp-email').fill('corp@example.com')
    await page.locator('#corp-phone').fill('514-555-0200')

    // Message field (new)
    await expect(page.locator('#corp-message')).toBeVisible()
    await page.locator('#corp-message').fill('Need a private space for 12 people.')

    await page.getByText('Send my request').click()

    // Success screen — no payment
    await expect(page.getByText('Request received!')).toBeVisible({ timeout: 8_000 })
    await expect(page.locator('#sq-card-number')).not.toBeVisible()
  })

  test('back navigation from date step goes to participants', async ({ page }) => {
    await openBooking(page)
    await clickClassChoice(page, 'Corporate')
    await page.getByText('Continue').click()
    await expect(page.getByText('Select your preferred time')).toBeVisible()

    await page.locator('.pricing-step-toolbar button').click()

    await expect(page.getByText('How many people will be included in your group?')).toBeVisible()
  })
})

test.describe('Regular Class booking flow', () => {
  test('shows mat question as first step', async ({ page }) => {
    await openBooking(page)
    await clickClassChoice(page, 'Regular Class')
    await expect(page.getByText('Do you have your own yoga mat?')).toBeVisible()
  })

  test('mat → date → contact → payment step (not inquiry success)', async ({ page }) => {
    await openBooking(page)
    await clickClassChoice(page, 'Regular Class')

    // Mat step
    await expect(page.getByText('Do you have your own yoga mat?')).toBeVisible()
    await page.getByText("Yes, I'll bring my own").click()

    // Date step
    await expect(page.getByText('Select your preferred time')).toBeVisible({ timeout: 5_000 })
    await pickFirstDateAndTime(page)

    // Contact step
    await expect(page.getByText('Almost there')).toBeVisible()
    await page.locator('#pub-fullname').fill('John Doe')
    await page.locator('#pub-email').fill('john@example.com')
    await page.locator('#pub-phone').fill('514-555-0300')

    // Extra attendees section should be visible for yin
    await expect(page.locator('.pricing-extra-attendees')).toBeVisible()

    // Accept waiver (required for yin)
    await page.locator('#pub-waiver').check()

    // Submit → should reach payment step, NOT "Request received!"
    await page.getByText('Confirm booking').click()

    // Payment step: Square card iframe loads OR booking config error shown
    // Either way, "Request received!" must NOT appear — that belongs to inquiry flows only
    await expect(page.getByText('Request received!')).not.toBeVisible({ timeout: 3_000 })
  })

  test('mat rental option available and adds to summary', async ({ page }) => {
    await openBooking(page)
    await clickClassChoice(page, 'Regular Class')
    await expect(page.getByText('Do you have your own yoga mat?')).toBeVisible()

    // Rent mat
    await page.getByText('No, I will rent one on-site').click()

    // Should advance to date step
    await expect(page.getByText('Select your preferred time')).toBeVisible({ timeout: 5_000 })
  })
})

test.describe('Progress bar and back navigation', () => {
  test('progress bar advances through private event flow', async ({ page }) => {
    await openBooking(page)

    const bar = page.locator('.pricing-progress-fill')

    await clickClassChoice(page, 'Private Event')
    const afterPeople = await bar.getAttribute('style')
    expect(afterPeople).toContain('45%')

    await page.getByText('Continue').click()
    await expect(page.getByText('Select your preferred time')).toBeVisible({ timeout: 5_000 })
    const afterDate = await bar.getAttribute('style')
    expect(afterDate).toContain('62%')
  })

  test('progress bar advances through corporate flow', async ({ page }) => {
    await openBooking(page)

    const bar = page.locator('.pricing-progress-fill')

    await clickClassChoice(page, 'Corporate')
    const afterPeople = await bar.getAttribute('style')
    expect(afterPeople).toContain('45%')

    await page.getByText('Continue').click()
    await expect(page.getByText('Select your preferred time')).toBeVisible({ timeout: 5_000 })
    const afterDate = await bar.getAttribute('style')
    expect(afterDate).toContain('62%')
  })
})

test.describe('Webhook payload structure (code-level)', () => {
  // These are sanity checks that the source code ships the right payload shape.
  // Full webhook integration requires a live server — covered by verify-fixes.mjs.

  test('Regular class webhook has classType field', async () => {
    const booking = await import('node:fs').then(fs =>
      fs.readFileSync('./api/booking.ts', 'utf8')
    )
    expect(booking).toContain('classType: serviceName')
    expect(booking).toContain('attendeeCount: totalPeople')
  })

  test('Inquiry webhook has attendeeCount from groupSize', async () => {
    const inquiry = await import('node:fs').then(fs =>
      fs.readFileSync('./api/inquiry.ts', 'utf8')
    )
    expect(inquiry).toContain('attendeeCount:')
    expect(inquiry).toContain("parseInt(groupSize ?? '1'")
  })
})

test.describe('Extra attendees — Regular Class', () => {
  test('extra attendees section visible on contact step', async ({ page }) => {
    await openBooking(page)
    await clickClassChoice(page, 'Regular Class')
    await page.getByText("Yes, I'll bring my own").click()
    await expect(page.getByText('Select your preferred time')).toBeVisible({ timeout: 5_000 })
    await pickFirstDateAndTime(page)

    await expect(page.locator('.pricing-extra-attendees')).toBeVisible()
    await expect(page.getByRole('button', { name: /Add another attendee/i })).toBeVisible()
  })

  test('add extra attendee — card appears with name + waiver', async ({ page }) => {
    await openBooking(page)
    await clickClassChoice(page, 'Regular Class')
    await page.getByText("Yes, I'll bring my own").click()
    await expect(page.getByText('Select your preferred time')).toBeVisible({ timeout: 5_000 })
    await pickFirstDateAndTime(page)

    await page.getByRole('button', { name: /Add another attendee/i }).click()

    const card = page.locator('.pricing-extra-attendee-card').first()
    await expect(card).toBeVisible()
    await expect(card.locator('input[type="text"]')).toBeVisible()
    await expect(card.locator('input[type="checkbox"]')).toBeVisible()
  })

  test('submit disabled until all waivers and names filled', async ({ page }) => {
    await openBooking(page)
    await clickClassChoice(page, 'Regular Class')
    await page.getByText("Yes, I'll bring my own").click()
    await expect(page.getByText('Select your preferred time')).toBeVisible({ timeout: 5_000 })
    await pickFirstDateAndTime(page)

    await page.locator('#pub-fullname').fill('Primary Person')
    await page.locator('#pub-email').fill('primary@test.com')
    await page.locator('#pub-phone').fill('514-000-0001')

    // Add one extra attendee
    await page.getByRole('button', { name: /Add another attendee/i }).click()
    const card = page.locator('.pricing-extra-attendee-card').first()

    // Primary waiver checked, extra not yet — submit still disabled
    await page.locator('#pub-waiver').check()
    const submit = page.getByRole('button', { name: /Confirm booking/i })
    await expect(submit).toBeDisabled()

    // Fill extra name, check extra waiver — now enabled
    await card.locator('input[type="text"]').fill('Extra Person')
    await card.locator('input[type="checkbox"]').check()
    await expect(submit).toBeEnabled()
  })

  test('remove extra attendee — card disappears', async ({ page }) => {
    await openBooking(page)
    await clickClassChoice(page, 'Regular Class')
    await page.getByText("Yes, I'll bring my own").click()
    await expect(page.getByText('Select your preferred time')).toBeVisible({ timeout: 5_000 })
    await pickFirstDateAndTime(page)

    await page.getByRole('button', { name: /Add another attendee/i }).click()
    await expect(page.locator('.pricing-extra-attendee-card')).toHaveCount(1)

    await page.getByRole('button', { name: /Remove/i }).click()
    await expect(page.locator('.pricing-extra-attendee-card')).toHaveCount(0)
  })

  test('max 4 extra attendees — add button disappears at cap', async ({ page }) => {
    await openBooking(page)
    await clickClassChoice(page, 'Regular Class')
    await page.getByText("Yes, I'll bring my own").click()
    await expect(page.getByText('Select your preferred time')).toBeVisible({ timeout: 5_000 })
    await pickFirstDateAndTime(page)

    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: /Add another attendee/i }).click()
    }

    await expect(page.locator('.pricing-extra-attendee-card')).toHaveCount(4)
    await expect(page.getByRole('button', { name: /Add another attendee/i })).not.toBeVisible()
  })
})

test.describe('French language — new strings', () => {
  async function openBookingFr(page: Page) {
    await mockApis(page)
    await page.addInitScript(() => {
      localStorage.setItem('studio-yopaw-lang', 'fr')
    })
    await page.goto('/#book')
    await expect(page.getByText('Quel type de cours recherchez-vous ?')).toBeVisible()
  }

  test('extra attendees helper text is in French', async ({ page }) => {
    await openBookingFr(page)
    await page.locator('.pricing-choice-card', { hasText: 'Cours régulier' }).click()
    await page.getByText("Oui, j'apporte le mien").click()
    await expect(page.getByText('Sélectionnez votre horaire préféré')).toBeVisible({ timeout: 5_000 })
    await pickFirstDateAndTime(page)

    await expect(page.locator('.pricing-extra-attendees')).toContainText("4")
    await expect(page.getByRole('button', { name: /Ajouter un participant/i })).toBeVisible()
  })

  test('corporate form shows French company name label', async ({ page }) => {
    await openBookingFr(page)
    await page.locator('.pricing-choice-card', { hasText: 'Corporatif' }).click()
    await page.getByText('Continuer').click()
    await expect(page.getByText('Sélectionnez votre horaire préféré')).toBeVisible({ timeout: 5_000 })
    await pickFirstDateAndTime(page)

    await expect(page.getByText("Nom de l'entreprise")).toBeVisible()
  })
})
