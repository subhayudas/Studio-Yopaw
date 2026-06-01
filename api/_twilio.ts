import twilio from 'twilio'
import { stripBom } from './_square.js'

function getClient() {
  return twilio(
    stripBom(process.env.TWILIO_ACCOUNT_SID ?? ''),
    stripBom(process.env.TWILIO_AUTH_TOKEN ?? ''),
  )
}

function getTeamNumbers(): string[] {
  return stripBom(process.env.TWILIO_TEAM_NUMBERS ?? '')
    .split(',')
    .map(n => n.trim())
    .filter(Boolean)
}

function getFromNumber(): string {
  return stripBom(process.env.TWILIO_FROM_NUMBER ?? '')
}

export async function sendTeamSms(body: string): Promise<void> {
  const client = getClient()
  const from = getFromNumber()
  const numbers = getTeamNumbers()

  if (!from || numbers.length === 0) {
    console.warn('[Twilio] Skipping SMS — TWILIO_FROM_NUMBER or TWILIO_TEAM_NUMBERS not set')
    return
  }

  await Promise.all(
    numbers.map(to =>
      client.messages.create({ from, to, body }).catch(err =>
        console.error(`[Twilio] SMS to ${to} failed:`, err),
      ),
    ),
  )
}
