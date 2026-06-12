import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomUUID } from 'crypto'
import { square, getLocationId } from './_square.js'
import { getMaxSeats } from './_config.js'
import { sendTeamSms } from './_twilio.js'
import { countSlotAttendees } from './_availability.js'

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
    baseAmountCents,
    serviceName,
    needsMatRental,
    extraAttendees,
  } = req.body as {
    givenName: string
    familyName: string
    email: string
    phone: string
    serviceVariationId: string
    serviceVariationVersion: number
    teamMemberId: string
    startAt: string
    cardNonce: string
    baseAmountCents: number
    serviceName: string
    needsMatRental?: boolean
    extraAttendees?: Array<{ name: string }>
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
    let payment: Awaited<ReturnType<typeof square.payments.create>>['payment']

    try {
      // 4. Create Order referencing the catalog service — always with GST + QST inline.
      //    Using catalogObjectId ensures Square charges the actual catalog price, not a custom amount.
      //    Square reads referenceId to link the payment to the booking in Appointments.
      const lineItems: object[] = [
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
          taxes: [
            { uid: 'gst', name: 'TPS/GST', percentage: '5',     scope: 'LINE_ITEM' },
            { uid: 'qst', name: 'TVQ/QST', percentage: '9.975', scope: 'LINE_ITEM' },
          ],
        },
      })
      chargeAmount = order!.totalMoney!.amount!

      // 5. Process payment, referencing both the order and the booking ID.
      const result = await square.payments.create({
        idempotencyKey: randomUUID(),
        sourceId: cardNonce,
        amountMoney: { amount: chargeAmount, currency: 'CAD' },
        locationId: getLocationId(),
        customerId,
        referenceId: booking!.id,
        orderId: order!.id,
      })
      payment = result.payment

      if (payment!.status !== 'COMPLETED' && payment!.status !== 'APPROVED') {
        throw new Error(`Payment not approved (status: ${payment!.status})`)
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
        paymentStatus: payment!.status,
      }),
    }).catch((err) => console.error('[Zapier] regular-booking webhook failed:', err))

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
      `  Total: $${totalDollars} CAD\n` +
      `  Status: ${payment!.status}\n` +
      `  Booking ID: ${booking!.id}`
    ).catch(err => console.error('[Twilio] booking SMS failed:', err))

    return res.status(200).json({ bookingId: booking!.id, paymentStatus: payment!.status })
  } catch (err) {
    console.error('booking error', err)
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
