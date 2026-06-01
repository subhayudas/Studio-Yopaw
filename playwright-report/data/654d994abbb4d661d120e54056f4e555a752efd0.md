# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: booking-flow.spec.ts >> Seat count display — multi-attendee >> slot with 0 seats remaining is hidden from the date picker
- Location: tests\e2e\booking-flow.spec.ts:413:3

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('.pricing-session-row')
Expected: 0
Received: 1
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" with timeout 5000ms
  - waiting for locator('.pricing-session-row')
    14 × locator resolved to 1 element
       - unexpected value "1"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - generic [ref=e5]:
      - link "Studio Yopaw" [ref=e6] [cursor=pointer]:
        - /url: /
        - img "Studio Yopaw" [ref=e7]
      - list [ref=e8]:
        - listitem [ref=e9]:
          - link "How It Works" [ref=e10] [cursor=pointer]:
            - /url: /#experience
        - listitem [ref=e11]:
          - link "Class Types" [ref=e12] [cursor=pointer]:
            - /url: /#classes
        - listitem [ref=e13]:
          - link "Pricing" [ref=e14] [cursor=pointer]:
            - /url: /#pricing
        - listitem [ref=e15]:
          - link "Our Values" [ref=e16] [cursor=pointer]:
            - /url: /#about
        - listitem [ref=e17]:
          - link "FAQ" [ref=e18] [cursor=pointer]:
            - /url: /#faq
      - generic [ref=e19]:
        - button "Afficher en français" [ref=e20] [cursor=pointer]: FR
        - link "Book a Session" [ref=e21] [cursor=pointer]:
          - /url: /#book
  - generic [ref=e22]:
    - generic [ref=e25]:
      - heading "Yoga. Puppies. Happiness guaranteed." [level=1] [ref=e26]:
        - text: Yoga. Puppies.
        - emphasis [ref=e27]: Happiness guaranteed.
      - paragraph [ref=e28]: Join us for yoga in a room full of puppies, right here in Saint-Lazare,
      - generic [ref=e29]:
        - link "Book a Session" [ref=e30] [cursor=pointer]:
          - /url: "#book"
        - link "Our Classes" [ref=e31] [cursor=pointer]:
          - /url: "#classes"
    - generic [ref=e33]: Scroll
  - generic [ref=e36]:
    - generic [ref=e37]: No Dog Required
    - generic [ref=e38]: ·
    - generic [ref=e39]: Saint-Lazare, QC
    - generic [ref=e40]: ·
    - generic [ref=e41]: 60-Minute Sessions
    - generic [ref=e42]: ·
    - generic [ref=e43]: All Levels Welcome
    - generic [ref=e44]: ·
    - generic [ref=e45]: Up To 20 Spots Available Per Session
    - generic [ref=e46]: ·
    - generic [ref=e47]: All the Photos You Want
    - generic [ref=e48]: ·
    - generic [ref=e49]: Gentle Flow — Open to Everyone
    - generic [ref=e50]: ·
    - generic [ref=e51]: Stress Relief Guaranteed
    - generic [ref=e52]: ·
    - generic [ref=e53]: Namaste & Play
    - generic [ref=e54]: ·
    - generic [ref=e55]: Book Online In Minutes
    - generic [ref=e56]: ·
    - generic [ref=e57]: 72-Hour Cancellation Policy
    - generic [ref=e58]: ·
    - generic [ref=e59]: No Dog Required
    - generic [ref=e60]: ·
    - generic [ref=e61]: Saint-Lazare, QC
    - generic [ref=e62]: ·
    - generic [ref=e63]: 60-Minute Sessions
    - generic [ref=e64]: ·
    - generic [ref=e65]: All Levels Welcome
    - generic [ref=e66]: ·
    - generic [ref=e67]: Up To 20 Spots Available Per Session
    - generic [ref=e68]: ·
    - generic [ref=e69]: All the Photos You Want
    - generic [ref=e70]: ·
    - generic [ref=e71]: Gentle Flow — Open to Everyone
    - generic [ref=e72]: ·
    - generic [ref=e73]: Stress Relief Guaranteed
    - generic [ref=e74]: ·
    - generic [ref=e75]: Namaste & Play
    - generic [ref=e76]: ·
    - generic [ref=e77]: Book Online In Minutes
    - generic [ref=e78]: ·
    - generic [ref=e79]: 72-Hour Cancellation Policy
    - generic [ref=e80]: ·
  - generic [ref=e81]:
    - generic [ref=e82]:
      - heading "The 60 most delightful minutes of your week!" [level=2] [ref=e83]:
        - text: The 60 most delightful
        - emphasis [ref=e84]: minutes of your week!
      - paragraph [ref=e85]: Gentle yoga, a room full of puppies, zero stress.
    - generic [ref=e86]:
      - generic [ref=e87]:
        - img "Warm up" [ref=e89]
        - generic [ref=e90]: 15 min
        - heading "Warm Up" [level=3] [ref=e91]
        - paragraph [ref=e92]: Breathe, settle, and forget about your day. Gentle movement, soft music, just you and your mat.
      - generic [ref=e93]:
        - img "Flow with puppies" [ref=e95]
        - generic [ref=e96]: 15 min
        - heading "Gentle flow with the pups" [level=3] [ref=e97]
        - paragraph [ref=e98]: This is the puppies' big entrance—our team brings them out for you. Good luck staying focused and keeping a straight face!
      - generic [ref=e99]:
        - img "Play and connect" [ref=e101]
        - generic [ref=e102]: 30 min
        - heading "Play & Connect" [level=3] [ref=e103]
        - paragraph [ref=e104]: Mats rolled away, phones out. Free play, cuddles, and as many photos as you want. Total chaos. Pure joy.
    - link "Reserve my spot" [ref=e106] [cursor=pointer]:
      - /url: "#book"
  - generic [ref=e107]:
    - generic [ref=e108]:
      - generic [ref=e109]: WHAT WE OFFER
      - heading "Less Stress. More Puppies." [level=2] [ref=e110]:
        - text: Less Stress.
        - emphasis [ref=e111]: More Puppies
        - text: .
    - generic [ref=e112]:
      - generic [ref=e113]:
        - generic [ref=e114]:
          - img "Regular Class" [ref=e115]
          - generic [ref=e116]: 60 min
        - generic [ref=e117]:
          - heading "Regular Class" [level=3] [ref=e118]
          - paragraph [ref=e119]: Accessible movement in a warm, welcoming space. Move at your own pace surrounded by puppies.
      - generic [ref=e120]:
        - generic [ref=e121]:
          - img "Private Event" [ref=e122]
          - generic [ref=e123]: Flexible
        - generic [ref=e124]:
          - heading "Private Event" [level=3] [ref=e125]
          - paragraph [ref=e126]: Book a private puppy yoga session for your group. Birthdays, girls' night, retirement send-offs—any excuse works for an exclusive experience built around you.
      - generic [ref=e127]:
        - generic [ref=e128]:
          - img "Corporate" [ref=e129]
          - generic [ref=e130]: Flexible
        - generic [ref=e131]:
          - heading "Corporate" [level=3] [ref=e132]
          - paragraph [ref=e133]: Turn your next team-building day into a feel-good, puppy-filled experience people will actually remember.
    - link "Reserve my spot" [ref=e135] [cursor=pointer]:
      - /url: "#book"
  - generic [ref=e137]:
    - generic [ref=e138]:
      - generic [ref=e139]: Book your session
      - heading "Ready to Meet the Pups ?" [level=2] [ref=e140]:
        - text: Ready to Meet the
        - emphasis [ref=e141]: Pups
        - text: "?"
      - paragraph [ref=e142]: Choose your session type, pick a date, and we will see you on the mat!
    - generic [ref=e143]:
      - paragraph [ref=e144]: $46 + taxes · Per session
      - list [ref=e145]:
        - listitem [ref=e146]: ✓ 60-minute activity
        - listitem [ref=e147]: ✓ Gentle flow accessible to all
      - separator [ref=e148]
      - generic [ref=e149]:
        - button "Back" [ref=e154] [cursor=pointer]:
          - img [ref=e155]
        - generic [ref=e157]:
          - heading "Select your preferred time" [level=3] [ref=e158]
          - button "Thu, Jun 11, 2026 (Golden Retriever) Choose time" [ref=e160] [cursor=pointer]:
            - generic [ref=e161]:
              - text: Thu, Jun 11, 2026
              - generic [ref=e162]: (Golden Retriever)
            - generic [ref=e163]: Choose time
  - generic [ref=e164]:
    - generic [ref=e165]:
      - generic [ref=e166]: The Studio
      - heading "Moments of Joy" [level=2] [ref=e167]:
        - text: Moments of
        - emphasis [ref=e168]: Joy
      - paragraph [ref=e169]: Every session is a memory in the making.
    - generic [ref=e170]:
      - generic [ref=e171] [cursor=pointer]:
        - img "Studio Yopaw session" [ref=e172]
        - img [ref=e174]
      - generic [ref=e180] [cursor=pointer]:
        - img "Class in session" [ref=e181]
        - img [ref=e183]
      - generic [ref=e189] [cursor=pointer]:
        - img "Happy pup moment" [ref=e190]
        - img [ref=e192]
      - generic [ref=e198] [cursor=pointer]:
        - img "Yoga flow with puppies" [ref=e199]
        - img [ref=e201]
      - generic [ref=e207] [cursor=pointer]:
        - img "Studio highlight" [ref=e208]
        - img [ref=e210]
  - generic [ref=e217]:
    - generic [ref=e218]:
      - generic [ref=e219]: Our Values
      - heading "Yoga. Puppies. Happiness guaranteed." [level=2] [ref=e220]:
        - text: Yoga. Puppies.
        - emphasis [ref=e221]: Happiness guaranteed
        - text: .
      - paragraph [ref=e222]: Studio Yopaw grew out of a love for dogs and the grounding calm that yoga brings. Founded in 2026 by Joëlle Castonguay in Saint-Lazare, our studio offers dog-assisted wellness that welcomes everyone.
      - paragraph [ref=e223]: Our yoga teachers lead every session with care and skill—whether it is your first class or you have been practicing for years, our four-legged co-teachers make everything feel that much more magical.
      - paragraph [ref=e224]: At Studio Yopaw, the health, safety, and well-being of our puppies are our top priority. We are committed to providing a safe, clean, and respectful environment, in collaboration with responsible breeders who care deeply for each puppy's needs. All puppies are vaccinated and are given adequate time to rest, eat, and hydrate between each session to ensure their comfort and well-being at all times.
      - link "Explore our classes →" [ref=e225] [cursor=pointer]:
        - /url: "#classes"
    - generic [ref=e226]:
      - img "Studio Yopaw puppy yoga session" [ref=e227]
      - img [ref=e229]
      - img [ref=e236]
      - img [ref=e243]
  - generic [ref=e249]:
    - generic [ref=e250]:
      - generic [ref=e251]: Got Questions?
      - heading "Frequently Asked Questions" [level=2] [ref=e252]:
        - text: Frequently Asked
        - emphasis [ref=e253]: Questions
      - paragraph [ref=e254]: Everything you need to know before your first class.
    - generic [ref=e255]:
      - generic [ref=e257] [cursor=pointer]:
        - generic [ref=e258]: Do I need to own a dog to attend?
        - generic [ref=e259]: +
      - generic [ref=e261] [cursor=pointer]:
        - generic [ref=e262]: What is the minimum age to participate?
        - generic [ref=e263]: +
      - generic [ref=e265] [cursor=pointer]:
        - generic [ref=e266]: Do I need yoga experience?
        - generic [ref=e267]: +
      - generic [ref=e269] [cursor=pointer]:
        - generic [ref=e270]: Will the dogs distract me?
        - generic [ref=e271]: +
      - generic [ref=e273] [cursor=pointer]:
        - generic [ref=e274]: What should I bring?
        - generic [ref=e275]: +
      - generic [ref=e277] [cursor=pointer]:
        - generic [ref=e278]: What is your cancellation policy?
        - generic [ref=e279]: +
  - contentinfo [ref=e280]:
    - generic [ref=e281]:
      - generic [ref=e282]:
        - img "Studio Yopaw" [ref=e284]
        - paragraph [ref=e285]:
          - text: Yoga and animal-assisted therapy—the perfect zero-stress blend.
          - text: Every pose is better with a puppy!
        - generic [ref=e286]:
          - link "Instagram" [ref=e287] [cursor=pointer]:
            - /url: https://instagram.com/studioyopaw
            - img [ref=e288]
          - link "Facebook" [ref=e290] [cursor=pointer]:
            - /url: "#"
            - img [ref=e291]
      - generic [ref=e293]:
        - heading "Navigate" [level=4] [ref=e294]
        - list [ref=e295]:
          - listitem [ref=e296]:
            - link "How It Works" [ref=e297] [cursor=pointer]:
              - /url: /#experience
          - listitem [ref=e298]:
            - link "Class Types" [ref=e299] [cursor=pointer]:
              - /url: /#classes
          - listitem [ref=e300]:
            - link "Pricing" [ref=e301] [cursor=pointer]:
              - /url: /#pricing
          - listitem [ref=e302]:
            - link "Our Values" [ref=e303] [cursor=pointer]:
              - /url: /#about
          - listitem [ref=e304]:
            - link "FAQ" [ref=e305] [cursor=pointer]:
              - /url: /#faq
          - listitem [ref=e306]:
            - link "Liability Waiver" [ref=e307] [cursor=pointer]:
              - /url: /waiver
          - listitem [ref=e308]:
            - link "Refund Policy" [ref=e309] [cursor=pointer]:
              - /url: /refund-policy
      - generic [ref=e310]:
        - heading "Find Us" [level=4] [ref=e311]
        - paragraph [ref=e312]:
          - text: 1515A Des Marguerites St.
          - text: Saint-Lazare, QC J7T 2R8
        - paragraph [ref=e313]:
          - link "Studioyopaw@gmail.com" [ref=e314] [cursor=pointer]:
            - /url: mailto:Studioyopaw@gmail.com
        - paragraph [ref=e315]:
          - link "514-242-4947" [ref=e316] [cursor=pointer]:
            - /url: tel:5142424947
        - paragraph [ref=e317]:
          - link "www.yopaw.ca" [ref=e318] [cursor=pointer]:
            - /url: https://www.yopaw.ca
    - paragraph [ref=e320]: © 2026 Studio Yopaw · Saint-Lazare, QC
