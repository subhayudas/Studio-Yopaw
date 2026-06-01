// Check recent SMS deliveries — run: node --env-file=.env.local tests/check-twilio-sms.mjs
const SID   = process.env.TWILIO_ACCOUNT_SID
const TOKEN = process.env.TWILIO_AUTH_TOKEN
const TO    = process.env.TWILIO_TEAM_NUMBERS?.split(',')[0]

if (!SID || !TOKEN || !TO) {
  console.error('Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_TEAM_NUMBERS')
  process.exit(1)
}

const url = `https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json?To=${encodeURIComponent(TO)}&PageSize=10`
const r = await fetch(url, {
  headers: { Authorization: 'Basic ' + Buffer.from(`${SID}:${TOKEN}`).toString('base64') },
})
const data = await r.json()
console.log(`\nLast ${data.messages?.length ?? 0} messages to ${TO}:\n`)
for (const m of data.messages ?? []) {
  console.log(`[${m.date_sent}] status=${m.status}`)
  console.log(m.body)
  console.log('---')
}
