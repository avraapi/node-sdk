/**
 * Gateway-specific, server-only contracts for the Universal Payment Gateway.
 *
 * These classes intentionally mirror the PHP SDK's public payment contracts.
 * They contain no merchant credentials and must only be instantiated in
 * trusted backend code.
 */

import {
  CheckoutMode,
  CreateOrderOptions,
  type CreateOrderOptionsInput,
  GatewayCode,
  GatewayEnvironment,
  type PaymentPayload,
  type PaymentResponseMode,
  type PaymentCustomer,
  type PaymentProviderOptions,
  type PaymentUrls,
  PaymentSession,
} from './PaymentTypes.js';

export interface PayHereRefundInput {
  readonly idempotencyKey: string;
  readonly paymentId?: string | null;
  readonly authorizationToken?: string | null;
  readonly description: string;
  readonly confirmRefund: boolean;
  readonly amount?: string | null;
  readonly gatewayEnvironment?: GatewayEnvironment | null;
}

export interface PayHereCaptureInput {
  readonly idempotencyKey: string;
  readonly authorizationToken: string;
  readonly amount: string;
  readonly expectedAuthorizedAmount: string;
  readonly expectedOrderId: string;
  readonly currency: string;
  readonly deductionDetails: string;
  readonly confirmCapture: boolean;
  readonly gatewayEnvironment?: GatewayEnvironment | null;
}

export interface PayHereChargeInput {
  readonly idempotencyKey: string;
  readonly orderId: string;
  readonly items: string;
  readonly currency: string;
  readonly amount: string;
  readonly customerToken: string;
  readonly confirmCharge: boolean;
  readonly gatewayEnvironment?: GatewayEnvironment | null;
}

export interface PayHereSubscriptionCommandInput {
  readonly idempotencyKey: string;
  readonly subscriptionId: string;
  readonly gatewayEnvironment?: GatewayEnvironment | null;
}

/** Server-only PayHere authorization hold request. */
export class AuthorizationOptions {
  public readonly order: CreateOrderOptions;

  public constructor(order: CreateOrderOptions | CreateOrderOptionsInput) {
    this.order = order instanceof CreateOrderOptions ? order : new CreateOrderOptions(order);
    if (this.order.gateway !== GatewayCode.PayHere || this.order.mode !== CheckoutMode.Redirect) {
      throw new TypeError('PayHere authorization requires a PayHere redirect order.');
    }
  }

  public toPayload(): PaymentPayload {
    return this.order.toPayload();
  }
}

export interface PreapprovalOptionsInput {
  readonly orderId: string;
  readonly items: string;
  readonly currency: string;
  readonly customer: PaymentCustomer;
  readonly urls: PaymentUrls;
  readonly amount?: string | null;
  readonly merchantDomain?: string | null;
}

/** Server-only PayHere preapproval request. */
export class PreapprovalOptions {
  public readonly orderId: string;
  public readonly items: string;
  public readonly currency: string;
  public readonly customer: PaymentCustomer;
  public readonly urls: PaymentUrls;
  public readonly amount: string | null;
  public readonly merchantDomain: string | null;

  public constructor(input: PreapprovalOptionsInput) {
    if (input.orderId.trim() === '' || input.items.trim() === '' || !['LKR', 'USD'].includes(input.currency.toUpperCase())) {
      throw new TypeError('PayHere preapproval requires order ID, items, and LKR or USD currency.');
    }
    if (input.amount != null && !isPositiveAmount(input.amount)) {
      throw new TypeError('Optional preapproval amount must be a positive decimal string.');
    }
    this.orderId = input.orderId;
    this.items = input.items;
    this.currency = input.currency.toUpperCase();
    this.customer = { ...input.customer };
    this.urls = { ...input.urls };
    this.amount = input.amount ?? null;
    this.merchantDomain = input.merchantDomain ?? null;
  }

  public toPayload(): PaymentPayload {
    return {
      gateway: GatewayCode.PayHere,
      mode: CheckoutMode.Redirect,
      order: {
        id: this.orderId,
        items: this.items,
        currency: this.currency,
        ...(this.amount == null ? {} : { amount: this.amount }),
      },
      customer: { ...this.customer },
      urls: { ...this.urls },
      merchant_domain: this.merchantDomain,
    };
  }

  public callbackAmount(): string {
    return this.amount ?? (this.currency === 'LKR' ? '10.00' : '0.51');
  }
}

