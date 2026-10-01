import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { after, before, test } from 'node:test';

import {
  ApixAuthenticationError,
  ApixClient,
  ApixInsufficientFundsError,
  ApixNetworkError,
  ApixRateLimitError,
  ApixServiceUnavailableError,
  ApixValidationError,
  BinaryResponse,
} from '@avraapi/node-sdk';

let server;
let baseUrl;
const requests = [];

function json(response, status, payload) {
  response.writeHead(status, {
    'content-type': 'application/json',
    'x-apix-request-id': `offline-${status}`,
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const text = Buffer.concat(chunks).toString('utf8');
  return text === '' ? {} : JSON.parse(text);
}

function createClient(options = {}) {
  return new ApixClient({
    projectKey: 'test-client-id',
    apiSecret: 'test-client-secret',
    baseUrl,
    timeout: 1_000,
    ...options,
  });
}

function latestRequest(pathname) {
  const matching = requests.filter((request) => request.pathname === pathname);
  assert.ok(matching.length > 0, `Expected a request for ${pathname}.`);
  return matching.at(-1);
}

before(async () => {
  server = createServer(async (request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    const body = await readJson(request);
    requests.push({
      pathname: url.pathname,
      method: request.method,
      headers: request.headers,
      body,
    });

    if (url.pathname === '/api/v1/testing/timeout') {
      return;
    }

    const errorMatch = url.pathname.match(/^\/api\/v1\/testing\/errors\/(401|402|422|429|503)$/);
    if (errorMatch != null) {
      const status = Number(errorMatch[1]);
      json(response, status, {
        success: false,
        request_id: `offline-error-${status}`,
        error: {
          code: `offline_${status}`,
          message: `Offline error ${status}.`,
          details: status === 422 ? { ip: ['The IP address is invalid.'] } : {},
        },
      });
      return;
    }

    if (url.pathname === '/api/v1/utilities/barcode/generate') {
      response.writeHead(200, {
        'content-type': 'image/png',
        'x-apix-request-id': 'offline-barcode',
      });
      response.end(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
      return;
    }

    if (url.pathname === '/api/v1/utilities/qr/generate') {
      if (body.format === 'base64') {
        json(response, 200, {
          success: true,
          request_id: 'offline-qr-base64',
          data: {
            format: 'base64',
            data_uri: 'data:image/png;base64,b2ZmbGluZS1xcg==',
          },
        });
        return;
      }

      response.writeHead(200, {
        'content-type': 'image/png',
        'x-apix-request-id': 'offline-qr-binary',
      });
      response.end(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
      return;
    }

    if (url.pathname === '/api/v1/utilities/pdf/generate') {
      if (body.response_type === 'base64') {
        json(response, 200, {
          success: true,
          request_id: 'offline-pdf-base64',
          data: {
            format: 'base64',
            media_type: 'application/pdf',
            data: 'b2ZmbGluZS1wZGY=',
          },
        });
        return;
      }

      response.writeHead(200, {
        'content-type': 'application/pdf',
        'x-apix-request-id': 'offline-pdf-binary',
      });
      response.end(Buffer.from('%PDF-offline'));
      return;
    }

    json(response, 200, {
      success: true,
      request_id: 'offline-success',
      data: {
        count: 1,
        codes: [{ code: 'LKR', name: 'Sri Lankan Rupee' }],
      },
    });
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = `http://127.0.0.1:${address.port}/api/v1`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('supports one-shot privacy mode on every provider service', async () => {
  const client = createClient();
  const cases = [
    {
      pathname: '/api/v1/utility/currency/codes',
      service: () => client.currency(),
      execute: (service) => service.getCodes(),
    },
    {
      pathname: '/api/v1/security/vpn-shield',
      service: () => client.security(),
      execute: (service) => service.checkVpn({ ip: '203.0.113.10' }),
    },
    {
      pathname: '/api/v1/location/lookup',
      service: () => client.location(),
      execute: (service) => service.lookupIp({ ip: '203.0.113.10' }),
    },
    {
      pathname: '/api/v1/sms/balance',
      service: () => client.sms(),
      execute: (service) => service.getBalance(),
    },
    {
      pathname: '/api/v1/utilities/qr/generate',
      service: () => client.utilities(),
      execute: (service) => service.generateQr({ data: 'privacy-test', format: 'base64' }),
    },
  ];

  for (const current of cases) {
    const service = current.service();
    assert.equal(service.withPrivacyMode(), service);
    await current.execute(service);
    assert.equal(latestRequest(current.pathname).headers['x-privacy-mode'], '1');
  }
});

test('consumes privacy and provider overrides after one request', async () => {
  const client = createClient();
  const service = client.security();

  await service
    .withProvider('offline-provider')
    .withPrivacyMode()
    .checkVpn({ ip: '203.0.113.11' });

  const first = latestRequest('/api/v1/security/vpn-shield');
  assert.equal(first.headers['x-provider-override'], 'offline-provider');
  assert.equal(first.headers['x-privacy-mode'], '1');

  await service.checkVpn({ ip: '203.0.113.12' });
  const second = latestRequest('/api/v1/security/vpn-shield');
  assert.equal(second.headers['x-provider-override'], undefined);
  assert.equal(second.headers['x-privacy-mode'], undefined);
});

test('preserves boolean privacy convenience options as headers, not request fields', async () => {
  const client = createClient();

  await client.location().lookupIp({ ip: '203.0.113.13', privacyMode: true });
  const locationRequest = latestRequest('/api/v1/location/lookup');
  assert.equal(locationRequest.headers['x-privacy-mode'], '1');
  assert.deepEqual(locationRequest.body, { ip: '203.0.113.13' });

  await client.utilities().generateQr({
    data: 'privacy-qr',
    format: 'base64',
    privacyMode: true,
  });
  const qrRequest = latestRequest('/api/v1/utilities/qr/generate');
  assert.equal(qrRequest.headers['x-privacy-mode'], '1');
  assert.equal('privacy_mode' in qrRequest.body, false);

  await client.utilities().generateQr({ data: 'ordinary-qr', format: 'base64' });
  const ordinaryQrRequest = latestRequest('/api/v1/utilities/qr/generate');
  assert.equal(ordinaryQrRequest.headers['x-privacy-mode'], undefined);
});

test('normalizes supported paths and preserves environment headers', async () => {
  const client = createClient({ env: 'production' });
  const paths = [
    'utility/currency/codes',
    '/utility/currency/codes',
    '/api/v1/utility/currency/codes',
    `${baseUrl}/utility/currency/codes`,
  ];

  for (const path of paths) {
    await client.call('GET', path);
  }

  const request = latestRequest('/api/v1/utility/currency/codes');
  assert.equal(request.headers['x-env'], 'prod');
  assert.equal(createClient({ env: 'unexpected' }).config.env, 'dev');
});

test('maps standard gateway errors to their typed classes', async () => {
  const client = createClient();
  const errorCases = new Map([
    [401, ApixAuthenticationError],
    [402, ApixInsufficientFundsError],
    [422, ApixValidationError],
    [429, ApixRateLimitError],
    [503, ApixServiceUnavailableError],
  ]);

  for (const [status, ErrorClass] of errorCases) {
    await assert.rejects(
      client.call('GET', `/testing/errors/${status}`),
      (error) => {
        assert.ok(error instanceof ErrorClass);
        assert.equal(error.httpStatus, status);
        assert.equal(error.requestId, `offline-error-${status}`);
        return true;
      },
    );
  }
});

test('returns QR, barcode, and PDF binary/base64 responses', async () => {
  const client = createClient();
  const qrBinary = await client.utilities().generateQr({ data: 'offline-qr' });
  assert.ok(qrBinary instanceof BinaryResponse);
  assert.equal(qrBinary.contentType, 'image/png');

  const qrBase64 = await client.utilities().generateQr({
    data: 'offline-qr',
    format: 'base64',
  });
  assert.equal(qrBase64 instanceof BinaryResponse, false);
  assert.equal(qrBase64.data.format, 'base64');

  const barcode = await client.utilities().generateBarcode({ data: '1234567890' });
  assert.ok(barcode instanceof BinaryResponse);
  assert.equal(barcode.contentType, 'image/png');
  assert.equal(barcode.size, 4);

  const pdfBinary = await client.utilities().generatePdf({ html: '<h1>Offline</h1>' });
  assert.ok(pdfBinary instanceof BinaryResponse);
  assert.equal(pdfBinary.contentType, 'application/pdf');

  const pdfBase64 = await client.utilities().generatePdf({
    html: '<h1>Offline</h1>',
    responseType: 'base64',
  });
  assert.equal(pdfBase64 instanceof BinaryResponse, false);
  assert.equal(pdfBase64.data.media_type, 'application/pdf');
});

test('maps request timeouts to network errors', async () => {
  const timedOutClient = createClient({ timeout: 25 });
  await assert.rejects(
    timedOutClient.call('GET', '/testing/timeout'),
    (error) => error instanceof ApixNetworkError && error.httpStatus === 0,
  );
});

test('refuses browser-style client construction before credentials are used', () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');

  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {} });

  try {
    assert.throws(
      () => new ApixClient({ projectKey: 'id', apiSecret: 'secret' }),
      /server-only/,
    );
  } finally {
    if (originalWindow == null) {
      delete globalThis.window;
    } else {
      Object.defineProperty(globalThis, 'window', originalWindow);
    }

    if (originalDocument == null) {
      delete globalThis.document;
    } else {
      Object.defineProperty(globalThis, 'document', originalDocument);
    }
  }
});
