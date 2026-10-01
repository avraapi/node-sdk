/**
 * Typed, server-only Universal Payment Gateway contracts.
 *
 * These values mirror the public PHP SDK contract. They deliberately model
 * only transport-safe data; project credentials, Vault values, and provider
 * secrets are never part of a payment result.
 */

export enum GatewayCode {
  PayHere = 'payhere',
  MarxPay = 'marxpay',
  DirectPay = 'directpay',
  PayPlus = 'payplus',
  WebXPay = 'webxpay',
  Koko = 'koko',
  OnePay = 'onepay',
  Stripe = 'stripe',
}

export enum GatewayEnvironment {
  Sandbox = 'sandbox',
  Production = 'production',
}

export enum CheckoutMode {
  Redirect = 'redirect',
  Overlay = 'overlay',
  /** @deprecated New requests use `CheckoutMode.Redirect`. */
  HostedSession = 'hosted_session',
  Embedded = 'embedded',
}

export enum PaymentStatus {
  Succeeded = 'succeeded',
  Pending = 'pending',
  Failed = 'failed',
  Cancelled = 'cancelled',
  Unknown = 'unknown',
}

export enum PaymentAvailabilityReason {
  UpgEntitlementInactive = 'upg_entitlement_inactive',
  UpgGatewayNotEntitled = 'upg_gateway_not_entitled',
  PaymentConfigurationNotAvailable = 'payment_configuration_not_available',
  ProjectPaused = 'project_paused',
  Unknown = 'unknown',
}

export type PaymentScalar = string | number | boolean | null;
export type PaymentPayload = Record<string, unknown>;
export type PaymentCallbackPayload = Record<string, PaymentScalar>;
export type PaymentCustomer = Record<string, string>;
export type PaymentUrls = Record<string, string>;
export type PaymentProviderOptions = Record<string, unknown>;
/** Raw public method metadata returned by `payment().methods()`. */
export type PaymentMethod = PaymentPayload;
export type PaymentResponseMode = 'short' | 'include' | 'full';

export interface CreateOrderOptionsInput {
  readonly gateway: GatewayCode;
  readonly mode: CheckoutMode;
  readonly orderId: string;
  readonly items: string;
  /** A positive decimal string with no more than two fraction digits. */
  readonly amount: string;
  readonly currency: string;
  readonly customer: PaymentCustomer;
  readonly urls: PaymentUrls;
  readonly merchantDomain?: string | null;
  readonly providerOptions?: PaymentProviderOptions;
  /** Chooses the vaulted gateway profile independently of `APIX_ENV`. */
  readonly gatewayEnvironment?: GatewayEnvironment | null;
}

/**
 * Creates the server-side order payload used to prepare a payment session.
 *
 * A browser must receive only the safe `checkout` material from the returned
 * session. Keep the returned `completionContext` with the merchant order.
 */
export class CreateOrderOptions {
  public readonly gateway: GatewayCode;
  public readonly mode: CheckoutMode;
  public readonly orderId: string;
  public readonly items: string;
  public readonly amount: string;
  public readonly currency: string;
  public readonly customer: PaymentCustomer;
  public readonly urls: PaymentUrls;
  public readonly merchantDomain: string | null;
  public readonly providerOptions: PaymentProviderOptions;
  /** Explicit per-order override; the process configuration is resolved when serializing. */
  public readonly gatewayEnvironment: GatewayEnvironment | null;

  public constructor(input: CreateOrderOptionsInput) {
    assertEnumValue(GatewayCode, input.gateway, 'Payment gateway');
    assertEnumValue(CheckoutMode, input.mode, 'Payment checkout mode');
    if (input.gatewayEnvironment != null) {
      assertEnumValue(GatewayEnvironment, input.gatewayEnvironment, 'Payment gateway environment');
    }
    if (input.orderId.trim() === '' || input.items.trim() === '' || input.currency.trim() === '') {
      throw new TypeError('Payment order ID, items, and currency are required.');
    }
    if (!/^(0|[1-9]\d*)(?:\.\d{1,2})?$/.test(input.amount) || /^0+(?:\.0{1,2})?$/.test(input.amount)) {
      throw new TypeError('Payment amount must be a positive decimal string with at most two decimals.');
    }

    const customer = CreateOrderOptions.normalizeCustomer(input.customer);
    for (const field of ['first_name', 'last_name', 'email', 'phone', 'address', 'city', 'country']) {
      if ((customer[field] ?? '').trim() === '') {
        throw new TypeError(`Payment customer ${field} is required.`);
      }
    }

    this.gateway = input.gateway;
    this.mode = input.mode;
    this.orderId = input.orderId;
    this.items = input.items;
    this.amount = input.amount;
    this.currency = input.currency;
    this.customer = customer;
    this.urls = { ...input.urls };
    this.merchantDomain = input.merchantDomain ?? null;
    this.providerOptions = { ...(input.providerOptions ?? {}) };
    // Mirror the PHP SDK: environment variables are evaluated at dispatch
    // time, so a long-lived options object cannot capture a stale profile.
    this.gatewayEnvironment = input.gatewayEnvironment ?? null;
  }

