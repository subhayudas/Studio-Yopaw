import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'
import { stripBom } from './_square.js'

const ZAPIER_INQUIRY_URL = 'https://hooks.zapier.com/hooks/catch/23258168/4ok9t5x/'

const resend = new Resend(stripBom(process.env.RESEND_API_KEY ?? ''))

const fmtDate = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: 'long', day: 'numeric',
      timeZone: 'America/Toronto',
    }).format(new Date(iso.includes('T') ? iso : iso + 'T12:00:00'))
  } catch { return iso }
}

const fmtTime = (iso: string) => {
  if (!iso) return '—'
  try {
    const t = new Intl.DateTimeFormat('en-CA', {
      hour: 'numeric', minute: '2-digit', hour12: true,
      timeZone: 'America/Toronto',
    }).format(new Date(iso))
    return `${t} (Montréal)`
  } catch { return iso }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { fullName, email, phone, classType, preferredDate, preferredTime, groupSize } =
    req.body as {
      fullName: string
      email: string
      phone: string
      classType: string
      preferredDate?: string
      preferredTime?: string
      groupSize?: string
    }

  try {
    await resend.emails.send({
      from: stripBom(process.env.RESEND_FROM_EMAIL ?? 'Studio Yopaw <noreply@studio-yopaw.com>'),
      to: stripBom(process.env.LEAD_NOTIFY_EMAIL ?? ''),
      subject: `New Inquiry — ${fullName} (${classType})`,
      html: `
        <h2>New class inquiry</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Class type:</strong> ${classType}</p>
        <p><strong>Preferred date:</strong> ${preferredDate ? fmtDate(preferredDate) : '—'}</p>
        <p><strong>Preferred time:</strong> ${preferredTime ? fmtTime(preferredTime) : '—'}</p>
        <p><strong>Group size:</strong> ${groupSize ?? '—'}</p>
      `,
    })

    const [firstName, ...rest] = fullName.trim().split(/\s+/)
    const lastName = rest.join(' ')

    // Only fire Zapier for private/corporate — regular class lead-capture (fire-and-forget)
    // is handled by the booking webhook in booking.ts after payment succeeds.
    if (classType !== 'Regular Class') {
      await fetch(ZAPIER_INQUIRY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          fullName,
          email,
          phone,
          classType,
          attendeeCount: parseInt(groupSize ?? '1', 10) || 1,
          preferredDate: preferredDate ?? '',
          preferredTime: preferredTime ?? '',
        }),
      }).catch((err) => console.error('[Zapier] inquiry webhook failed:', err))
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('inquiry email error', err)
    return res.status(500).json({ error: 'Failed to send inquiry' })
  }
}