export interface RecurringOrderOptionsInput extends CreateOrderOptionsInput {
  readonly recurrence: string;
  readonly duration: string;
  readonly startupFee?: string | null;
  readonly recurringStartDate?: string | null;
  readonly autoCancel?: boolean | null;
  readonly maxRetries?: number | null;
  readonly isRecoveryDue?: boolean | null;
}

/** Server-only recurring payment request. */
export class RecurringOrderOptions {
  private readonly order: CreateOrderOptions;
  public readonly recurrence: string;
  public readonly duration: string;
  public readonly startupFee: string | null;
  public readonly recurringStartDate: string | null;
  public readonly autoCancel: boolean | null;
  public readonly maxRetries: number | null;
  public readonly isRecoveryDue: boolean | null;

  public constructor(input: RecurringOrderOptionsInput) {
    this.order = new CreateOrderOptions(input);
    if (!/^[1-9]\d* (?:Week|Month|Year)$/.test(input.recurrence)) {
      throw new TypeError('Recurring recurrence must use values such as "1 Month".');
    }
    if (input.duration !== 'Forever' && !/^[1-9]\d* (?:Week|Month|Year)$/.test(input.duration)) {
      throw new TypeError('Recurring duration must be "Forever" or a value such as "1 Year".');
    }
    if (input.maxRetries != null && (!Number.isInteger(input.maxRetries) || input.maxRetries < 0 || input.maxRetries > 365)) {
      throw new TypeError('maxRetries must be an integer from 0 to 365.');
    }
    this.recurrence = input.recurrence;
    this.duration = input.duration;
    this.startupFee = input.startupFee ?? null;
    this.recurringStartDate = input.recurringStartDate ?? null;
    this.autoCancel = input.autoCancel ?? null;
    this.maxRetries = input.maxRetries ?? null;
    this.isRecoveryDue = input.isRecoveryDue ?? null;
  }

  public toPayload(): PaymentPayload {
    const base = this.order.toPayload();
    return {
      ...base,
      recurring: compact({
        recurrence: this.recurrence,
        duration: this.duration,
        startup_fee: this.startupFee,
        recurring_start_date: this.recurringStartDate,
        auto_cancel: this.autoCancel,
        max_retries: this.maxRetries,
        is_recovery_due: this.isRecoveryDue,
      }),
    };
  }
}

export interface MarxPayInitiatePaymentOptionsInput {
  readonly trId: string;
  readonly merchantRid: string;
  readonly gatewayEnvironment?: GatewayEnvironment | null;
}

export class MarxPayInitiatePaymentOptions {
  public readonly trId: string;
  public readonly merchantRid: string;
  public readonly gatewayEnvironment: GatewayEnvironment | null;

  public constructor(input: MarxPayInitiatePaymentOptionsInput) {
    if (input.trId.trim() === '' || input.merchantRid.trim() === '') {
      throw new TypeError('A MarxPay trId and merchantRID are required.');
    }
    this.trId = input.trId;
    this.merchantRid = input.merchantRid;
    this.gatewayEnvironment = input.gatewayEnvironment ?? null;
  }

  public toPayload(): PaymentPayload {
    return compact({ tr_id: this.trId, merchant_rid: this.merchantRid, gateway_environment: this.gatewayEnvironment });
  }
}

export interface MarxPayReturnVerificationOptionsInput {
  readonly returnedMerchantRid: string;
  readonly returnedTrId: string;
  readonly expectedMerchantRid: string;
  readonly expectedTrId: string;
  readonly gatewayEnvironment?: GatewayEnvironment | null;
}

export class MarxPayReturnVerificationOptions {
  public readonly returnedMerchantRid: string;
  public readonly returnedTrId: string;
  public readonly expectedMerchantRid: string;
  public readonly expectedTrId: string;
  public readonly gatewayEnvironment: GatewayEnvironment | null;

  public constructor(input: MarxPayReturnVerificationOptionsInput) {
    for (const value of [input.returnedMerchantRid, input.returnedTrId, input.expectedMerchantRid, input.expectedTrId]) {
      if (value.trim() === '') throw new TypeError('Both returned and expected MarxPay merchantRID/trId values are required.');
    }
    this.returnedMerchantRid = input.returnedMerchantRid;
    this.returnedTrId = input.returnedTrId;
    this.expectedMerchantRid = input.expectedMerchantRid;
    this.expectedTrId = input.expectedTrId;
    this.gatewayEnvironment = input.gatewayEnvironment ?? null;
  }