  public toPayload(): PaymentPayload {
    const gatewayEnvironment = GatewayEnvironment.configuredFor(this.gateway, this.gatewayEnvironment);

    return {
      gateway: this.gateway,
      // hosted_session remains accepted for source compatibility, but every
      // newly emitted public request uses the universal redirect mode.
      mode: this.mode === CheckoutMode.HostedSession ? CheckoutMode.Redirect : this.mode,
      ...(gatewayEnvironment == null ? {} : { gateway_environment: gatewayEnvironment }),
      order: {
        id: this.orderId,
        items: this.items,
        amount: this.amount,
        currency: this.currency.toUpperCase(),
      },
      customer: { ...this.customer },
      urls: { ...this.urls },
      merchant_domain: this.merchantDomain,
      provider_options: { ...this.providerOptions },
    };
  }

  private static normalizeCustomer(customer: PaymentCustomer): PaymentCustomer {
    const address = (customer.address ?? '').trim() || [
      (customer.address_line_1 ?? '').trim(),
      (customer.address_line_2 ?? '').trim(),
    ].filter((part) => part !== '').join(', ');

    return { ...customer, address };
  }
}

/** Chooses the vaulted gateway profile; this is separate from `APIX_ENV`. */
export namespace GatewayEnvironment {
  export function configuredFor(
    gateway: GatewayCode,
    explicit: GatewayEnvironment | null | undefined = undefined,
  ): GatewayEnvironment | null {
    if (explicit != null) return explicit;

    const override = configuredOverride(gateway);
    return override ?? normalize(process.env.APIX_PAYMENT_GATEWAY_ENV);
  }

  function configuredOverride(gateway: GatewayCode): GatewayEnvironment | null {
    const configured = process.env.APIX_PAYMENT_GATEWAY_ENV_OVERRIDES;
    if (configured == null || configured.trim() === '') return null;

    let selected: GatewayEnvironment | null = null;
    for (const definition of configured.split(',')) {
      const separator = definition.trim().indexOf(':');
      if (separator < 0) {
        throw new TypeError('APIX_PAYMENT_GATEWAY_ENV_OVERRIDES must use gateway:sandbox or gateway:production entries.');
      }
      const rawGateway = definition.trim().slice(0, separator);
      const rawEnvironment = definition.trim().slice(separator + 1);
      if (rawGateway.trim() === '' || rawEnvironment.trim() === '') {
        throw new TypeError('APIX_PAYMENT_GATEWAY_ENV_OVERRIDES must use gateway:sandbox or gateway:production entries.');
      }
      if (rawGateway.trim().toLowerCase() !== gateway) continue;
      if (selected != null) {
        throw new TypeError(`APIX_PAYMENT_GATEWAY_ENV_OVERRIDES contains more than one entry for ${gateway}.`);
      }

      selected = normalize(rawEnvironment);
      if (selected == null) {
        throw new TypeError(`APIX_PAYMENT_GATEWAY_ENV_OVERRIDES has an invalid environment for ${gateway}.`);
      }
    }

    return selected;
  }

  function normalize(value: string | undefined): GatewayEnvironment | null {
    switch (value?.trim().toLowerCase()) {
      case GatewayEnvironment.Sandbox:
        return GatewayEnvironment.Sandbox;
      case GatewayEnvironment.Production:
        return GatewayEnvironment.Production;
      default:
        return null;
    }
  }
}

export interface PaymentResponseOptionsInput {
  readonly mode?: PaymentResponseMode;
  readonly include?: readonly string[];
}

