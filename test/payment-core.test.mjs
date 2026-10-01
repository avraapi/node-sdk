import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { after, before, test } from 'node:test';

import {
  ApixClient,
  CheckoutMode,
  CreateOrderOptions,
  GatewayCode,
  GatewayEnvironment,
  PaymentAccessError,
  PaymentAvailabilityReason,
  PaymentCompletionOptions,
  PaymentCompletionResult,
  PaymentConfigurationError,
  PaymentProviderError,
  PaymentResponseOptions,
  PaymentStatus,
  PaymentVerificationError,
  AuthorizationOptions,
  KokoCallbackPayload,
  KokoReturnPayload,
  MarxPayInitiatePaymentOptions,
  MarxPayReturnVerificationOptions,
  OnePayCallbackPayload,
  OnePayReturnPayload,
  PayPlusStatus,
  PayPlusCallbackPayload,
  PaymentElementsRenderer,
  PreapprovalOptions,
  RecurringOrderOptions,
  RedirectFormRenderer,
  DirectPayCallbackPayload,
  StripeReturnPayload,
  StripeWebhookPayload,
  WebXPayReturnPayload,
  SensitiveCallbackOptions,
  VerificationResult,
  VerifyCallbackOptions,
} from '@avraapi/node-sdk';

let server;
let baseUrl;
const requests = [];

