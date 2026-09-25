import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomUUID } from 'crypto'
import type { Square } from 'square'
import { square, getLocationId } from './_square.js'
import { getMaxSeats } from './_config.js'
import { sendTeamSms } from './_twilio.js'
import { countSlotAttendees } from './_availability.js'
import { validateVoucher } from './_voucher.js'
import { lookupGiftCardByNonce } from './_giftcard.js'
import { awardLoyaltyForOrder } from './_loyalty.js'

// Errors whose message is safe and useful to show the customer as-is (HTTP 400).
class BookingInputError extends Error {}

const ZAPIER_REGULAR_URL = 'https://hooks.zapier.com/hooks/catch/23258168/4oig0ml/'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const {
    givenName,
    familyName,
    email,
    phone,
    serviceVariationId,
    serviceVariationVersion,
    teamMemberId,
    startAt,
    cardNonce,
    giftCardNonce,
    baseAmountCents,
    serviceName,
    needsMatRental,
    extraAttendees,
    voucherCode,
  } = req.body as {
    givenName: string
    familyName: string
    email: string
    phone: string
    serviceVariationId: string
    serviceVariationVersion: number
    teamMemberId: string
    startAt: string
    cardNonce?: string
    giftCardNonce?: string
    baseAmountCents: number
    serviceName: string
    needsMatRental?: boolean
    extraAttendees?: Array<{ name: string }>
    voucherCode?: string
  }

  const totalPeople = 1 + (extraAttendees?.length ?? 0)

  async function findOrCreateCustomer(
    gName: string, fName: string, emailAddr: string, phoneNum: string,
  ): Promise<string> {
    const search = await square.customers.search({
      query: { filter: { emailAddress: { exact: emailAddr } } },
    })
    const existing = search.customers?.[0]?.id
    if (existing) return existing
    const { customer } = await square.customers.create({
      idempotencyKey: randomUUID(),
      givenName: gName,
      familyName: fName,
      emailAddress: emailAddr,
      phoneNumber: phoneNum,
    })
    return customer!.id!
  }

  try {
    // 1. Find or create a Square customer for every attendee.
    //    On API rate-limit failure, fall back to primary client only.
    const allAttendees = [
      { givenName, familyName },
      ...(extraAttendees ?? []).map(a => {
        const parts = a.name.trim().split(' ')
        return { givenName: parts[0] ?? a.name, familyName: parts.slice(1).join(' ') || (parts[0] ?? a.name) }
      }),
    ]

    let customerId: string
    try {
      const ids = await Promise.all(
        allAttendees.map(a => findOrCreateCustomer(a.givenName, a.familyName, email, phone)),
      )
      customerId = ids[0]
    } catch (batchErr) {
      console.warn('Customer batch creation hit API limit — falling back to primary client only', batchErr)
      customerId = await findOrCreateCustomer(givenName, familyName, email, phone)
    }

    // 2. Guard: reject if class is already full (race condition protection).
    // Counts ATTENDEES, not bookings — a single party-of-N booking takes N seats.
    const taken = await countSlotAttendees(startAt)
    if (taken + totalPeople > getMaxSeats()) {
      return res.status(409).json({ error: 'This class is full' })
    }

    // 2b. Server-side voucher revalidation. The client only sends the raw code;
    //     all discount values come from Square via the catalog discount object.
    //     If the code is invalid/expired we reject so the booking can't proceed
    //     at full price silently.
    let appliedVoucher: { discountId: string; name: string } | null = null
    if (typeof voucherCode === 'string' && voucherCode.trim()) {
      const voucher = await validateVoucher(voucherCode)
      if (!voucher.valid) {
        return res.status(400).json({ error: 'Invalid or expired voucher code' })
      }
      appliedVoucher = { discountId: voucher.discountId, name: voucher.name }
    }

    // 2c. Gift card: resolve the balance server-side from the SDK nonce (never trust a
    //     client-supplied amount). The card is charged for min(balance, order total) and
    //     any remainder goes to the card nonce.
    let gift: { nonce: string; balanceCents: number; last4: string } | null = null
    if (typeof giftCardNonce === 'string' && giftCardNonce.trim()) {
      const g = await lookupGiftCardByNonce(giftCardNonce)
      if (!g.valid) {
        return res.status(400).json({ error: 'This gift card is invalid, inactive, or has no balance.' })
      }
      gift = { nonce: giftCardNonce.trim(), balanceCents: g.balanceCents, last4: g.last4 }
    }
    // (A card nonce is only required when the order total exceeds what the gift card /
    // a 100% voucher covers — enforced after the order total is known, below.)

    // 3. Create the booking first so we have an ID to link the order and payment against.
    //    This is what makes Square's calendar display the booking as paid rather than "balance due".
    const allNames = [
      `${givenName} ${familyName}`,
      ...(extraAttendees ?? []).map(a => a.name),
    ].join(', ')
    const bookingNote = `Total attendees: ${totalPeople} · Names: ${allNames} · Waiver confirmed: yes`

    const { booking } = await square.bookings.create({
      idempotencyKey: randomUUID(),
      booking: {
        locationId: getLocationId(),
        customerId,
        startAt,
        customerNote: bookingNote,
        appointmentSegments: [
          {
            serviceVariationId,
            serviceVariationVersion: BigInt(serviceVariationVersion),
            teamMemberId,
          },
        ],
      },
    })

    // Steps 4 & 5 are wrapped so that if either fails we immediately cancel the booking,
    // preventing a ghost appointment from sitting in the calendar unpaid.
    let chargeAmount: bigint
    let paymentStatus = 'COMPLETED'
    let orderId: string
    let giftCents = 0n

    try {
      // 4. Create Order referencing the catalog service — always with GST + QST inline.
      //    Using catalogObjectId ensures Square charges the actual catalog price, not a custom amount.
      //    Square reads referenceId to link the payment to the booking in Appointments.
      const lineItems: Square.OrderLineItem[] = [
        {
          quantity: String(totalPeople),
          catalogObjectId: serviceVariationId,
          catalogVersion: BigInt(serviceVariationVersion),
          appliedTaxes: [{ taxUid: 'gst' }, { taxUid: 'qst' }],
        },
      ]
      if (needsMatRental) {
        lineItems.push({
          quantity: '1',
          name: 'Mat Rental / Location de tapis',
          basePriceMoney: { amount: 500n, currency: 'CAD' },
        })
      }

      const { order } = await square.orders.create({
        idempotencyKey: randomUUID(),
        order: {
          locationId: getLocationId(),
          customerId,
          referenceId: booking!.id,
          lineItems,
          // ORDER-scoped voucher discount. Square prorates it across line items and
          // recomputes taxes on the discounted basis automatically (MODIFY_TAX_BASIS),
          // so the existing LINE_ITEM tax structure stays unchanged.
          ...(appliedVoucher
            ? { discounts: [{ uid: 'voucher', catalogObjectId: appliedVoucher.discountId, scope: 'ORDER' as const }] }
            : {}),
          taxes: [
            { uid: 'gst', name: 'TPS/GST', percentage: '5',     scope: 'LINE_ITEM' },
            { uid: 'qst', name: 'TVQ/QST', percentage: '9.975', scope: 'LINE_ITEM' },
          ],
        },
      })
      chargeAmount = order!.totalMoney!.amount!
      orderId = order!.id!

      // 5. Process payment(s), referencing both the order and the booking ID.
      //    Split tender: card first (most likely to fail), then the gift card for
      //    min(balance, total). If the gift card leg fails, the card leg is refunded.
      giftCents = gift ? BigInt(Math.min(gift.balanceCents, Number(chargeAmount))) : 0n
      const cardCents = chargeAmount - giftCents
      if (cardCents > 0n && !cardNonce) {
        throw new BookingInputError(
          'Your gift card balance does not cover the full total. Please add a card for the remainder.',
        )
      }

      const pay = async (sourceId: string, amount: bigint) => {
        const { payment: p } = await square.payments.create({
          idempotencyKey: randomUUID(),
          sourceId,
          amountMoney: { amount, currency: 'CAD' },
          locationId: getLocationId(),
          customerId,
          referenceId: booking!.id,
          orderId,
        })
        if (p!.status !== 'COMPLETED' && p!.status !== 'APPROVED') {
          throw new Error(`Payment not approved (status: ${p!.status})`)
        }
        return p!
      }

      if (chargeAmount === 0n) {
        // Fully discounted order: Square rejects $0 payments — close the order directly.
        await square.orders.pay({ orderId, idempotencyKey: randomUUID(), paymentIds: [] })
      } else {
        const cardPayment = cardCents > 0n ? await pay(cardNonce!, cardCents) : null
        if (cardPayment) paymentStatus = cardPayment.status ?? paymentStatus
        if (giftCents > 0n) {
          try {
            const giftPayment = await pay(gift!.nonce, giftCents)
            if (!cardPayment) paymentStatus = giftPayment.status ?? paymentStatus
          } catch (giftErr) {
            if (cardPayment?.id) {
              await square.refunds.refundPayment({
                idempotencyKey: randomUUID(),
                paymentId: cardPayment.id,
                amountMoney: { amount: cardCents, currency: 'CAD' },
                reason: 'Gift card payment failed — reversing card charge',
              }).catch(refundErr =>
                console.error('CRITICAL: gift card leg failed AND card refund failed — manual refund required', {
                  paymentId: cardPayment.id, refundErr,
                }))
            }
            throw giftErr
          }
        }
      }
    } catch (paymentErr) {
      // Payment or order creation failed — cancel the booking so it doesn't
      // sit in the calendar as an unpaid ghost appointment.
      console.error('Payment failed — cancelling booking', {
        bookingId: booking!.id,
        error: paymentErr instanceof Error ? paymentErr.message : paymentErr,
      })
      try {
        await square.bookings.cancel({
          bookingId: booking!.id!,
          idempotencyKey: randomUUID(),
          bookingVersion: booking!.version,
        })
      } catch (cancelErr) {
        console.error('CRITICAL: Payment failed AND booking cancellation failed — manual cleanup required', {
          bookingId: booking!.id,
          cancelErr,
        })
      }
      throw paymentErr
    }

    // 6. Fire Zapier booking webhook (one webhook for regular class)
    await fetch(ZAPIER_REGULAR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: givenName,
        lastName: familyName,
        fullName: `${givenName} ${familyName}`,
        email,
        phone,
        classType: serviceName,
        attendeeCount: totalPeople,
        attendeeNames: allNames,
        startAt,
        bookingId: booking!.id,
        totalDollars: (Number(chargeAmount) / 100).toFixed(2),
        paymentStatus,
        voucherCode: appliedVoucher?.name ?? '',
        giftCardDollars: (Number(giftCents) / 100).toFixed(2),
      }),
    }).catch((err) => console.error('[Zapier] regular-booking webhook failed:', err))

    // 6b. Loyalty: accrue points for the paid order. Never throws / never blocks the booking.
    const loyalty = await awardLoyaltyForOrder({ phone, orderId })

    // 7. Send booking SMS to all team members
    const totalDollars = (Number(chargeAmount) / 100).toFixed(2)
    const sessionDate = new Intl.DateTimeFormat('en-CA', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      timeZone: 'America/Toronto',
    }).format(new Date(startAt))
    const sessionTime = new Intl.DateTimeFormat('en-CA', {
      hour: 'numeric', minute: '2-digit', hour12: true,
      timeZone: 'America/Toronto',
    }).format(new Date(startAt))

    await sendTeamSms(
      `📋 NEW BOOKING — Studio Yopaw\n` +
      `-----------------------------\n` +
      `Service: ${serviceName}${needsMatRental ? ' + Mat Rental' : ''}\n` +
      `Session: ${sessionDate} at ${sessionTime} (Montréal)\n` +
      `\n` +
      `👤 Primary booker:\n` +
      `  Name: ${givenName} ${familyName}\n` +
      `  Email: ${email}\n` +
      `  Phone: ${phone}\n` +
      `\n` +
      `👥 Total attendees: ${totalPeople}\n` +
      (totalPeople > 1 ? `  Names: ${allNames}\n` : '') +
      `\n` +
      `💳 Payment:\n` +
      (appliedVoucher ? `  Voucher: ${appliedVoucher.name}\n` : '') +
      `  Total: $${totalDollars} CAD\n` +
      (giftCents > 0n ? `  Gift card (••${gift?.last4 ?? ''}): $${(Number(giftCents) / 100).toFixed(2)}\n` : '') +
      `  Status: ${paymentStatus}\n` +
      (loyalty ? `  Loyalty: +${loyalty.pointsEarned} (balance ${loyalty.balance})\n` : '') +
      `  Booking ID: ${booking!.id}`
    ).catch(err => console.error('[Twilio] booking SMS failed:', err))

    return res.status(200).json({ bookingId: booking!.id, paymentStatus, loyalty })
  } catch (err) {
    console.error('booking error', err)
    if (err instanceof BookingInputError) return res.status(400).json({ error: err.message })
    return res.status(500).json({ error: friendlyPaymentError(err) })
  }
}

