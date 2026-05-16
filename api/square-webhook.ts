import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'
import { Resend } from 'resend'
import { stripBom } from './_square'

const resend = new Resend(stripBom(process.env.RESEND_API_KEY ?? ''))

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
    await resend.emails.send({
      from: 'Studio Yopaw <noreply@studio-yopaw.com>',
      to: stripBom(process.env.PAYMENT_NOTIFY_EMAIL ?? ''),
      subject: 'Payment Completed',
      html: `
        <h2>Payment completed</h2>
        <p><strong>Amount:</strong> $${Number((payment.amount_money as { amount: number }).amount) / 100} CAD</p>
        <p><strong>Payment ID:</strong> ${payment.id}</p>
        <p><strong>Reference:</strong> ${payment.reference_id ?? '—'}</p>
      `,
    })
  }

  if (event.type === 'customer.created') {
    const customer = (event.data as { object: { customer: Record<string, unknown> } }).object.customer
    await resend.emails.send({
      from: 'Studio Yopaw <noreply@studio-yopaw.com>',
      to: stripBom(process.env.LEAD_NOTIFY_EMAIL ?? ''),
      subject: 'New Customer in Square',
      html: `
        <h2>New customer created</h2>
        <p><strong>Name:</strong> ${customer.given_name} ${customer.family_name}</p>
        <p><strong>Email:</strong> ${customer.email_address ?? '—'}</p>
        <p><strong>Phone:</strong> ${customer.phone_number ?? '—'}</p>
      `,
    })
  }
}