```

# Test source

```ts
  337 |     await page.locator('#pub-email').fill('primary@test.com')
  338 |     await page.locator('#pub-phone').fill('514-000-0001')
  339 | 
  340 |     // Add one extra attendee
  341 |     await page.getByRole('button', { name: /Add another attendee/i }).click()
  342 |     const card = page.locator('.pricing-extra-attendee-card').first()
  343 | 
  344 |     // Primary waiver checked, extra not yet — submit still disabled
  345 |     await page.locator('#pub-waiver').check()
  346 |     const submit = page.getByRole('button', { name: /Confirm booking/i })
  347 |     await expect(submit).toBeDisabled()
  348 | 
  349 |     // Fill extra name, check extra waiver — now enabled
  350 |     await card.locator('input[type="text"]').fill('Extra Person')
  351 |     await card.locator('input[type="checkbox"]').check()
  352 |     await expect(submit).toBeEnabled()
  353 |   })
  354 | 
  355 |   test('remove extra attendee — card disappears', async ({ page }) => {
  356 |     await openBooking(page)
  357 |     await clickClassChoice(page, 'Regular Class')
  358 |     await page.getByText("Yes, I'll bring my own").click()
  359 |     await expect(page.getByText('Select your preferred time')).toBeVisible({ timeout: 5_000 })
  360 |     await pickFirstDateAndTime(page)
  361 | 
  362 |     await page.getByRole('button', { name: /Add another attendee/i }).click()
  363 |     await expect(page.locator('.pricing-extra-attendee-card')).toHaveCount(1)
  364 | 
  365 |     await page.getByRole('button', { name: /Remove/i }).click()
  366 |     await expect(page.locator('.pricing-extra-attendee-card')).toHaveCount(0)
  367 |   })
  368 | 
  369 |   test('max 10 extra attendees — add button disappears at cap', async ({ page }) => {
  370 |     await openBooking(page)
  371 |     await clickClassChoice(page, 'Regular Class')
  372 |     await page.getByText("Yes, I'll bring my own").click()
  373 |     await expect(page.getByText('Select your preferred time')).toBeVisible({ timeout: 5_000 })
  374 |     await pickFirstDateAndTime(page)
  375 | 
  376 |     for (let i = 0; i < 10; i++) {
  377 |       await page.getByRole('button', { name: /Add another attendee/i }).click()
  378 |     }
  379 | 
  380 |     await expect(page.locator('.pricing-extra-attendee-card')).toHaveCount(10)
  381 |     await expect(page.getByRole('button', { name: /Add another attendee/i })).not.toBeVisible()
  382 |   })
  383 | })
  384 | 
  385 | test.describe('Seat count display — multi-attendee', () => {
  386 |   test('slot with 1 seat remaining is shown in the date picker', async ({ page }) => {
  387 |     await page.addInitScript(() => localStorage.setItem('studio-yopaw-lang', 'en'))
  388 | 
  389 |     const d = new Date()
  390 |     d.setDate(d.getDate() + 10)
  391 |     const iso = d.toISOString().split('T')[0]
  392 | 
  393 |     await page.route('**/api/availability**', route =>
  394 |       route.fulfill({ json: { availabilities: [
  395 |         { startAt: `${iso}T14:30:00Z`, seatsRemaining: 1 },
  396 |       ]}})
  397 |     )
  398 |     await page.route('**/api/breeds**', route =>
  399 |       route.fulfill({ json: { schedule: {
  400 |         [iso]: [{ breed: { en: 'Golden Retriever', fr: 'Golden Retriever' }, serviceIds: [] }],
  401 |       }}})
  402 |     )
  403 | 
  404 |     await page.goto('/#book')
  405 |     await expect(page.getByText('What kind of class are you looking for?')).toBeVisible()
  406 |     await page.locator('.pricing-choice-card', { hasText: 'Regular Class' }).click()
  407 |     await page.getByText("Yes, I'll bring my own").click()
  408 | 
  409 |     const row = page.locator('.pricing-session-row').first()
  410 |     await expect(row).toBeVisible({ timeout: 8_000 })
  411 |   })
  412 | 
  413 |   test('slot with 0 seats remaining is hidden from the date picker', async ({ page }) => {
  414 |     await page.addInitScript(() => localStorage.setItem('studio-yopaw-lang', 'en'))
  415 | 
  416 |     const d = new Date()
  417 |     d.setDate(d.getDate() + 10)
  418 |     const iso = d.toISOString().split('T')[0]
  419 | 
  420 |     await page.route('**/api/availability**', route =>
  421 |       route.fulfill({ json: { availabilities: [
  422 |         { startAt: `${iso}T14:30:00Z`, seatsRemaining: 0 },
  423 |       ]}})
  424 |     )
  425 |     await page.route('**/api/breeds**', route =>
  426 |       route.fulfill({ json: { schedule: {
  427 |         [iso]: [{ breed: { en: 'Golden Retriever', fr: 'Golden Retriever' }, serviceIds: [] }],
  428 |       }}})
  429 |     )
  430 | 
  431 |     await page.goto('/#book')
  432 |     await expect(page.getByText('What kind of class are you looking for?')).toBeVisible()
  433 |     await page.locator('.pricing-choice-card', { hasText: 'Regular Class' }).click()
  434 |     await page.getByText("Yes, I'll bring my own").click()
  435 | 
  436 |     await page.waitForTimeout(2_000)
> 437 |     await expect(page.locator('.pricing-session-row')).toHaveCount(0)
      |                                                        ^ Error: expect(locator).toHaveCount(expected) failed
  438 |   })
  439 | })
  440 | 
  441 | test.describe('French language — new strings', () => {
  442 |   async function openBookingFr(page: Page) {
  443 |     await mockApis(page)
  444 |     await page.addInitScript(() => {
  445 |       localStorage.setItem('studio-yopaw-lang', 'fr')
  446 |     })
  447 |     await page.goto('/#book')
  448 |     await expect(page.getByText('Quel type de cours recherchez-vous ?')).toBeVisible()
  449 |   }
  450 | 
  451 |   test('extra attendees helper text is in French', async ({ page }) => {
  452 |     await openBookingFr(page)
  453 |     await page.locator('.pricing-choice-card', { hasText: 'Cours régulier' }).click()
  454 |     await page.getByText("Oui, j'apporte le mien").click()
  455 |     await expect(page.getByText('Sélectionnez votre horaire préféré')).toBeVisible({ timeout: 5_000 })
  456 |     await pickFirstDateAndTime(page)
  457 | 
  458 |     await expect(page.locator('.pricing-extra-attendees')).toContainText("10")
  459 |     await expect(page.getByRole('button', { name: /Ajouter un participant/i })).toBeVisible()
  460 |   })
  461 | 
  462 |   test('corporate form shows French company name label', async ({ page }) => {
  463 |     await openBookingFr(page)
  464 |     await page.locator('.pricing-choice-card', { hasText: 'Corporatif' }).click()
  465 |     await page.getByText('Continuer').click()
  466 |     await expect(page.getByText('Sélectionnez votre horaire préféré')).toBeVisible({ timeout: 5_000 })
  467 |     await pickFirstDateAndTime(page)
  468 | 
  469 |     await expect(page.getByText("Nom de l'entreprise")).toBeVisible()
  470 |   })
  471 | })
  472 | 
```