/** Controls the merchant-server response shape for payment completion. */
export class PaymentResponseOptions {
  public readonly mode: PaymentResponseMode;
  public readonly include: readonly string[];

  public constructor(input: PaymentResponseOptionsInput = {}) {
    this.mode = input.mode ?? 'short';
    this.include = [...(input.include ?? [])];

    if (!['short', 'include', 'full'].includes(this.mode)) {
      throw new TypeError('Payment response mode must be short, include, or full.');
    }
    if (this.mode !== 'include' && this.include.length > 0) {
      throw new TypeError('Include paths are valid only with include response mode.');
    }
    if (this.include.some((path) => typeof path !== 'string' || path.trim() === '')) {
      throw new TypeError('Payment response include paths must be non-empty strings.');
    }
  }

  public static short(): PaymentResponseOptions {
    return new PaymentResponseOptions({ mode: 'short' });
  }

  public static full(): PaymentResponseOptions {
    return new PaymentResponseOptions({ mode: 'full' });
  }

  public static include(paths: readonly string[]): PaymentResponseOptions {
    return new PaymentResponseOptions({ mode: 'include', include: paths });
  }

  public toPayload(): PaymentPayload {
    return this.mode === 'include'
      ? { mode: this.mode, include: [...this.include] }
      : { mode: this.mode };
  }
}

export interface PaymentCompletionOptionsInput {
  readonly gateway: GatewayCode;
  /** Signed, server-held context returned from `createOrder()`. */
  readonly completionContext: string;
  readonly payload: PaymentPayload;
  readonly response?: PaymentResponseOptions;
  readonly reconcileProvider?: boolean;
}

/** Server-only gateway callback/return completion request. */
export class PaymentCompletionOptions {
  public readonly gateway: GatewayCode;
  public readonly completionContext: string;
  public readonly payload: PaymentPayload;
  public readonly response: PaymentResponseOptions;
  public readonly reconcileProvider: boolean;

  public constructor(input: PaymentCompletionOptionsInput) {
    assertEnumValue(GatewayCode, input.gateway, 'Payment gateway');
    if (input.completionContext.trim() === '') {
      throw new TypeError('A signed payment completion context is required.');
    }
    if (input.reconcileProvider != null && typeof input.reconcileProvider !== 'boolean') {
      throw new TypeError('Payment reconcileProvider must be a boolean.');
    }

    this.gateway = input.gateway;
    this.completionContext = input.completionContext;
    this.payload = { ...input.payload };
    this.response = input.response ?? PaymentResponseOptions.short();
    this.reconcileProvider = input.reconcileProvider ?? true;
  }

  public toPayload(): PaymentPayload {
    return {
      gateway: this.gateway,
      completion_context: this.completionContext,
      payload: { ...this.payload },
      response: this.response.toPayload(),
      reconcile_provider: this.reconcileProvider,
    };
  }
}

export interface VerifyCallbackOptionsInput {
  readonly gateway: GatewayCode;
  readonly payload: PaymentCallbackPayload;
  readonly orderId: string;
  readonly amount: string;
  readonly currency: string;
  readonly flow?: 'checkout' | 'recurring';
  readonly startupFee?: string | null;
}

/** Server-side verification for an ordinary checkout or recurring callback. */
export class VerifyCallbackOptions {
  public readonly gateway: GatewayCode;
  public readonly payload: PaymentCallbackPayload;
  public readonly orderId: string;
  public readonly amount: string;
  public readonly currency: string;
  public readonly flow: 'checkout' | 'recurring';
  public readonly startupFee: string | null;

  public constructor(input: VerifyCallbackOptionsInput) {
    assertEnumValue(GatewayCode, input.gateway, 'Payment gateway');
    if (input.orderId === '' || input.amount === '' || input.currency === '') {
      throw new TypeError('Expected order ID, amount, and currency are required.');
    }
    if (input.flow != null && input.flow !== 'checkout' && input.flow !== 'recurring') {
      throw new TypeError('Payment callback flow must be checkout or recurring.');
    }

    this.gateway = input.gateway;
    this.payload = { ...input.payload };
    this.orderId = input.orderId;
    this.amount = input.amount;
    this.currency = input.currency;
    this.flow = input.flow ?? 'checkout';
    this.startupFee = input.startupFee ?? null;
  }

