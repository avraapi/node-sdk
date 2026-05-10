# AvraAPI Node.js SDK

Official TypeScript/JavaScript SDK for the [AvraAPI (APIX)](https://avraapi.com) enterprise API gateway.

Zero framework dependencies — works in any Node.js 18+ project.

> **Official SDK Documentation:** [https://avraapi.com/developers/sdks](https://avraapi.com/developers/sdks)

```bash
npm install @avraapi/node-sdk
```

## Quick Start

```ts
import { ApixClient } from '@avraapi/node-sdk';

const apix = new ApixClient({
  apiKey:    'your-api-key',
  apiSecret: 'your-api-secret',
  env:       'dev', // 'dev' or 'prod'
});
```

## Services

| Service | Accessor | Endpoints |
|---------|----------|-----------|
| Location | `apix.location()` | IP geolocation lookups |
| SMS | `apix.sms()` | Single, bulk-same, bulk-different, balance |
| Utilities | `apix.utilities()` | QR codes, barcodes, **PDF generation** |
| Security | `apix.security()` | VPN & Proxy Shield, Burner Email Detection |
| Currency | `apix.currency()` | Currency codes, live rates, pair rates, conversion |

---

## PDF Generation

### Basic HTML to PDF

```ts
import { BinaryResponse } from '@avraapi/node-sdk';

const html = '<h1>Invoice #001</h1><p>Total: $99.00</p>';
const pdf = await apix.utilities().generatePdf({ html });
await (pdf as BinaryResponse).saveAs('./output/invoice.pdf');
```

### Landscape with Custom Margins

```ts
const landscape = await apix.utilities().generatePdf({
  html,
  pageSize:    'A4',
  orientation: 'landscape',
  margins:     { top: 20, right: 25, bottom: 20, left: 25 },
});
await (landscape as BinaryResponse).saveAs('./output/landscape.pdf');
```

### Base64 JSON Response

```ts
import { ApiResponse, type PdfBase64Data } from '@avraapi/node-sdk';

const result = await apix.utilities().generatePdf({
  html,
  responseType: 'base64',
});
const api = result as ApiResponse<PdfBase64Data>;
const buf = Buffer.from(api.data.data, 'base64');
await fs.promises.writeFile('./output/invoice.pdf', buf);
```

---

## Generating PDFs from Complex Templates (Base64 Mode)

When your HTML contains quotes, newlines, inline CSS, or special characters, JSON escaping can cause issues. **Base64 mode** solves this by encoding the HTML before transport.

### Option A: Use the `generatePdfFromBase64()` Helper (Recommended)

The helper accepts **raw HTML** and encodes it automatically:

```ts
import { readFileSync } from 'node:fs';
import { BinaryResponse } from '@avraapi/node-sdk';

// Load a complex template from disk
const html = readFileSync('./templates/invoice.html', 'utf-8');

// The SDK Base64-encodes internally — no manual encoding needed
const pdf = await apix.utilities().generatePdfFromBase64({ html });
await (pdf as BinaryResponse).saveAs('./output/invoice.pdf');

// With full options:
const pdf = await apix.utilities().generatePdfFromBase64({
  html,
  responseType: 'binary',
  pageSize:     'Letter',
  orientation:  'landscape',
  margins:      { top: 15, right: 20, bottom: 15, left: 20 },
  privacyMode:  true,
});
await (pdf as BinaryResponse).saveAs('./output/invoice.pdf');
```

### Option B: Manual Base64 Encoding

If you need full control, encode the HTML yourself and set `isBase64: true`:

```ts
const html = readFileSync('./templates/invoice.html', 'utf-8');
const encoded = Buffer.from(html).toString('base64');

const pdf = await apix.utilities().generatePdf({
  html: encoded,
  isBase64: true,
});
await (pdf as BinaryResponse).saveAs('./output/invoice.pdf');
```

### How It Works

1. The SDK sends the Base64 string in the `html` field with `is_base64: true`.
2. The server decodes the Base64 content before validation and rendering.
3. The **512 KB size limit** applies to the **decoded** HTML, not the encoded payload.

---

## Saving Files to Disk

`BinaryResponse` provides both async and sync save methods:

```ts
// Async (preferred):
const pdf = await apix.utilities().generatePdf({ html });
const bin = pdf as BinaryResponse;
const savedPath = await bin.saveAs('./output/invoice.pdf');
console.log(`Saved to: ${savedPath}`);

// Sync (when async is inconvenient):
bin.saveAsSync('./output/invoice.pdf');

// BinaryResponse also provides:
bin.getBuffer();     // Node.js Buffer
bin.contentType;     // 'application/pdf'
bin.size;            // Size in bytes
bin.isPdf();         // true
bin.toDataUri();     // 'data:application/pdf;base64,...'

// Express.js streaming:
res.setHeader('Content-Type', bin.contentType);
res.setHeader('Content-Length', bin.size.toString());
res.send(bin.getBuffer());
```

---

## VPN & Proxy Shield

Detect VPNs, proxies, Tor exit nodes, iCloud Private Relay, and hosting/datacenter IPs.

```ts
const result = await apix.security().checkVpn({ ip: '8.8.8.8' });

console.log(result.data.ip_address);    // '8.8.8.8'
console.log(result.data.is_vpn);        // false
console.log(result.data.is_proxy);      // false
console.log(result.data.is_tor);        // false
console.log(result.data.country_code);  // 'US'
console.log(result.data.network_name);  // 'Google LLC'

// Quick threat check:
const d = result.data;
const isThreat = d.is_vpn || d.is_proxy || d.is_tor;
```

---

## Burner Email Shield

Detect temporary and disposable email addresses (7,000+ domains).

```ts
const result = await apix.security().checkBurnerEmail({ email: 'user@mailinator.com' });

console.log(result.data.is_disposable);     // true
console.log(result.data.source);            // 'global'
console.log(result.data.execution_time_ms); // 0.42

// Guard a registration:
if (result.data.is_disposable) {
  throw new Error('Disposable emails are not allowed.');
}
```

---

## Multi-Currency Rates & Conversion

Free currency exchange rate API — 160+ currencies, 2-hour cached rates, zero credit cost.

```ts
// Get all currency codes
const codes = await apix.currency().getCodes();
console.log(codes.data.count); // 161

// Get latest rates from a base currency
const rates = await apix.currency().getLatestRates('USD');
console.log(rates.data.rates['EUR']); // 0.89123456
console.log(rates.data.rates['LKR']); // 298.50000000

// Get pair rate
const pair = await apix.currency().getPairRate('USD', 'EUR');
console.log(pair.data.rate); // 0.89123456

// Convert an amount
const conv = await apix.currency().convert('USD', 'LKR', 100);
console.log(`${conv.data.amount} ${conv.data.base} = ${conv.data.conversion_result} ${conv.data.target}`);
// "100 USD = 29850.000000 LKR"
```

---

## Privacy Mode

For sensitive documents, enable privacy mode to exclude HTML content from observability logs:

```ts
const pdf = await apix.utilities().generatePdf({ html, privacyMode: true });
await (pdf as BinaryResponse).saveAs('./output/confidential.pdf');
```

---

## Error Handling

The SDK throws typed errors for all API error responses:

```ts
import {
  ApixRateLimitError,
  ApixInsufficientFundsError,
  ApixValidationError,
  ApixAuthenticationError,
  ApixError,
} from '@avraapi/node-sdk';

try {
  const pdf = await apix.utilities().generatePdf({ html });
  await (pdf as BinaryResponse).saveAs('./output/invoice.pdf');
} catch (err) {
  if (err instanceof ApixRateLimitError) {
    // HTTP 429 — rate limit exceeded
    console.error('Rate limited:', err.message);
  } else if (err instanceof ApixInsufficientFundsError) {
    // HTTP 402 — wallet balance too low
    console.error('Insufficient balance:', err.message);
  } else if (err instanceof ApixValidationError) {
    // HTTP 422 — invalid input
    console.error('Validation errors:', err.validationErrors);
  } else if (err instanceof ApixAuthenticationError) {
    // HTTP 401 — bad credentials
    console.error('Auth failed:', err.message);
  } else if (err instanceof ApixError) {
    // Catch-all for any other APIX error
    console.error(`[${err.errorCode}] ${err.message}`);
  } else {
    throw err;
  }
}
```

---

## TypeScript Types

All parameter and response interfaces are exported for full type safety:

```ts
import type {
  GeneratePdfParams,
  GeneratePdfFromBase64Params,
  PdfBase64Data,
  PdfPageSize,
  PdfOrientation,
  PdfMargins,
  CheckVpnParams,
  VpnShieldData,
  CheckBurnerEmailParams,
  BurnerEmailData,
  CurrencyCodeEntry,
  CurrencyCodesData,
  CurrencyLatestRatesData,
  CurrencyPairRateData,
  CurrencyConvertData,
} from '@avraapi/node-sdk';
```

---

## Documentation

For full API reference, usage guides, and interactive examples, visit:

**[https://avraapi.com/developers/sdks](https://avraapi.com/developers/sdks)**

---

## License

MIT — [Fidex Developers (Pvt) Ltd](https://avraapi.com)