  public toPayload(): PaymentPayload {
    return compact({
      payload: { merchantRID: this.returnedMerchantRid, trId: this.returnedTrId },
      expected: { merchant_rid: this.expectedMerchantRid, tr_id: this.expectedTrId },
      gateway_environment: this.gatewayEnvironment,
    });
  }
}

export class MarxPayPaymentResult {
  public constructor(
    public readonly merchantRid: string,
    public readonly trId: string,
    public readonly paymentStatus: string,
    public readonly providerStatus: string,
    public readonly amount: string | null,
    public readonly currency: string | null,
    public readonly paymentMethod: string | null,
    public readonly expiresAt: string | null,
    public readonly requestId: string | null,
  ) {}

  public static fromData(data: PaymentPayload, requestId: string | null): MarxPayPaymentResult {
    for (const field of ['merchant_rid', 'tr_id', 'payment_status', 'provider_status']) {
      if (!isScalar(data[field])) throw new TypeError('AvraAPI returned an invalid MarxPay payment result.');
    }
    return new MarxPayPaymentResult(
      String(data.merchant_rid), String(data.tr_id), String(data.payment_status), String(data.provider_status),
      nullableScalar(data.amount), nullableScalar(data.currency), nullableScalar(data.payment_method), nullableScalar(data.expires_at), requestId,
    );
  }
}

export class MarxPayReturnVerification {
  public constructor(public readonly verified: true, public readonly merchantRid: string, public readonly trId: string, public readonly requestId: string | null) {}

  public static fromData(data: PaymentPayload, requestId: string | null): MarxPayReturnVerification {
    if (data.verified !== true || !isScalar(data.merchant_rid) || !isScalar(data.tr_id)) {
      throw new TypeError('AvraAPI returned an invalid MarxPay return verification result.');
    }
    return new MarxPayReturnVerification(true, String(data.merchant_rid), String(data.tr_id), requestId);
  }
}

export class SubscriptionSummary {
  public constructor(
    public readonly subscriptionId: string | null,
    public readonly orderId: string | null,
    public readonly status: string,
    public readonly amount: string | null,
    public readonly currency: string | null,
    public readonly recurrence: string | null,
  ) {}

  public static fromData(data: PaymentPayload): SubscriptionSummary {
    return new SubscriptionSummary(
      nullableScalar(data.subscription_id), nullableScalar(data.order_id), String(data.status ?? 'UNKNOWN'),
      nullableScalar(data.amount), nullableScalar(data.currency), nullableScalar(data.recurrence),
    );
  }
}

export class SubscriptionCommandResult {
  public constructor(public readonly accepted: boolean, public readonly providerStatus: string, public readonly subscriptionId: string) {}

  public static fromData(data: PaymentPayload): SubscriptionCommandResult {
    return new SubscriptionCommandResult(data.command_accepted === true, String(data.provider_status ?? 'unknown'), String(data.subscription_id ?? ''));
  }
}

export class KokoOrderView {
  public constructor(
    public readonly orderId: string,
    public readonly gatewayReference: string,
    public readonly providerStatus: string,
    public readonly native: PaymentPayload,
    public readonly requestId: string | null,
  ) {}

  public static fromData(data: PaymentPayload, requestId: string | null): KokoOrderView {
    for (const field of ['order_id', 'gateway_reference', 'provider_status']) {
      if (!isScalar(data[field]) || String(data[field]).trim() === '') throw new TypeError('AvraAPI returned an invalid KOKO order-view result.');
    }
    return new KokoOrderView(
      String(data.order_id), String(data.gateway_reference), String(data.provider_status),
      isRecord(data.native) ? { ...data.native } : {}, requestId,
    );
  }
}

export class PayPlusStatus {
  public constructor(public readonly orderId: string, public readonly providerStatus: string, public readonly timestamp: string | null, public readonly requestId: string | null) {}

  public static fromData(data: PaymentPayload, requestId: string | null): PayPlusStatus {
    if (!isScalar(data.order_id) || !isScalar(data.provider_status)) throw new TypeError('AvraAPI returned an invalid PayPlus payment status.');
    return new PayPlusStatus(String(data.order_id), String(data.provider_status), nullableScalar(data.timestamp), requestId);
  }
}