  public toPayload(): PaymentPayload {
    return {
      gateway: this.gateway,
      flow: this.flow,
      payload: { ...this.payload },
      expected: {
        order_id: this.orderId,
        amount: this.amount,
        currency: this.currency.toUpperCase(),
        ...(this.startupFee == null ? {} : { startup_fee: this.startupFee }),
      },
    };
  }
}

export interface SensitiveCallbackOptionsInput {
  readonly flow: 'preapproval' | 'authorization';
  readonly payload: PaymentCallbackPayload;
  readonly orderId: string;
  readonly amount: string;
  readonly currency: string;
}

/** Callback verification whose returned artifact must remain on the server. */
export class SensitiveCallbackOptions {
  public readonly flow: 'preapproval' | 'authorization';
  public readonly payload: PaymentCallbackPayload;
  public readonly orderId: string;
  public readonly amount: string;
  public readonly currency: string;

  public constructor(input: SensitiveCallbackOptionsInput) {
    if (input.flow !== 'preapproval' && input.flow !== 'authorization') {
      throw new TypeError('Sensitive callback flow must be preapproval or authorization.');
    }

    this.flow = input.flow;
    this.payload = { ...input.payload };
    this.orderId = input.orderId;
    this.amount = input.amount;
    this.currency = input.currency;
  }

  public toPayload(): PaymentPayload {
    return {
      gateway: GatewayCode.PayHere,
      flow: this.flow,
      payload: { ...this.payload },
      expected: {
        order_id: this.orderId,
        amount: this.amount,
        currency: this.currency.toUpperCase(),
      },
    };
  }
}

export interface PaymentSessionData {
  readonly gateway: string;
  readonly mode: string;
  readonly status?: string;
  readonly expires_at?: unknown;
  readonly checkout: PaymentPayload;
  readonly flow?: unknown;
  readonly binding?: unknown;
  readonly verification?: unknown;
  readonly completion_context?: unknown;
}

/** The prepared server-side checkout session. */
export class PaymentSession {
  public readonly gateway: GatewayCode;
  public readonly mode: CheckoutMode;
  public readonly status: string;
  public readonly expiresAt: string | null;
  public readonly checkout: PaymentPayload;
  public readonly requestId: string;
  public readonly flow: string;
  public readonly binding: PaymentPayload;
  public readonly verification: PaymentPayload;
  /** Never send this signed value to a browser. Persist it with the pending order. */
  public readonly completionContext: string | null;

  private constructor(data: {
    gateway: GatewayCode;
    mode: CheckoutMode;
    status: string;
    expiresAt: string | null;
    checkout: PaymentPayload;
    requestId: string;
    flow: string;
    binding: PaymentPayload;
    verification: PaymentPayload;
    completionContext: string | null;
  }) {
    this.gateway = data.gateway;
    this.mode = data.mode;
    this.status = data.status;
    this.expiresAt = data.expiresAt;
    this.checkout = data.checkout;
    this.requestId = data.requestId;
    this.flow = data.flow;
    this.binding = data.binding;
    this.verification = data.verification;
    this.completionContext = data.completionContext;
  }

  public static fromData(data: PaymentSessionData, requestId: string): PaymentSession {
    const gateway = enumValue(GatewayCode, data.gateway);
    const mode = enumValue(CheckoutMode, data.mode);
    if (gateway == null || mode == null || !isRecord(data.checkout)) {
      throw new PaymentResponseValidationError('AvraAPI returned an invalid payment session.');
    }

    return new PaymentSession({
      gateway,
      mode,
      status: typeof data.status === 'string' ? data.status : 'prepared',
      expiresAt: scalarString(data.expires_at),
      checkout: { ...data.checkout },
      requestId,
      flow: typeof data.flow === 'string' ? data.flow : 'checkout',
      binding: isRecord(data.binding) ? { ...data.binding } : {},
      verification: isRecord(data.verification) ? { ...data.verification } : {},
      completionContext: scalarString(data.completion_context),
    });
  }
}

export type PaymentMethodAvailability = PaymentPayload & {
  readonly gateway: string;
  readonly available: boolean;
};

/** Public, browser-safe availability preflight result for Payment Elements. */
export class PaymentAvailability {
  public readonly ready: boolean;
  public readonly reason: PaymentAvailabilityReason | null;
  public readonly message: string | null;
  public readonly methods: readonly PaymentMethodAvailability[];
  public readonly requestId: string | null;

