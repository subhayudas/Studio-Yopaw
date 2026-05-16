# Square SDK Setup — All Languages

Official SDKs: Node.js/TypeScript, Python, Ruby, PHP, Java, .NET
All SDKs wrap the REST API. Prefer SDKs over raw HTTP for: type safety, pagination helpers,
retry logic, and automatic request serialization.

---

## Node.js / TypeScript (recommended for React backends)

```bash
npm install square
# or
yarn add square
```

**tsconfig.json** — set `moduleResolution` to `node16`, `nodenext`, or `bundler`.

### Initialize client
```typescript
import { SquareClient, SquareEnvironment } from 'square';

// New SDK (v40+) — preferred
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment: SquareEnvironment.Sandbox, // or Production
});

// After OAuth — swap token without recreating:
const authedClient = client.withConfiguration({ token: oauthAccessToken });
```

### Common operations
```typescript
// List locations
const { locations } = await client.locations.list();

// Search availability
const result = await client.bookings.searchAvailability({
  query: { filter: { startAtRange: { startAt: '...', endAt: '...' }, locationId: '...' } }
});

// Create booking
const { booking } = await client.bookings.create({
  idempotencyKey: crypto.randomUUID(),
  booking: { locationId: '...', customerId: '...', startAt: '...', appointmentSegments: [...] }
});

// Create payment
const { payment } = await client.payments.create({
  idempotencyKey: crypto.randomUUID(),
  sourceId: nonce,
  amountMoney: { amount: BigInt(3500), currency: 'CAD' },
  locationId: '...',
});
```

**Note:** Money amounts use `BigInt` in the new SDK.

### Error handling
```typescript
import { SquareError } from 'square';

try {
  const result = await client.bookings.create({ ... });
} catch (err) {
  if (err instanceof SquareError) {
    console.error(err.statusCode, err.body.errors);
    // err.body.errors = [{ category, code, detail }]
  }
}
```

### Types
```typescript
import { Square } from 'square';
const booking: Square.Booking = { ... };
```

---

## Python

```bash
pip install squareup
```

```python
from square.client import Client
import os

client = Client(
    access_token=os.environ['SQUARE_ACCESS_TOKEN'],
    environment='sandbox'  # or 'production'
)

# List locations
result = client.locations.list_locations()
if result.is_success():
    locations = result.body['locations']
elif result.is_error():
    print(result.errors)

# Create customer
result = client.customers.create_customer(body={
    'idempotency_key': str(uuid.uuid4()),
    'given_name': 'Jane',
    'family_name': 'Doe',
    'email_address': 'jane@example.com'
})
customer_id = result.body['customer']['id']

# Create payment
result = client.payments.create_payment(body={
    'idempotency_key': str(uuid.uuid4()),
    'source_id': nonce,
    'amount_money': { 'amount': 3500, 'currency': 'CAD' },
    'location_id': location_id
})
```

---

## Ruby

```bash
gem install square.rb
# or in Gemfile:
gem 'square.rb'
```

```ruby
require 'square'

client = Square::Client.new(
  access_token: ENV['SQUARE_ACCESS_TOKEN'],
  environment: 'sandbox'
)

result = client.locations.list_locations
if result.success?
  result.data.locations.each { |l| puts l[:name] }
elsif result.error?
  result.errors.each { |e| puts e[:detail] }
end

# Create booking
result = client.bookings.create_booking(body: {
  idempotency_key: SecureRandom.uuid,
  booking: {
    location_id: location_id,
    customer_id: customer_id,
    start_at: '2025-03-03T10:00:00Z',
    appointment_segments: [...]
  }
})
```

---

## PHP

```bash
composer require square/square
```