/** Exact signed PayPlus callback evidence for merchant-server completion only. */
export class PayPlusCallbackPayload {
  public readonly rawBody: string;
  public readonly authorization: string;

  public constructor(rawBody: string, authorization: string) {
    if (rawBody.trim() === '' || authorization.trim() === '') {
      throw new TypeError('PayPlus raw callback body and Authorization header are required.');
    }
    this.rawBody = rawBody;
    this.authorization = authorization;
  }

  public toPayload(): PaymentPayload {
    return { raw_body: this.rawBody, authorization: this.authorization };
  }
}

/** Exact DirectPay callback evidence for merchant-server completion only. */
export class DirectPayCallbackPayload {
  public readonly rawBody: string;
  public readonly authorization: string;

  public constructor(rawBody: string, authorization: string) {
    if (rawBody.trim() === '' || authorization.trim() === '') {
      throw new TypeError('DirectPay raw callback body and Authorization header are required.');
    }
    this.rawBody = rawBody;
    this.authorization = authorization;
  }

  public toPayload(): PaymentPayload {
    return { raw_body: this.rawBody, authorization: this.authorization };
  }
}

/** Untrusted Stripe browser return: AvraAPI retrieves the bound Checkout Session. */
export class StripeReturnPayload {
  public readonly sessionId: string;

  public constructor(sessionId: string) {
    if (!sessionId.startsWith('cs_')) throw new TypeError('A Stripe Checkout Session ID is required.');
    this.sessionId = sessionId;
  }

  public toPayload(): PaymentPayload {
    return { return: { session_id: this.sessionId } };
  }
}

/** Exact raw Stripe webhook evidence, Base64-wrapped only for JSON transport. */
export class StripeWebhookPayload {
  public readonly rawBody: string;
  public readonly stripeSignature: string;

  public constructor(rawBody: string, stripeSignature: string) {
    if (rawBody === '' || stripeSignature.trim() === '') {
      throw new TypeError('Stripe raw webhook body and Stripe-Signature are required.');
    }
    this.rawBody = rawBody;
    this.stripeSignature = stripeSignature;
  }

  public toPayload(): PaymentPayload {
    return {
      webhook: {
        raw_body_base64: Buffer.from(this.rawBody, 'utf8').toString('base64'),
        stripe_signature: this.stripeSignature,
      },
    };
  }
}

/** Untrusted OnePay Dashboard callback: use only as a server-side completion trigger. */
export class OnePayCallbackPayload {
  public constructor(private readonly callback: PaymentPayload) {}
  public toPayload(): PaymentPayload { return { callback: { ...this.callback } }; }
}

/** Untrusted OnePay browser return: use only as a server-side completion trigger. */
export class OnePayReturnPayload {
  public constructor(private readonly query: PaymentPayload) {}
  public toPayload(): PaymentPayload { return { return: { ...this.query } }; }
}

/** WebXPay browser return is untrusted until independently reconciled by AvraAPI. */
export class WebXPayReturnPayload {
  public constructor(private readonly query: PaymentPayload) {}
  public toPayload(): PaymentPayload { return { return: { ...this.query } }; }
}

export interface KokoCallbackPayloadInput {
  readonly orderId: string;
  readonly transactionId: string;
  readonly status: string;
  readonly description: string;
  readonly signature: string;
}

/** Exact KOKO notification fields. */
export class KokoCallbackPayload {
  public readonly orderId: string;
  public readonly transactionId: string;
  public readonly status: string;
  public readonly description: string;
  public readonly signature: string;

  public constructor(input: KokoCallbackPayloadInput) {
    for (const value of [input.orderId, input.transactionId, input.status, input.signature]) {
      if (value.trim() === '') throw new TypeError('KOKO callback order ID, transaction ID, status, and signature are required.');
    }
    this.orderId = input.orderId;
    this.transactionId = input.transactionId;
    this.status = input.status;
    this.description = input.description;
    this.signature = input.signature;
  }

  /** Build the exact callback contract from KOKO's posted form fields. */
  public static fromForm(fields: Readonly<Record<string, unknown>>): KokoCallbackPayload {
    return new KokoCallbackPayload({
      orderId: stringField(fields, 'orderId'),
      transactionId: stringField(fields, 'trnId'),
      status: stringField(fields, 'status'),
      description: stringField(fields, 'desc'),
      signature: stringField(fields, 'signature'),
    });
  }

