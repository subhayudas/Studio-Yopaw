// API smoke tests — run: TEST_BASE_URL=http://localhost:3000 node tests/run-api-tests.mjs
const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3000'

async function post(path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { status: r.status, body: await r.json().catch(() => ({})) }
}
async function get(path) {
  const r = await fetch(`${BASE}${path}`)
  return { status: r.status, body: await r.json().catch(() => ({})) }
}

let pass = 0, fail = 0
function assert(label, ok, detail = '') {
  if (ok) { console.log(`  ✅ ${label}`); pass++ }
  else     { console.error(`  ❌ ${label}${detail ? ' — ' + detail : ''}`); fail++ }
}

// --- Availability ---
console.log('\n[availability]')
const av = await get('/api/availability?startDate=2026-06-01&endDate=2026-07-31')
assert('returns 200', av.status === 200)
assert('has availabilities array', Array.isArray(av.body.availabilities))
assert('slots have seatsRemaining', av.body.availabilities?.[0]?.seatsRemaining >= 0)

// --- Breeds ---
console.log('\n[breeds]')
const br = await get('/api/breeds?startDate=2026-06-01&endDate=2026-07-31')
assert('returns 200', br.status === 200)
assert('has schedule object', typeof br.body.schedule === 'object')

// --- Inquiry: Private Event ---
console.log('\n[inquiry: private event]')
const i1 = await post('/api/inquiry', {
  fullName: 'Marie Dupont', email: 'marie@test.com', phone: '+15141110001',
  classType: 'Private Event', preferredDate: '2026-06-14',
  preferredTime: '2026-06-14T14:30:00Z', groupSize: '6',
  message: 'Birthday party — please confirm ASAP',
})
assert('returns 200', i1.status === 200)
assert('ok:true', i1.body.ok === true)

// --- Inquiry: Corporate ---
console.log('\n[inquiry: corporate]')
const i2 = await post('/api/inquiry', {
  fullName: 'Jean Tremblay', email: 'jean@corp.com', phone: '+15143334444',
  classType: 'Corporate', preferredDate: '2026-06-21',
  preferredTime: '2026-06-21T16:00:00Z', groupSize: '12',
  companyName: 'Acme Inc.', message: 'Team building day',
})
assert('returns 200', i2.status === 200)
assert('ok:true', i2.body.ok === true)

// --- Inquiry: Regular Class lead capture ---
console.log('\n[inquiry: regular class lead capture]')
const i3 = await post('/api/inquiry', {
  fullName: 'Sophie Martin', email: 'sophie@test.com', phone: '+15145556666',
  classType: 'Regular Class', preferredDate: '2026-06-14',
  preferredTime: '2026-06-14T14:30:00Z', groupSize: '3',
})
assert('returns 200', i3.status === 200)
assert('ok:true', i3.body.ok === true)

// --- Inquiry: missing optional fields ---
console.log('\n[inquiry: minimal payload]')
const i4 = await post('/api/inquiry', {
  fullName: 'Min User', email: 'min@test.com', phone: '+15140000000',
  classType: 'Private Event',
})
assert('returns 200 (optional fields ok)', i4.status === 200)

// --- Webhook: bad signature ---
console.log('\n[webhook: bad signature]')
const wh = await post('/api/square-webhook', { type: 'test' })
assert('rejects bad sig with 403', wh.status === 403)

// --- 405 on GET for POST-only routes ---
console.log('\n[405 checks]')
const g1 = await fetch(`${BASE}/api/inquiry`)
assert('/api/inquiry GET returns 405', g1.status === 405)
const g2 = await fetch(`${BASE}/api/booking`)
assert('/api/booking GET returns 405', g2.status === 405)

console.log(`\n${'='.repeat(40)}`)
console.log(`Results: ${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