function friendlyPaymentError(err: unknown): string {
  if (!(err instanceof Error)) return 'Booking failed. Please try again.'

  // Square SDK errors: "Status code: 4xx Body: { "errors": [...] }"
  const bodyMatch = err.message.match(/Body:\s*(\{[\s\S]*\})\s*$/)
  if (bodyMatch) {
    try {
      const parsed = JSON.parse(bodyMatch[1]) as {
        errors?: Array<{ code?: string; category?: string }>
      }
      const code = parsed.errors?.[0]?.code ?? ''
      const category = parsed.errors?.[0]?.category ?? ''

      if (code === 'GENERIC_DECLINE' || code === 'CARD_DECLINED')
        return 'Your card was declined. Please check your details or try a different card.'
      if (code === 'GIFT_CARD_AVAILABLE_AMOUNT' || code === 'INSUFFICIENT_FUNDS' && bodyMatch[1].includes('gift'))
        return 'Your gift card balance is too low for this payment.'
      if (code === 'INSUFFICIENT_FUNDS')
        return 'Insufficient funds. Please try a different card.'
      if (code === 'CARD_EXPIRED')
        return 'Your card has expired. Please use a different card.'
      if (code === 'CVV_FAILURE')
        return 'The security code (CVV) is incorrect. Please try again.'
      if (code === 'ADDRESS_VERIFICATION_FAILURE')
        return 'Address verification failed. Please check your billing address.'
      if (code === 'INVALID_CARD')
        return 'The card number is invalid. Please check and try again.'
      if (category === 'PAYMENT_METHOD_ERROR')
        return 'Payment declined. Please check your card details and try again.'
      if (category === 'RATE_LIMIT_ERROR')
        return 'Too many attempts. Please wait a moment and try again.'
    } catch {
      // JSON parse failed — fall through to generic message
    }
  }

  return 'Booking failed. Please try again.'
}
