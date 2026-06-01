import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'
import { stripBom } from './_square.js'
import { sendTeamSms } from './_twilio.js'

const NOTIFICATION_URL = 'https://studio-yopaw.vercel.app/api/square-webhook'

function isValidSignature(rawBody: string, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', stripBom(process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ?? ''))
  hmac.update(NOTIFICATION_URL + rawBody)
  const expected = hmac.digest('base64')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const signature = (req.headers['x-square-hmacsha256-signature'] as string) ?? ''
  // Vercel parses JSON — re-stringify for HMAC verification
  const rawBody = JSON.stringify(req.body)

  if (!isValidSignature(rawBody, signature)) {
    return res.status(403).json({ error: 'Invalid signature' })
  }

  // Acknowledge immediately — Square retries on non-2xx
  res.status(200).send('OK')

  const event = req.body as {
    type: string
    event_id: string
    data: Record<string, unknown>
  }

  if (
    (event.type === 'payment.updated' || event.type === 'payment.created') &&
    (event.data as { object: { payment: { status?: string } } }).object.payment.status === 'COMPLETED'
  ) {
    const payment = (event.data as { object: { payment: Record<string, unknown> } }).object.payment
    const amountCents = (payment.amount_money as { amount: number }).amount
    await sendTeamSms(
      `✅ PAYMENT COMPLETED — Studio Yopaw\n` +
      `Amount: $${(amountCents / 100).toFixed(2)} CAD\n` +
      `Payment ID: ${payment.id}\n` +
      `Reference (Booking): ${payment.reference_id ?? '—'}`
    ).catch(err => console.error('[Twilio] payment SMS failed:', err))
  }

  if (event.type === 'customer.created') {
    const customer = (event.data as { object: { customer: Record<string, unknown> } }).object.customer
    await sendTeamSms(
      `🆕 NEW CUSTOMER — Studio Yopaw\n` +
      `Name: ${customer.given_name} ${customer.family_name}\n` +
      `Email: ${customer.email_address ?? '—'}\n` +
      `Phone: ${customer.phone_number ?? '—'}`
    ).catch(err => console.error('[Twilio] customer SMS failed:', err))
  }
}
