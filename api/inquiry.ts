import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendTeamSms } from './_twilio.js'

const ZAPIER_INQUIRY_URL = 'https://hooks.zapier.com/hooks/catch/23258168/4ok9t5x/'

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

  const { fullName, email, phone, classType, preferredDate, preferredTime, groupSize, companyName, message } =
    req.body as {
      fullName: string
      email: string
      phone: string
      classType: string
      preferredDate?: string
      preferredTime?: string
      groupSize?: string
      companyName?: string
      message?: string
    }

  try {
    const dateStr = preferredDate ? fmtDate(preferredDate) : '—'
    const timeStr = preferredTime ? fmtTime(preferredTime) : '—'
    const isLead = classType === 'Regular Class'

    const smsBody =
      `${isLead ? '🔔 NEW LEAD' : '📩 NEW INQUIRY'} — Studio Yopaw\n` +
      `-----------------------------\n` +
      `Class: ${classType}\n` +
      `\n` +
      `👤 Contact info:\n` +
      `  Name: ${fullName}\n` +
      `  Email: ${email}\n` +
      `  Phone: ${phone}\n` +
      (companyName ? `  Company: ${companyName}\n` : '') +
      `\n` +
      `📅 Request details:\n` +
      `  Preferred date: ${dateStr}\n` +
      `  Preferred time: ${timeStr}\n` +
      (groupSize ? `  Group size: ${groupSize}\n` : '') +
      (message ? `\n💬 Message:\n  ${message}` : '')

    await sendTeamSms(smsBody)

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
          companyName: companyName ?? '',
          attendeeCount: parseInt(groupSize ?? '1', 10) || 1,
          preferredDate: preferredDate ?? '',
          preferredTime: preferredTime ?? '',
          message: message ?? '',
        }),
      }).catch((err) => console.error('[Zapier] inquiry webhook failed:', err))
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('inquiry SMS error', err)
    return res.status(500).json({ error: 'Failed to send inquiry' })
  }
}
