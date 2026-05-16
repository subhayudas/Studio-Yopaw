# Square Authentication Reference

## Two auth modes

### 1. Personal Access Token (PAT)
- Never expires
- Full permissions on your own Square account
- Use for: internal tools, single-seller apps, own account only
- Stored in Developer Console → Credentials

```bash
curl https://connect.squareup.com/v2/locations \
  -H 'Authorization: Bearer YOUR_PRODUCTION_TOKEN' \
  -H 'Square-Version: 2025-01-23'
```

**Never use PAT in frontend/browser code.** Always backend only.

---

### 2. OAuth 2.0 (Multi-seller)
Required for App Marketplace apps and any app serving multiple sellers.

#### Code flow (server-side / confidential clients)

**Step 1 — Build the authorization URL**
```
GET https://connect.squareup.com/oauth2/authorize
  ?client_id={APP_ID}
  &scope={SPACE_SEPARATED_SCOPES}
  &session=false
  &state={CSRF_TOKEN}
```

**Step 2 — Seller approves → Square redirects to your callback**
```
GET https://yourapp.com/callback?code={AUTH_CODE}&state={YOUR_STATE}
```

Verify `state` matches your CSRF token before proceeding.

**Step 3 — Exchange code for tokens**
```bash
POST https://connect.squareup.com/oauth2/token
Content-Type: application/json

{
  "client_id": "{APP_ID}",
  "client_secret": "{APP_SECRET}",
  "code": "{AUTH_CODE}",
  "grant_type": "authorization_code",
  "redirect_uri": "https://yourapp.com/callback"
}
```

Response:
```json
{
  "access_token": "EAAAl...",
  "refresh_token": "EQAAl...",
  "expires_at": "2025-02-23T00:00:00Z",
  "merchant_id": "MLXXXXXX",
  "token_type": "bearer"
}
```

**Step 4 — Refresh before expiry (every 30 days)**
```bash
POST https://connect.squareup.com/oauth2/token

{
  "client_id": "{APP_ID}",
  "client_secret": "{APP_SECRET}",
  "grant_type": "refresh_token",
  "refresh_token": "{REFRESH_TOKEN}"
}
```

**Step 5 — Revoke (on disconnect)**
```bash
POST https://connect.squareup.com/oauth2/revoke

{
  "client_id": "{APP_ID}",
  "client_secret": "{APP_SECRET}",
  "access_token": "{ACCESS_TOKEN}"
}
```

#### PKCE flow (SPA / public clients — React, mobile)
For React/TypeScript frontends, use PKCE instead of code flow (no client_secret in browser).

```typescript
// 1. Generate code verifier + challenge
const verifier = randomBase64UrlString(64); // 43-128 chars
const challenge = base64url(sha256(verifier));

// 2. Authorization URL
const url = `https://connect.squareup.com/oauth2/authorize`
  + `?client_id=${APP_ID}`
  + `&scope=${scopes}`
  + `&code_challenge=${challenge}`
  + `&code_challenge_method=S256`
  + `&state=${csrfToken}`;

// 3. Token exchange (no client_secret, use verifier instead)
POST /oauth2/token
{
  "client_id": APP_ID,
  "code": authCode,
  "grant_type": "authorization_code",
  "redirect_uri": "...",
  "code_verifier": verifier
}
```

---

## Scopes for Bookings + Payments integration

Minimum scopes for a yoga/class booking app:

| Scope | Purpose |
|-------|---------|
| `APPOINTMENTS_ALL_READ` | Read all bookings (seller-level) |
| `APPOINTMENTS_ALL_WRITE` | Create/update/cancel bookings (requires Plus plan) |
| `APPOINTMENTS_READ` | Read buyer-level bookings |
| `APPOINTMENTS_WRITE` | Create buyer-level bookings |
| `CUSTOMERS_READ` | Read customer profiles |
| `CUSTOMERS_WRITE` | Create/update customers |
| `PAYMENTS_READ` | Read payment history |
| `PAYMENTS_WRITE` | Create payments |
| `ORDERS_READ` | Read orders linked to bookings |

Full permission list: https://developer.squareup.com/docs/oauth-api/square-permissions

---

## Sandbox OAuth testing

1. Developer Console → your app → Sandbox tab → OAuth
2. Create a Sandbox test seller account
3. Use "Authorize test account" to generate scoped Sandbox OAuth token without full OAuth flow
4. Sandbox redirect URLs can use HTTP + localhost

---

## Security rules
- Never store tokens in localStorage / client-side code
- Store refresh tokens encrypted server-side (database, secrets manager)
- Use `state` parameter for CSRF protection
- Handle `ACCESS_TOKEN_EXPIRED` and `ACCESS_TOKEN_REVOKED` error codes
- Subscribe to `oauth.authorization.revoked` webhook to detect revocations
