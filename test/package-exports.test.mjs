import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { after, before, test } from 'node:test';
import { createServer } from 'node:http';

const require = createRequire(import.meta.url);

let server;
let baseUrl;

before(async () => {
  server = createServer((request, response) => {
    if (request.url === '/api/v1/utility/currency/codes' && request.method === 'GET') {
      assert.equal(request.headers['x-api-key'], 'test-client-id');
      assert.equal(request.headers['x-api-secret'], 'test-client-secret');
      assert.equal(request.headers['x-env'], 'dev');

      response.writeHead(200, {
        'content-type': 'application/json',
        'x-apix-request-id': 'offline-currency-request',
      });
      response.end(JSON.stringify({
        success: true,
        request_id: 'offline-currency-request',
        data: {
          count: 1,
          codes: [{ code: 'LKR', name: 'Sri Lankan Rupee' }],
        },
      }));
      return;
    }

    response.writeHead(404, { 'content-type': 'application/json' });
    response.end(JSON.stringify({
      success: false,
      request_id: 'offline-not-found',
      error: { code: 'not_found', message: 'Not found.' },
    }));
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = `http://127.0.0.1:${address.port}/api/v1`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('loads the public package through ESM import', async () => {
  const sdk = await import('@avraapi/node-sdk');

  assert.equal(typeof sdk.ApixClient, 'function');
  assert.equal(typeof sdk.ApiResponse, 'function');
});

test('loads the public package through CommonJS require', () => {
  const sdk = require('@avraapi/node-sdk');

  assert.equal(typeof sdk.ApixClient, 'function');
  assert.equal(typeof sdk.BinaryResponse, 'function');
});

test('makes an offline request through the packaged ESM client', async () => {
  const { ApixClient } = await import('@avraapi/node-sdk');
  const client = new ApixClient({
    projectKey: 'test-client-id',
    apiSecret: 'test-client-secret',
    baseUrl,
    timeout: 1_000,
  });

  const response = await client.currency().getCodes();

  assert.equal(response.requestId, 'offline-currency-request');
  assert.deepEqual(response.data, {
    count: 1,
    codes: [{ code: 'LKR', name: 'Sri Lankan Rupee' }],
  });
});
