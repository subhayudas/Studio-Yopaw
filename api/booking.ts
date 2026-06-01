import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomUUID } from 'crypto'
import { Resend } from 'resend'
import { square, getLocationId, stripBom } from './_square.js'
import { getMaxSeats } from './_config.js'

const ZAPIER_REGULAR_URL = 'https://hooks.zapier.com/hooks/catch/23258168/4oig0ml/'

const resend = new Resend(stripBom(process.env.RESEND_API_KEY ?? ''))

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
  }

  try {
    // 1. Find or create customer
    const searchResult = await square.customers.search({
      query: { filter: { emailAddress: { exact: email } } },
    })

    let customerId = searchResult.customers?.[0]?.id
    if (!customerId) {
      const { customer } = await square.customers.create({
        idempotencyKey: randomUUID(),
        givenName,
        familyName,
        emailAddress: email,
        phoneNumber: phone,
      })
      customerId = customer!.id!
    }

    // 2. Guard: reject if class is already full (race condition protection)
    const slotEnd = new Date(new Date(startAt).getTime() + 1000).toISOString()
    const slotBookings = await square.bookings.list({
      locationId: getLocationId(),
      startAtMin: startAt,
      startAtMax: slotEnd,
    })
    const norm = (s: string) => s.replace(/\.\d+Z$/, 'Z')
    const taken = (slotBookings.data ?? []).filter(
      b => norm(b.startAt ?? '') === norm(startAt) &&
           b.status !== 'CANCELLED_BY_SELLER' &&
           b.status !== 'CANCELLED_BY_CUSTOMER',
    ).length
    if (taken >= getMaxSeats()) {
      return res.status(409).json({ error: 'This class is full' })
    }

    // 3. Create the booking first so we have an ID to link the order and payment against.
    //    This is what makes Square's calendar display the booking as paid rather than "balance due".
    const { booking } = await square.bookings.create({
      idempotencyKey: randomUUID(),
      booking: {
        locationId: getLocationId(),
        customerId,
        startAt,
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
          quantity: '1',
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
        attendeeCount: 1,
        startAt,
        bookingId: booking!.id,
        totalDollars: (Number(chargeAmount) / 100).toFixed(2),
        paymentStatus: payment!.status,
      }),
    }).catch((err) => console.error('[Zapier] regular-booking webhook failed:', err))

    // 7. Send lead notification email
    const totalDollars = (Number(chargeAmount) / 100).toFixed(2)
    const baseDollars = (baseAmountCents / 100).toFixed(2)
    const taxDollars = ((Number(chargeAmount) - baseAmountCents - (needsMatRental ? 500 : 0)) / 100).toFixed(2)

    await resend.emails.send({
      from: stripBom(process.env.RESEND_FROM_EMAIL ?? 'Studio Yopaw <noreply@studio-yopaw.com>'),
      to: stripBom(process.env.LEAD_NOTIFY_EMAIL ?? ''),
      subject: `New Booking — ${givenName} ${familyName}`,
      html: `
        <h2>New booking confirmed</h2>
        <p><strong>Customer:</strong> ${givenName} ${familyName} (${email})</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Start:</strong> ${startAt}</p>
        <p><strong>Booking ID:</strong> ${booking!.id}</p>
        <p><strong>Service:</strong> ${serviceName}${needsMatRental ? ' + Mat Rental' : ''}</p>
        <p><strong>Subtotal:</strong> $${baseDollars} CAD</p>
        <p><strong>Taxes:</strong> $${taxDollars} CAD (TPS/GST + TVQ/QST)</p>
        <p><strong>Total charged:</strong> $${totalDollars} CAD — ${payment!.status}</p>
      `,
    })

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