  public toPayload(): PaymentPayload {
    return { orderId: this.orderId, trnId: this.transactionId, status: this.status, desc: this.description, signature: this.signature };
  }
}

export interface KokoReturnPayloadInput {
  readonly orderId: string;
  readonly transactionId?: string | null;
  readonly status?: string | null;
}

/** KOKO browser return: never use this as payment proof. */
export class KokoReturnPayload {
  public readonly orderId: string;
  public readonly transactionId: string | null;
  public readonly status: string | null;

  public constructor(input: KokoReturnPayloadInput) {
    if (input.orderId.trim() === '') throw new TypeError('A KOKO return order ID is required.');
    this.orderId = input.orderId;
    this.transactionId = normalizeNullable(input.transactionId);
    this.status = normalizeNullable(input.status);
  }

  /** Build the unsigned browser-return contract from KOKO query parameters. */
  public static fromQuery(query: Readonly<Record<string, unknown>>): KokoReturnPayload {
    return new KokoReturnPayload({
      orderId: stringField(query, 'orderId'),
      transactionId: nullableField(query, 'trnId'),
      status: nullableField(query, 'status'),
    });
  }

  public toPayload(): PaymentPayload {
    return compact({ orderId: this.orderId, trnId: this.transactionId, status: this.status });
  }
}

/** Browser-safe availability data returned by PaymentAvailability.toElementsPayload(). */
export interface PaymentElementsAvailability {
  readonly ready: boolean;
  readonly reason: string | null;
  readonly message: string | null;
  readonly methods: readonly PaymentPayload[];
}

export interface PaymentElementsOptions extends PaymentPayload {
  readonly cdnUrl?: string;
  readonly version?: string;
  readonly nonce?: string;
  /**
   * Public availability metadata for Payment Elements. The array form remains
   * accepted for backward compatibility; new integrations should pass the
   * complete PaymentAvailability.toElementsPayload() result.
   */
  readonly availability?: PaymentElementsAvailability | readonly PaymentPayload[];
}

/**
 * Secret-free HTML mount helpers for the independently versioned Payment
 * Elements browser package. Keep checkout creation and completion on the server.
 */
export class PaymentElementsRenderer {
  public static renderForm(mountId: string, options: PaymentElementsOptions = {}): string {
    return this.render('form', mountId, options);
  }

  public static renderMethods(mountId: string, options: PaymentElementsOptions = {}): string {
    return this.render('methods', mountId, options);
  }