```php
use Square\SquareClient;
use Square\Environment;

$client = new SquareClient([
    'accessToken' => getenv('SQUARE_ACCESS_TOKEN'),
    'environment' => Environment::SANDBOX,
]);

$apiResponse = $client->getLocationsApi()->listLocations();
if ($apiResponse->isSuccess()) {
    $locations = $apiResponse->getResult()->getLocations();
} else {
    $errors = $apiResponse->getErrors();
}

// Create payment
$body = new \Square\Models\CreatePaymentRequest(
    $nonce,       // source_id
    uniqid()      // idempotency_key
);
$money = new \Square\Models\Money();
$money->setAmount(3500);
$money->setCurrency('CAD');
$body->setAmountMoney($money);
$body->setLocationId($locationId);

$response = $client->getPaymentsApi()->createPayment($body);
```

---

## Java

```xml
<!-- pom.xml -->
<dependency>
  <groupId>com.squareup</groupId>
  <artifactId>square</artifactId>
  <version>LATEST</version>
</dependency>
```

```java
import com.squareup.square.SquareClient;
import com.squareup.square.Environment;

SquareClient client = new SquareClient.Builder()
    .accessToken(System.getenv("SQUARE_ACCESS_TOKEN"))
    .environment(Environment.SANDBOX)
    .build();

// List locations
client.getLocationsApi().listLocationsAsync()
    .thenAccept(result -> {
        if (result.isSuccess()) {
            result.getResult().getLocations()
                .forEach(l -> System.out.println(l.getName()));
        }
    });
```

---

## .NET (C#)

```bash
dotnet add package Square
```

```csharp
using Square;
using Square.Models;

var client = new SquareClient.Builder()
    .AccessToken(Environment.GetEnvironmentVariable("SQUARE_ACCESS_TOKEN"))
    .Environment(Square.Environment.Sandbox)
    .Build();

// List locations
var result = await client.LocationsApi.ListLocationsAsync();
if (result.IsSuccess())
{
    foreach (var loc in result.Data.Locations)
        Console.WriteLine(loc.Name);
}

// Create payment
var body = new CreatePaymentRequest.Builder(nonce, Guid.NewGuid().ToString())
    .AmountMoney(new Money.Builder().Amount(3500L).Currency("CAD").Build())
    .LocationId(locationId)
    .Build();
var paymentResult = await client.PaymentsApi.CreatePaymentAsync(body);
```

---

## Sandbox environment switching (all SDKs)

| Language | Sandbox | Production |
|----------|---------|------------|
| Node.js | `SquareEnvironment.Sandbox` | `SquareEnvironment.Production` |
| Python | `environment='sandbox'` | `environment='production'` |
| Ruby | `environment: 'sandbox'` | `environment: 'production'` |
| PHP | `Environment::SANDBOX` | `Environment::PRODUCTION` |
| Java | `Environment.SANDBOX` | `Environment.PRODUCTION` |
| .NET | `Square.Environment.Sandbox` | `Square.Environment.Production` |

Sandbox base URL: `https://connect.squareupsandbox.com`
Production base URL: `https://connect.squareup.com`

---

## Common patterns across all SDKs

**Pagination** — pass `cursor` from response back to next call:
```typescript
let cursor: string | undefined;
do {
  const page = await client.customers.list({ cursor, limit: 100 });
  // process page.customers
  cursor = page.cursor;
} while (cursor);
```

**Idempotency** — always generate a fresh UUID per operation:
```typescript
// Node.js
import { randomUUID } from 'crypto';
const key = randomUUID();

// Python
import uuid; key = str(uuid.uuid4())

// Ruby
require 'securerandom'; key = SecureRandom.uuid

// PHP
$key = uniqid('', true);

// Java
import java.util.UUID; String key = UUID.randomUUID().toString();

// C#
string key = Guid.NewGuid().ToString();
```

**Object versioning** — always include `version` when updating:
```typescript
// Retrieve first, then update with current version
const { booking } = await client.bookings.retrieve(bookingId);
await client.bookings.update(bookingId, {
  idempotencyKey: randomUUID(),
  booking: { version: booking.version, startAt: newTime }
});
```