  private constructor(data: {
    ready: boolean;
    reason: PaymentAvailabilityReason | null;
    message: string | null;
    methods: readonly PaymentMethodAvailability[];
    requestId: string | null;
  }) {
    this.ready = data.ready;
    this.reason = data.reason;
    this.message = data.message;
    this.methods = data.methods;
    this.requestId = data.requestId;
  }

  public static fromData(data: PaymentPayload, requestId: string | null = null): PaymentAvailability {
    const methods = Array.isArray(data.methods)
      ? data.methods.filter(isRecord).map(PaymentAvailability.methodFromData)
      : [];
    const reason = typeof data.reason === 'string'
      ? enumValue(PaymentAvailabilityReason, data.reason) ?? PaymentAvailabilityReason.Unknown
      : null;
    const message = scalarString(data.message)?.trim() || null;

    return new PaymentAvailability({
      ready: data.ready === true,
      reason,
      message,
      methods,
      requestId,
    });
  }

  public isReady(): boolean {
    return this.ready;
  }

  public toElementsPayload(): {
    ready: boolean;
    reason: string | null;
    message: string | null;
    methods: PaymentMethodAvailability[];
  } {
    return {
      ready: this.ready,
      reason: this.reason,
      message: this.message,
      methods: this.methods.map((method) => ({ ...method })),
    };
  }

  private static methodFromData(data: PaymentPayload): PaymentMethodAvailability {
    const gateway = scalarString(data.gateway)?.trim() ?? '';
    if (gateway === '') {
      throw new PaymentResponseValidationError('Payment availability method is missing its gateway code.');
    }

    return {
      ...data,
      gateway,
      available: data.available !== false,
    };
  }
}

export interface PaymentCompletionResultData {
  readonly gateway: string;
  readonly verified?: unknown;
  readonly payment_status: string;
  readonly provider_status?: unknown;
  readonly order_id?: unknown;
  readonly gateway_reference?: unknown;
  readonly amount?: unknown;
  readonly currency?: unknown;
  readonly native_operations?: unknown;
  readonly include?: unknown;
  readonly reconciliation?: unknown;
}

/** One normalized result regardless of the gateway's native completion flow. */
export class PaymentCompletionResult {
  public readonly gateway: GatewayCode;
  public readonly verified: boolean;
  public readonly paymentStatus: PaymentStatus;
  public readonly providerStatus: string;
  public readonly orderId: string | null;
  public readonly gatewayReference: string | null;
  public readonly amount: string | null;
  public readonly currency: string | null;
  public readonly requestId: string;
  public readonly nativeOperations: PaymentPayload;
  public readonly include: PaymentPayload;
  public readonly reconciliation: PaymentPayload;

  private constructor(data: PaymentCompletionResult) {
    this.gateway = data.gateway;
    this.verified = data.verified;
    this.paymentStatus = data.paymentStatus;
    this.providerStatus = data.providerStatus;
    this.orderId = data.orderId;
    this.gatewayReference = data.gatewayReference;
    this.amount = data.amount;
    this.currency = data.currency;
    this.requestId = data.requestId;
    this.nativeOperations = data.nativeOperations;
    this.include = data.include;
    this.reconciliation = data.reconciliation;
  }

  public static fromData(data: PaymentCompletionResultData, requestId: string): PaymentCompletionResult {
    const gateway = enumValue(GatewayCode, data.gateway);
    const paymentStatus = enumValue(PaymentStatus, data.payment_status);
    if (gateway == null || paymentStatus == null || data.provider_status == null) {
      throw new PaymentResponseValidationError('AvraAPI returned an invalid payment completion result.');
    }

    return new PaymentCompletionResult({
      gateway,
      verified: data.verified === true,
      paymentStatus,
      providerStatus: String(data.provider_status),
      orderId: scalarString(data.order_id),
      gatewayReference: scalarString(data.gateway_reference),
      amount: scalarString(data.amount),
      currency: scalarString(data.currency),
      requestId,
      nativeOperations: isRecord(data.native_operations) ? { ...data.native_operations } : {},
      include: isRecord(data.include) ? { ...data.include } : {},
      reconciliation: isRecord(data.reconciliation) ? { ...data.reconciliation } : {},
    });
  }
}