  private static render(component: 'form' | 'methods', mountId: string, options: PaymentElementsOptions): string {
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,127}$/.test(mountId)) {
      throw new TypeError('Payment Elements mount ID must start with a letter and contain only letters, numbers, dashes, or underscores.');
    }
    const cdnUrl = this.cdnUrl(String(options.cdnUrl ?? process.env.PAYMENT_ELEMENTS_CDN_URL ?? 'https://cdn.avraapi.com/payment-elements'));
    const version = String(options.version ?? process.env.PAYMENT_ELEMENTS_VERSION ?? '1.1.0').trim();
    if (!/^\d+\.\d+\.\d+$/.test(version)) throw new TypeError('Payment Elements version must be an immutable semantic version.');

    const { cdnUrl: _cdn, version: _version, nonce, availability, ...renderOptions } = options;
    void _cdn; void _version;
    const safeId = escapeHtml(mountId);
    const safeSrc = escapeHtml(this.scriptUrl(cdnUrl, version));
    const nonceAttribute = nonce == null ? '' : ` nonce="${escapeHtml(String(nonce))}"`;
    const optionsJson = safeJson(renderOptions);
    const availabilityBootstrap = component === 'methods' && isAvailabilityPayload(availability)
      ? `<script${nonceAttribute} type="application/json" id="${safeId}--avraapi-payment-availability" data-avraapi-payment-availability-for="${safeId}">${safeJson(availability)}</script>\n`
      : '';

    return `<div id="${safeId}" data-avraapi-elements-mount="${component}" aria-live="polite"><p>AvraAPI Payment Elements is loading. If this message remains, verify the pinned CDN script and Content Security Policy (elements_script_missing).</p></div>\n${availabilityBootstrap}<script${nonceAttribute} src="${safeSrc}" defer onerror="document.getElementById('${safeId}').textContent='AvraAPI Payment Elements could not load (elements_script_missing). Check the versioned CDN script and Content Security Policy.';"></script>\n<script${nonceAttribute}>window.addEventListener('DOMContentLoaded',function(){var target=document.getElementById('${safeId}');if(!window.AvraAPIPaymentElements||!window.AvraAPIPaymentElements.create){target.textContent='AvraAPI Payment Elements is unavailable (elements_script_missing). Include ${safeSrc} before mounting this component.';return;}try{window.AvraAPIPaymentElements.create({"assetBaseUrl":${safeJson(cdnUrl)}}).render${component === 'form' ? 'Form' : 'Methods'}(target,${optionsJson});}catch(error){target.textContent='AvraAPI Payment Elements could not render ('+(error.code||'elements_render_failed')+').';}});</script>`;
  }

  private static cdnUrl(value: string): string {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const isAvraApi = host === 'cdn.avraapi.com' || host === 'gateway.avraapi.com' || host.endsWith('.avraapi.com');
    const localDevelopment = ['dev', 'development'].includes((process.env.APIX_ENV ?? '').trim().toLowerCase())
      && url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(host);
    if ((!isAvraApi || url.protocol !== 'https:') && !localDevelopment) {
      throw new TypeError('Payment Elements CDN URL must be an AvraAPI-owned HTTPS origin. Localhost HTTP is permitted only when APIX_ENV is dev or development.');
    }
    return value.replace(/\/+$/, '');
  }

  private static scriptUrl(cdnUrl: string, version: string): string {
    const localBundle = ['dev', 'development'].includes((process.env.APIX_ENV ?? '').trim().toLowerCase())
      && /^(true|1)$/i.test(process.env.PAYMENT_ELEMENTS_LOCAL_BUNDLE ?? '');
    return localBundle ? `${cdnUrl}/avraapi-payment-elements.umd.js` : `${cdnUrl}/v${version}/avraapi-payment-elements.umd.js`;
  }
}

/** Render an auto-submitting redirect form only for a redirect_form session. */
export class RedirectFormRenderer {
  public static render(session: PaymentSession, submitLabel = 'Continue to payment'): string {
    if (session.mode !== CheckoutMode.Redirect || session.checkout.type !== 'redirect_form') {
      throw new TypeError('A redirect form can only be rendered for a redirect payment session.');
    }
    const action = typeof session.checkout.action_url === 'string' ? session.checkout.action_url : '';
    const fields = isRecord(session.checkout.fields) ? session.checkout.fields : null;
    if (action === '' || fields == null) throw new TypeError('Payment session does not contain a redirect form.');
    const inputs = Object.entries(fields).filter(([, value]) => isScalar(value)).map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(String(value))}">`).join('');
    return `<form method="post" action="${escapeHtml(action)}">${inputs}<button type="submit">${escapeHtml(submitLabel)}</button></form>`;
  }
}

function compact<T extends Record<string, unknown>>(value: T): PaymentPayload {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item != null && item !== ''));
}

function isPositiveAmount(value: string): boolean {
  return /^(0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value) && !/^0+(?:\.0{1,2})?$/.test(value);
}

function isScalar(value: unknown): value is string | number | boolean {
  return ['string', 'number', 'boolean'].includes(typeof value);
}

function nullableScalar(value: unknown): string | null {
  return isScalar(value) ? String(value) : null;
}

function isRecord(value: unknown): value is PaymentPayload {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeNullable(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? '';
  return normalized === '' ? null : normalized;
}

function stringField(fields: Readonly<Record<string, unknown>>, name: string): string {
  const value = fields[name];
  return isScalar(value) ? String(value).trim() : '';
}

function nullableField(fields: Readonly<Record<string, unknown>>, name: string): string | null {
  const value = stringField(fields, name);
  return value === '' ? null : value;
}

function isAvailabilityPayload(value: unknown): value is PaymentElementsAvailability | readonly PaymentPayload[] {
  return Array.isArray(value) || isRecord(value);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[character] ?? character);
}

function safeJson(value: unknown): string {
  // JSON structural quotes must remain literal for the inline script to be
  // executable. Escaping them after JSON.stringify() turns valid object
  // syntax into invalid JavaScript. Escape only characters that can terminate
  // a script element or break legacy JavaScript parsers.
  return JSON.stringify(value)
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