function json(response, status, payload) {
  response.writeHead(status, {
    'content-type': 'application/json',
    'x-apix-request-id': `payment-${status}`,
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8');
  return text === '' ? {} : JSON.parse(text);
}

function createClient() {
  return new ApixClient({
    projectKey: 'test-client-id',
    apiSecret: 'test-client-secret',
    baseUrl,
    timeout: 1_000,
  });
}

function latestRequest(pathname) {
  const matching = requests.filter((request) => request.pathname === pathname);
  assert.ok(matching.length > 0, `Expected a request for ${pathname}.`);
  return matching.at(-1);
}

function paymentElementsAvailability(markup) {
  const match = markup.match(/<script[^>]+type="application\/json"[^>]*>([\s\S]*?)<\/script>/);
  assert.ok(match, 'Expected Payment Elements availability bootstrap JSON.');
  return JSON.parse(match[1]);
}

function assertInlinePaymentElementsScriptCompiles(markup) {
  const scripts = [...markup.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
  const inline = scripts.at(-1)?.[1];
  assert.equal(typeof inline, 'string', 'Expected the Payment Elements inline mount script.');
  assert.doesNotThrow(() => new Function('window', 'document', inline));
}

function paymentError(code) {
  return {
    success: false,
    request_id: `payment-error-${code}`,
    error: { code, message: `Offline payment error: ${code}.` },
  };
}

before(async () => {
  server = createServer(async (request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    const body = await readJson(request);
    requests.push({ pathname: url.pathname, method: request.method, headers: request.headers, body, query: url.searchParams });

    if (url.pathname === '/api/v1/payments/availability') {
      const error = url.searchParams.get('merchant_domain');
      if (error === 'access') return json(response, 403, paymentError('upg_entitlement_inactive'));
      if (error === 'configuration') return json(response, 422, paymentError('payment_mode_not_available'));
      if (error === 'provider') return json(response, 502, paymentError('payment_provider_declined'));
      if (error === 'verification') return json(response, 422, paymentError('payment_callback_invalid_signature'));

      return json(response, 200, {
        success: true,
        request_id: 'availability-request',
        data: {
          ready: false,
          reason: 'upg_entitlement_inactive',
          message: 'Payment methods are currently unavailable for this project.',
          methods: [{ gateway: 'payhere', available: false, label: 'PayHere' }],
        },
      });
    }

    if (url.pathname === '/api/v1/payments/methods') {
      return json(response, 200, {
        success: true,
        request_id: 'methods-request',
        data: { methods: [{ gateway: 'payhere', available: true, label: 'PayHere' }] },
      });
    }

    if (url.pathname === '/api/v1/payments/orders') {
      return json(response, 200, {
        success: true,
        request_id: 'order-request',
        data: {
          gateway: 'payhere',
          mode: 'redirect',
          status: 'prepared',
          expires_at: '2026-10-01T00:00:00Z',
          checkout: { action_url: 'https://checkout.example.test' },
          binding: { merchant_rid: 'ORDER-100' },
          verification: { algorithm: 'hmac' },
          completion_context: 'server-only-completion-context',
        },
      });
    }

    if (url.pathname === '/api/v1/payments/complete') {
      const paymentStatus = body.payload?.test_status ?? 'succeeded';
      return json(response, 200, {
        success: true,
        request_id: 'complete-request',
        data: {
          gateway: 'payhere',
          verified: true,
          payment_status: paymentStatus,
          provider_status: paymentStatus === 'succeeded' ? '2' : String(paymentStatus).toUpperCase(),
          order_id: 'ORDER-100',
          gateway_reference: 'PH-100',
          amount: '14500.00',
          currency: 'LKR',
          native_operations: { retrieval: { status: 'ok' } },
          reconciliation: { attempted: true, state: 'matched' },
        },
      });
    }

    if (url.pathname === '/api/v1/payments/callbacks/verify') {
      return json(response, 200, {
        success: true,
        request_id: 'verify-request',
        data: {
          verified: true,
          payment_status: 'pending',
          provider_status: 'PENDING',
          order_id: 'ORDER-100',
          amount: '14500.00',
          currency: 'LKR',
          flow: 'checkout',
        },
      });
    }

    if (url.pathname === '/api/v1/payments/sensitive/callbacks/verify') {
      return json(response, 200, {
        success: true,
        request_id: 'sensitive-request',
        data: {
          verified: true,
          payment_status: 'succeeded',
          provider_status: '2',
          order_id: 'ORDER-100',
          amount: '14500.00',
          currency: 'LKR',
          artifact: { kind: 'preapproval_token', value: 'server-vault-only-token' },
        },
      });
    }

    if (url.pathname === '/api/v1/payments/payhere/retrieval') {
      return json(response, 200, { success: true, request_id: 'payhere-retrieval', data: { payments: [{ payment_id: 'PH-1', order_id: url.searchParams.get('order_id') }] } });
    }
    if (url.pathname === '/api/v1/payments/payhere/refunds') {
      return json(response, 200, { success: true, request_id: 'payhere-refund', data: { accepted: true, refund_id: 'RF-1' } });
    }
    if (url.pathname === '/api/v1/payments/authorizations' || url.pathname === '/api/v1/payments/preapprovals' || url.pathname === '/api/v1/payments/recurring/orders') {
      return json(response, 200, { success: true, request_id: 'payhere-session', data: {
        gateway: 'payhere', mode: 'redirect', status: 'prepared', expires_at: null,
        checkout: { type: 'redirect_form', action_url: 'https://checkout.example.test', fields: { order_id: 'ORDER-ADV' } },
        binding: {}, verification: {}, completion_context: 'advanced-completion-context',
      } });
    }
    if (url.pathname === '/api/v1/payments/payhere/captures' || url.pathname === '/api/v1/payments/payhere/charges') {
      return json(response, 200, { success: true, request_id: 'payhere-command', data: { accepted: true, provider_status: '2' } });
    }
    if (url.pathname === '/api/v1/payments/payhere/subscriptions') {
      return json(response, 200, { success: true, request_id: 'payhere-subscriptions', data: { subscriptions: [{ subscription_id: '123', order_id: 'ORDER-SUB', status: 'ACTIVE', amount: '10.00', currency: 'LKR', recurrence: '1 Month' }] } });
    }
    if (/^\/api\/v1\/payments\/payhere\/subscriptions\/\d+$/.test(url.pathname)) {
      return json(response, 200, { success: true, request_id: 'payhere-subscription', data: { subscription: { subscription_id: '123', order_id: 'ORDER-SUB', status: 'ACTIVE' } } });
    }
    if (/^\/api\/v1\/payments\/payhere\/subscriptions\/\d+\/payments$/.test(url.pathname)) {
      return json(response, 200, { success: true, request_id: 'payhere-subscription-payments', data: { payments: [{ payment_id: 'PH-SUB-1' }] } });
    }
    if (url.pathname === '/api/v1/payments/payhere/subscriptions/retry' || url.pathname === '/api/v1/payments/payhere/subscriptions/cancel') {
      return json(response, 200, { success: true, request_id: 'payhere-subscription-command', data: { command_accepted: true, provider_status: 'ACCEPTED', subscription_id: body.subscription_id } });
    }
    if (url.pathname === '/api/v1/payments/marxpay/returns/verify') {
      return json(response, 200, { success: true, request_id: 'marx-verify', data: { verified: true, merchant_rid: 'MR-1', tr_id: '44' } });
    }
    if (url.pathname === '/api/v1/payments/marxpay/orders/initiate' || /^\/api\/v1\/payments\/marxpay\/orders\/[^/]+\/summary$/.test(url.pathname)) {
      return json(response, 200, { success: true, request_id: 'marx-result', data: { merchant_rid: 'MR-1', tr_id: '44', payment_status: 'succeeded', provider_status: 'SUCCESS', amount: '10.00', currency: 'LKR', payment_method: 'OTHER' } });
    }
    if (url.pathname === '/api/v1/payments/onepay/status' || url.pathname === '/api/v1/payments/webxpay/status') {
      return json(response, 200, { success: true, request_id: 'provider-status', data: { provider_status: 'SUCCESS' } });
    }
    if (url.pathname === '/api/v1/payments/koko/orders/view') {
      return json(response, 200, { success: true, request_id: 'koko-order', data: { order_id: body.order_id, gateway_reference: 'KOKO-1', provider_status: 'SUCCESS', native: { signed: true } } });
    }
    if (url.pathname === '/api/v1/payments/payplus/status') {
      return json(response, 200, { success: true, request_id: 'payplus-status', data: { order_id: body.order_id, provider_status: 'SUCCESS', timestamp: '2026-10-01T00:00:00Z' } });
    }

    return json(response, 404, paymentError('not_found'));
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = `http://127.0.0.1:${address.port}/api/v1`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('serializes create-order options exactly and preserves decimal strings', () => {
  const options = new CreateOrderOptions({
    gateway: GatewayCode.PayHere,
    mode: CheckoutMode.HostedSession,
    orderId: 'ORDER-100',
    items: 'Premium Wireless Headphones',
    amount: '14500.00',
    currency: 'lkr',
    customer: {
      first_name: 'Kaveesha', last_name: 'Gimhan', email: 'buyer@example.test', phone: '+94719594231',
      address_line_1: 'Hello World', address_line_2: 'Ward City', city: 'Gampaha', country: 'Sri Lanka',
    },
    urls: { return_url: 'https://shop.example.test/return', notify_url: 'https://shop.example.test/notify' },
    gatewayEnvironment: GatewayEnvironment.Production,
  });

  assert.deepEqual(options.toPayload(), {
    gateway: 'payhere',
    mode: 'redirect',
    gateway_environment: 'production',
    order: { id: 'ORDER-100', items: 'Premium Wireless Headphones', amount: '14500.00', currency: 'LKR' },
    customer: {
      first_name: 'Kaveesha', last_name: 'Gimhan', email: 'buyer@example.test', phone: '+94719594231',
      address_line_1: 'Hello World', address_line_2: 'Ward City', city: 'Gampaha', country: 'Sri Lanka', address: 'Hello World, Ward City',
    },
    urls: { return_url: 'https://shop.example.test/return', notify_url: 'https://shop.example.test/notify' },
    merchant_domain: null,
    provider_options: {},
  });
  assert.throws(() => new CreateOrderOptions({ ...options, amount: '0.00' }), /positive decimal string/);
});

test('resolves gateway environments separately from the API client environment', () => {
  const defaultEnvironment = process.env.APIX_PAYMENT_GATEWAY_ENV;
  const overrides = process.env.APIX_PAYMENT_GATEWAY_ENV_OVERRIDES;
  process.env.APIX_PAYMENT_GATEWAY_ENV = 'sandbox';
  process.env.APIX_PAYMENT_GATEWAY_ENV_OVERRIDES = 'payhere:production,onepay:sandbox';

  try {
    assert.equal(GatewayEnvironment.configuredFor(GatewayCode.PayHere), GatewayEnvironment.Production);
    assert.equal(GatewayEnvironment.configuredFor(GatewayCode.OnePay), GatewayEnvironment.Sandbox);
    assert.equal(GatewayEnvironment.configuredFor(GatewayCode.Stripe), GatewayEnvironment.Sandbox);
    assert.equal(GatewayEnvironment.configuredFor(GatewayCode.PayHere, GatewayEnvironment.Sandbox), GatewayEnvironment.Sandbox);
  } finally {
    if (defaultEnvironment == null) delete process.env.APIX_PAYMENT_GATEWAY_ENV;
    else process.env.APIX_PAYMENT_GATEWAY_ENV = defaultEnvironment;
    if (overrides == null) delete process.env.APIX_PAYMENT_GATEWAY_ENV_OVERRIDES;
    else process.env.APIX_PAYMENT_GATEWAY_ENV_OVERRIDES = overrides;
  }
});

test('resolves configured gateway environments when an order is serialized', () => {
  const defaultEnvironment = process.env.APIX_PAYMENT_GATEWAY_ENV;
  const overrides = process.env.APIX_PAYMENT_GATEWAY_ENV_OVERRIDES;
  const options = new CreateOrderOptions({
    gateway: GatewayCode.PayHere,
    mode: CheckoutMode.Redirect,
    orderId: 'ORDER-ENV-100',
    items: 'Sandbox order',
    amount: '10.00',
    currency: 'LKR',
    customer: {
      first_name: 'Saman', last_name: 'Perera', email: 'buyer@example.test', phone: '0771234567',
      address: 'No. 1', city: 'Colombo', country: 'Sri Lanka',
    },
    urls: { return_url: 'https://shop.example.test/return', notify_url: 'https://shop.example.test/notify' },
  });

  try {
    process.env.APIX_PAYMENT_GATEWAY_ENV = 'sandbox';
    assert.equal(options.toPayload().gateway_environment, GatewayEnvironment.Sandbox);
    process.env.APIX_PAYMENT_GATEWAY_ENV = 'production';
    assert.equal(options.toPayload().gateway_environment, GatewayEnvironment.Production);

    // PHP's explode(..., 2) treats this invalid environment as relevant only
    // when MarxPay is selected; another gateway still uses its default profile.
    process.env.APIX_PAYMENT_GATEWAY_ENV_OVERRIDES = 'marxpay:sandbox:legacy';
    assert.equal(GatewayEnvironment.configuredFor(GatewayCode.PayHere), GatewayEnvironment.Production);
    assert.throws(() => GatewayEnvironment.configuredFor(GatewayCode.MarxPay), /invalid environment/);
  } finally {
    if (defaultEnvironment == null) delete process.env.APIX_PAYMENT_GATEWAY_ENV;
    else process.env.APIX_PAYMENT_GATEWAY_ENV = defaultEnvironment;
    if (overrides == null) delete process.env.APIX_PAYMENT_GATEWAY_ENV_OVERRIDES;
    else process.env.APIX_PAYMENT_GATEWAY_ENV_OVERRIDES = overrides;
  }
});

test('discovers public availability and methods through the typed payment service', async () => {
  const client = createClient();
  assert.equal(client.payment(), client.payment());

  const availability = await client.payment().withPrivacyMode().availability('shop.example.test');
  assert.equal(availability.isReady(), false);
  assert.equal(availability.reason, PaymentAvailabilityReason.UpgEntitlementInactive);
  assert.deepEqual(availability.toElementsPayload(), {
    ready: false,
    reason: 'upg_entitlement_inactive',
    message: 'Payment methods are currently unavailable for this project.',
    methods: [{ gateway: 'payhere', available: false, label: 'PayHere' }],
  });

  const availabilityRequest = latestRequest('/api/v1/payments/availability');
  assert.equal(availabilityRequest.headers['x-privacy-mode'], '1');
  assert.equal(availabilityRequest.query.get('merchant_domain'), 'shop.example.test');

  const methods = await client.payment().methods();
  assert.deepEqual(methods, [{ gateway: 'payhere', available: true, label: 'PayHere' }]);
});

test('uses trusted server-only headers and maps all core lifecycle results', async () => {
  const client = createClient();
  const session = await client.payment().createOrder({
    gateway: GatewayCode.PayHere,
    mode: CheckoutMode.Redirect,
    orderId: 'ORDER-100',
    items: 'Premium Wireless Headphones',
    amount: '14500.00',
    currency: 'LKR',
    customer: {
      first_name: 'Saman', last_name: 'Perera', email: 'buyer@example.test', phone: '0771234567',
      address: 'No. 1', city: 'Colombo', country: 'Sri Lanka',
    },
    urls: { return_url: 'https://shop.example.test/return', notify_url: 'https://shop.example.test/notify' },
  });
  assert.equal(session.gateway, GatewayCode.PayHere);
  assert.equal(session.mode, CheckoutMode.Redirect);
  assert.equal(session.completionContext, 'server-only-completion-context');
  assert.equal(latestRequest('/api/v1/payments/orders').body.order.amount, '14500.00');

  const complete = await client.payment().completePayment(new PaymentCompletionOptions({
    gateway: GatewayCode.PayHere,
    completionContext: session.completionContext,
    payload: { status_code: '2' },
    response: PaymentResponseOptions.full(),
  }));
  assert.equal(complete.paymentStatus, PaymentStatus.Succeeded);
  assert.equal(complete.reconciliation.state, 'matched');
  const completeRequest = latestRequest('/api/v1/payments/complete');
  assert.equal(completeRequest.headers['x-avraapi-completion-delivery'], 'merchant-server');
  assert.equal(completeRequest.body.response.mode, 'full');
  assert.equal(completeRequest.body.reconcile_provider, true);

  const skipReconciliation = new PaymentCompletionOptions({
    gateway: GatewayCode.PayHere,
    completionContext: session.completionContext,
    payload: { status_code: '2' },
    reconcileProvider: false,
  });
  assert.equal(skipReconciliation.toPayload().reconcile_provider, false);

  const failed = await client.payment().completePayment({
    gateway: GatewayCode.PayHere,
    completionContext: session.completionContext,
    payload: { test_status: 'failed' },
  });
  const cancelled = await client.payment().completePayment({
    gateway: GatewayCode.PayHere,
    completionContext: session.completionContext,
    payload: { test_status: 'cancelled' },
  });
  assert.equal(failed.paymentStatus, PaymentStatus.Failed);
  assert.equal(cancelled.paymentStatus, PaymentStatus.Cancelled);

  const verified = await client.payment().verifyCallback(new VerifyCallbackOptions({
    gateway: GatewayCode.PayHere,
    payload: { status_code: '2' },
    orderId: 'ORDER-100', amount: '14500.00', currency: 'lkr',
  }));
  assert.equal(verified.paymentStatus, PaymentStatus.Pending);
  assert.equal(latestRequest('/api/v1/payments/callbacks/verify').body.expected.currency, 'LKR');

  const sensitive = await client.payment().verifySensitiveCallback(new SensitiveCallbackOptions({
    flow: 'preapproval', payload: { status_code: '2' }, orderId: 'ORDER-100', amount: '14500.00', currency: 'LKR',
  }));
  assert.equal(sensitive.artifact.kind, 'preapproval_token');
  assert.equal(sensitive.artifact.value, 'server-vault-only-token');
  assert.throws(() => JSON.stringify(sensitive.artifact), /must not be serialized/);
  assert.equal(latestRequest('/api/v1/payments/sensitive/callbacks/verify').headers['x-avraapi-artifact-delivery'], 'merchant-server');
});

test('ports gateway-specific PHP payment contracts through typed Node services', async () => {
  const client = createClient();
  const payHere = client.payment().payHere();
  assert.equal(client.payment().payhere(), payHere);
  assert.equal(client.payment().marxpay(), client.payment().marxPay());
  assert.equal(client.payment().onepay(), client.payment().onePay());
  assert.equal(client.payment().payplus(), client.payment().payPlus());
  assert.equal(client.payment().webxpay(), client.payment().webXPay());

  const retrieval = await payHere.retrieval().findByOrderId('ORDER-ADV', GatewayEnvironment.Sandbox);
  assert.deepEqual(retrieval, [{ payment_id: 'PH-1', order_id: 'ORDER-ADV' }]);
  assert.equal(latestRequest('/api/v1/payments/payhere/retrieval').query.get('gateway_environment'), 'sandbox');

  await payHere.refunds().create({
    idempotencyKey: 'refund-1', paymentId: 'PH-1', description: 'Customer requested refund', confirmRefund: true, amount: '5.00',
  });
  const refund = latestRequest('/api/v1/payments/payhere/refunds');
  assert.equal(refund.headers['idempotency-key'], 'refund-1');
  assert.deepEqual(refund.body, { payment_id: 'PH-1', description: 'Customer requested refund', confirm_refund: true, amount: '5.00' });
  await assert.rejects(
    payHere.refunds().create({ idempotencyKey: 'refund-2', paymentId: 'PH-1', authorizationToken: 'token', description: 'x', confirmRefund: true }),
    /exactly one PayHere payment ID/,
  );

  const orderInput = {
    gateway: GatewayCode.PayHere, mode: CheckoutMode.Redirect, orderId: 'ORDER-ADV', items: 'Advanced payment', amount: '10.00', currency: 'LKR',
    customer: { first_name: 'Saman', last_name: 'Perera', email: 'buyer@example.test', phone: '0771234567', address: 'No. 1', city: 'Colombo', country: 'Sri Lanka' },
    urls: { return_url: 'https://shop.example.test/return', notify_url: 'https://shop.example.test/notify' },
  };
  const authorization = await payHere.authorizations().create(new AuthorizationOptions(orderInput));
  assert.equal(authorization.completionContext, 'advanced-completion-context');
  const { amount: _preapprovalAmount, ...preapprovalInput } = orderInput;
  const preapproval = new PreapprovalOptions({ ...preapprovalInput, currency: 'USD' });
  assert.equal(preapproval.callbackAmount(), '0.51');
  await payHere.preapprovals().create(preapproval);
  await payHere.recurring().create(new RecurringOrderOptions({ ...orderInput, recurrence: '1 Month', duration: 'Forever' }));
  assert.equal(latestRequest('/api/v1/payments/recurring/orders').body.recurring.recurrence, '1 Month');

  await payHere.captures().create({
    idempotencyKey: 'capture-1', authorizationToken: 'authorization-token', amount: '10.00', expectedAuthorizedAmount: '10.00', expectedOrderId: 'ORDER-ADV', currency: 'LKR', deductionDetails: 'Capture order', confirmCapture: true,
  });
  await payHere.charges().create({
    idempotencyKey: 'charge-1', orderId: 'ORDER-ADV', items: 'Advanced payment', currency: 'LKR', amount: '10.00', customerToken: 'customer-token', confirmCharge: true,
  });
  const subscriptions = await payHere.subscriptions().all();
  assert.equal(subscriptions[0].subscriptionId, '123');
  assert.equal((await payHere.subscriptions().find('123')).status, 'ACTIVE');
  assert.deepEqual(await payHere.subscriptions().payments('123'), [{ payment_id: 'PH-SUB-1' }]);
  assert.equal((await payHere.subscriptions().retry({ idempotencyKey: 'retry-1', subscriptionId: '123', confirmRetry: true })).accepted, true);
  assert.equal((await payHere.subscriptions().cancel({ idempotencyKey: 'cancel-1', subscriptionId: '123', confirmCancel: true })).providerStatus, 'ACCEPTED');
  await assert.rejects(payHere.subscriptions().find('not-numeric'), /numeric subscription ID/);

  const marx = client.payment().marxPay();
  assert.equal((await marx.verifyReturn(new MarxPayReturnVerificationOptions({ returnedMerchantRid: 'MR-1', returnedTrId: '44', expectedMerchantRid: 'MR-1', expectedTrId: '44' }))).verified, true);
  assert.equal((await marx.initiatePayment(new MarxPayInitiatePaymentOptions({ trId: '44', merchantRid: 'MR-1' }))).providerStatus, 'SUCCESS');
  assert.equal((await marx.retrieveOrderSummary('44', 'MR-1')).trId, '44');

  assert.equal((await client.payment().onePay().status('ONEPAY-1')).provider_status, 'SUCCESS');
  assert.equal((await client.payment().koko().orderView('KOKO-ORDER')).gatewayReference, 'KOKO-1');
  const payPlus = await client.payment().payPlus().status('PAYPLUS-ORDER');
  assert.ok(payPlus instanceof PayPlusStatus);
  assert.equal(payPlus.providerStatus, 'SUCCESS');
  assert.equal((await client.payment().webXPay().status('WEBXPAY-ORDER')).provider_status, 'SUCCESS');
  assert.equal(latestRequest('/api/v1/payments/onepay/status').headers['x-avraapi-completion-delivery'], 'merchant-server');
  assert.equal(latestRequest('/api/v1/payments/webxpay/status').headers['x-avraapi-completion-delivery'], 'merchant-server');

  assert.deepEqual(new OnePayCallbackPayload({ transaction: 'onepay' }).toPayload(), { callback: { transaction: 'onepay' } });
  assert.deepEqual(new OnePayReturnPayload({ transaction: 'onepay' }).toPayload(), { return: { transaction: 'onepay' } });
  assert.deepEqual(new KokoCallbackPayload({ orderId: 'ORDER-ADV', transactionId: 'TRN-1', status: 'SUCCESS', description: 'Approved', signature: 'signature' }).toPayload().trnId, 'TRN-1');
  assert.deepEqual(KokoCallbackPayload.fromForm({ orderId: ' ORDER-ADV ', trnId: ' TRN-1 ', status: ' SUCCESS ', desc: ' Approved ', signature: ' signature ' }).toPayload(), {
    orderId: 'ORDER-ADV', trnId: 'TRN-1', status: 'SUCCESS', desc: 'Approved', signature: 'signature',
  });
  assert.deepEqual(new KokoReturnPayload({ orderId: 'ORDER-ADV', transactionId: 'TRN-1' }).toPayload(), { orderId: 'ORDER-ADV', trnId: 'TRN-1' });
  assert.deepEqual(KokoReturnPayload.fromQuery({ orderId: ' ORDER-ADV ', trnId: ' TRN-1 ', status: ' SUCCESS ' }).toPayload(), {
    orderId: 'ORDER-ADV', trnId: 'TRN-1', status: 'SUCCESS',
  });
  assert.deepEqual(new WebXPayReturnPayload({ result3ds: 'ok' }).toPayload(), { return: { result3ds: 'ok' } });
  assert.deepEqual(new PayPlusCallbackPayload('eyJvcmRlcklkIjoiUEFZLTIifQ==', 'hmac signature').toPayload(), { raw_body: 'eyJvcmRlcklkIjoiUEFZLTIifQ==', authorization: 'hmac signature' });
  assert.deepEqual(new DirectPayCallbackPayload('{"orderId":"DIRECT-1"}', 'hmac signature').toPayload(), { raw_body: '{"orderId":"DIRECT-1"}', authorization: 'hmac signature' });
  assert.deepEqual(new StripeReturnPayload('cs_test_1').toPayload(), { return: { session_id: 'cs_test_1' } });
  assert.deepEqual(new StripeWebhookPayload('{"id":"evt_1"}', 't=1,v1=signature').toPayload(), { webhook: { raw_body_base64: 'eyJpZCI6ImV2dF8xIn0=', stripe_signature: 't=1,v1=signature' } });

  const form = RedirectFormRenderer.render(authorization, 'Pay securely');
  assert.match(form, /action="https:\/\/checkout\.example\.test"/);
  assert.match(form, /Pay securely/);
  const elementsAvailability = {
    ready: true,
    reason: null,
    message: 'Payment methods are ready.',
    methods: [{ gateway: 'payhere', available: true }],
  };
  const elements = PaymentElementsRenderer.renderMethods('paymentMethods', { availability: elementsAvailability });
  assert.match(elements, /v1\.1\.0\/avraapi-payment-elements\.umd\.js/);
  assert.match(elements, /avraapi-payment-availability/);
  assert.deepEqual(paymentElementsAvailability(elements), elementsAvailability);
  assertInlinePaymentElementsScriptCompiles(elements);
  assert.match(elements, /window\.AvraAPIPaymentElements\.create\(\{"assetBaseUrl":"https:\/\/cdn\.avraapi\.com\/payment-elements"\}\)/);
  assert.match(client.payment().renderForm('paymentForm'), /data-avraapi-elements-mount="form"/);
  const serviceElements = await client.payment().renderMethods('paymentMethodsFromService');
  assert.deepEqual(paymentElementsAvailability(serviceElements), {
    ready: false,
    reason: 'upg_entitlement_inactive',
    message: 'Payment methods are currently unavailable for this project.',
    methods: [{ gateway: 'payhere', available: false, label: 'PayHere' }],
  });
  assertInlinePaymentElementsScriptCompiles(serviceElements);
});

test('maps access, configuration, provider, and callback verification failures to payment errors', async () => {
  const client = createClient();
  const cases = [
    ['access', PaymentAccessError],
    ['configuration', PaymentConfigurationError],
    ['provider', PaymentProviderError],
    ['verification', PaymentVerificationError],
  ];

  for (const [domain, ErrorClass] of cases) {
    await assert.rejects(
      client.payment().availability(domain),
      (error) => error instanceof ErrorClass && error.requestId === `payment-error-${error.errorCode}`,
    );
  }
});

test('preserves the APIX-authoritative status and reconciliation metadata', () => {
  const verifiedCallback = PaymentCompletionResult.fromData({
    gateway: 'payhere',
    verified: true,
    payment_status: 'succeeded',
    provider_status: '2',
    reconciliation: {
      attempted: true,
      state: 'unavailable',
      authority: 'callback',
      callback_status: '2',
      secondary_status: null,
      retry_recommended: true,
    },
  }, 'completion-verified-callback');
  assert.equal(verifiedCallback.paymentStatus, PaymentStatus.Succeeded);
  assert.equal(verifiedCallback.providerStatus, '2');
  assert.equal(verifiedCallback.reconciliation.state, 'unavailable');

  const completion = PaymentCompletionResult.fromData({
    gateway: 'payhere',
    verified: true,
    payment_status: 'unknown',
    provider_status: '2',
    reconciliation: {
      attempted: true,
      state: 'unavailable',
      authority: 'callback',
      callback_status: '2',
      secondary_status: null,
      retry_recommended: true,
    },
  }, 'completion-unknown');
  assert.equal(completion.paymentStatus, PaymentStatus.Unknown);
  assert.equal(completion.providerStatus, '2');
  assert.deepEqual(completion.reconciliation, {
    attempted: true,
    state: 'unavailable',
    authority: 'callback',
    callback_status: '2',
    secondary_status: null,
    retry_recommended: true,
  });

  const verification = VerificationResult.fromData({
    verified: true,
    payment_status: 'succeeded',
    provider_status: 2,
    order_id: 'ORDER-100',
    amount: '14500.00',
    currency: 'LKR',
  }, 'verification-numeric-status');
  assert.equal(verification.providerStatus, '2');
});

test('rejects invalid core input before it can be sent to a gateway', () => {
  assert.throws(
    () => new PaymentCompletionOptions({ gateway: GatewayCode.PayHere, completionContext: ' ', payload: {} }),
    /completion context/,
  );
  assert.throws(
    () => new VerifyCallbackOptions({ gateway: GatewayCode.PayHere, payload: {}, orderId: '', amount: '10.00', currency: 'LKR' }),
    /Expected order ID/,
  );
  assert.throws(
    () => new SensitiveCallbackOptions({ flow: 'unsupported', payload: {}, orderId: 'ORDER-100', amount: '10.00', currency: 'LKR' }),
    /Sensitive callback flow/,
  );
  assert.throws(
    () => new PaymentCompletionOptions({ gateway: GatewayCode.PayHere, completionContext: 'context', payload: {}, reconcileProvider: 'false' }),
    /reconcileProvider must be a boolean/,
  );
  assert.throws(() => PaymentResponseOptions.include(['']), /include paths/);
  assert.throws(
    () => new CreateOrderOptions({
      gateway: 'not-a-gateway', mode: CheckoutMode.Redirect, orderId: 'ORDER-INVALID', items: 'Item', amount: '10.00', currency: 'LKR',
      customer: { first_name: 'Saman', last_name: 'Perera', email: 'buyer@example.test', phone: '0771234567', address: 'No. 1', city: 'Colombo', country: 'Sri Lanka' },
      urls: {},
    }),
    /Payment gateway is not supported/,
  );
});