export interface VerificationResultData {
  readonly verified?: unknown;
  readonly payment_status: string;
  readonly provider_status?: unknown;
  readonly order_id?: unknown;
  readonly gateway_reference?: unknown;
  readonly amount?: unknown;
  readonly currency?: unknown;
  readonly flow?: unknown;
  readonly subscription?: unknown;
}

export class VerificationResult {
  public readonly verified: boolean;
  public readonly paymentStatus: PaymentStatus;
  public readonly providerStatus: string;
  public readonly orderId: string;
  public readonly gatewayReference: string | null;
  public readonly amount: string;
  public readonly currency: string;
  public readonly requestId: string;
  public readonly flow: string;
  public readonly subscription: Record<string, string | null> | null;

  private constructor(data: VerificationResult) {
    this.verified = data.verified;
    this.paymentStatus = data.paymentStatus;
    this.providerStatus = data.providerStatus;
    this.orderId = data.orderId;
    this.gatewayReference = data.gatewayReference;
    this.amount = data.amount;
    this.currency = data.currency;
    this.requestId = data.requestId;
    this.flow = data.flow;
    this.subscription = data.subscription;
  }

  public static fromData(data: VerificationResultData, requestId: string): VerificationResult {
    const paymentStatus = enumValue(PaymentStatus, data.payment_status);
    if (paymentStatus == null || data.order_id == null || data.amount == null || data.currency == null) {
      throw new PaymentResponseValidationError('AvraAPI returned an invalid payment verification result.');
    }

    return new VerificationResult({
      verified: data.verified === true,
      paymentStatus,
      providerStatus: scalarString(data.provider_status) ?? '',
      orderId: String(data.order_id),
      gatewayReference: scalarString(data.gateway_reference),
      amount: String(data.amount),
      currency: String(data.currency),
      requestId,
      flow: typeof data.flow === 'string' ? data.flow : 'checkout',
      subscription: recordOfNullableStrings(data.subscription),
    });
  }
}

/** Sensitive token returned only by PayHere server-side verification. */
export class SensitiveMerchantArtifact {
  public readonly kind: string;
  #value: string;

  public constructor(kind: string, value: string) {
    this.kind = kind;
    this.#value = value;
  }

  /** Persist this only in the merchant's secure vault, or delete it. */
  public get value(): string {
    return this.#value;
  }

  /** Prevent accidental JSON serialization into logs, caches, or responses. */
  public toJSON(): never {
    throw new TypeError('Sensitive merchant artifacts must not be serialized.');
  }
}

export class SensitiveVerificationResult {
  public readonly verification: VerificationResult;
  public readonly artifact: SensitiveMerchantArtifact;

  private constructor(verification: VerificationResult, artifact: SensitiveMerchantArtifact) {
    this.verification = verification;
    this.artifact = artifact;
  }

  public static fromData(data: PaymentPayload, requestId: string): SensitiveVerificationResult {
    const artifact = isRecord(data.artifact) ? data.artifact : {};
    const kind = scalarString(artifact.kind);
    const value = scalarString(artifact.value);
    if (kind == null || value == null || value === '') {
      throw new PaymentResponseValidationError('AvraAPI returned no sensitive PayHere artifact.');
    }

    return new SensitiveVerificationResult(
      VerificationResult.fromData(data as unknown as VerificationResultData, requestId),
      new SensitiveMerchantArtifact(kind, value),
    );
  }
}

/** An invalid payment success payload is a protocol failure, not proof of payment. */
export class PaymentResponseValidationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'PaymentResponseValidationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function isRecord(value: unknown): value is PaymentPayload {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function scalarString(value: unknown): string | null {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? String(value)
    : null;
}

function enumValue<T extends Record<string, unknown>>(values: T, value: unknown): Extract<T[keyof T], string> | null {
  if (typeof value !== 'string') return null;
  return Object.values(values).includes(value) ? value as Extract<T[keyof T], string> : null;
}

function assertEnumValue<T extends Record<string, unknown>>(values: T, value: unknown, label: string): asserts value is Extract<T[keyof T], string> {
  if (enumValue(values, value) == null) {
    throw new TypeError(`${label} is not supported.`);
  }
}

function recordOfNullableStrings(value: unknown): Record<string, string | null> | null {
  if (!isRecord(value)) return null;

  const result: Record<string, string | null> = {};
  for (const [key, entry] of Object.entries(value)) {
    result[key] = scalarString(entry);
  }
  return result;
}
