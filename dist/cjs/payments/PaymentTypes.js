"use strict";
/**
 * Typed, server-only Universal Payment Gateway contracts.
 *
 * These values mirror the public PHP SDK contract. They deliberately model
 * only transport-safe data; project credentials, Vault values, and provider
 * secrets are never part of a payment result.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentResponseValidationError = exports.SensitiveVerificationResult = exports.SensitiveMerchantArtifact = exports.VerificationResult = exports.PaymentCompletionResult = exports.PaymentAvailability = exports.PaymentSession = exports.SensitiveCallbackOptions = exports.VerifyCallbackOptions = exports.PaymentCompletionOptions = exports.PaymentResponseOptions = exports.CreateOrderOptions = exports.PaymentAvailabilityReason = exports.PaymentStatus = exports.CheckoutMode = exports.GatewayEnvironment = exports.GatewayCode = void 0;
var GatewayCode;
(function (GatewayCode) {
    GatewayCode["PayHere"] = "payhere";
    GatewayCode["MarxPay"] = "marxpay";
    GatewayCode["DirectPay"] = "directpay";
    GatewayCode["PayPlus"] = "payplus";
    GatewayCode["WebXPay"] = "webxpay";
    GatewayCode["Koko"] = "koko";
    GatewayCode["OnePay"] = "onepay";
    GatewayCode["Stripe"] = "stripe";
})(GatewayCode || (exports.GatewayCode = GatewayCode = {}));
var GatewayEnvironment;
(function (GatewayEnvironment) {
    GatewayEnvironment["Sandbox"] = "sandbox";
    GatewayEnvironment["Production"] = "production";
})(GatewayEnvironment || (exports.GatewayEnvironment = GatewayEnvironment = {}));
var CheckoutMode;
(function (CheckoutMode) {
    CheckoutMode["Redirect"] = "redirect";
    CheckoutMode["Overlay"] = "overlay";
    /** @deprecated New requests use `CheckoutMode.Redirect`. */
    CheckoutMode["HostedSession"] = "hosted_session";
    CheckoutMode["Embedded"] = "embedded";
})(CheckoutMode || (exports.CheckoutMode = CheckoutMode = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["Succeeded"] = "succeeded";
    PaymentStatus["Pending"] = "pending";
    PaymentStatus["Failed"] = "failed";
    PaymentStatus["Cancelled"] = "cancelled";
    PaymentStatus["Unknown"] = "unknown";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentAvailabilityReason;
(function (PaymentAvailabilityReason) {
    PaymentAvailabilityReason["UpgEntitlementInactive"] = "upg_entitlement_inactive";
    PaymentAvailabilityReason["UpgGatewayNotEntitled"] = "upg_gateway_not_entitled";
    PaymentAvailabilityReason["PaymentConfigurationNotAvailable"] = "payment_configuration_not_available";
    PaymentAvailabilityReason["ProjectPaused"] = "project_paused";
    PaymentAvailabilityReason["Unknown"] = "unknown";
})(PaymentAvailabilityReason || (exports.PaymentAvailabilityReason = PaymentAvailabilityReason = {}));
/**
 * Creates the server-side order payload used to prepare a payment session.
 *
 * A browser must receive only the safe `checkout` material from the returned
 * session. Keep the returned `completionContext` with the merchant order.
 */
class CreateOrderOptions {
    gateway;
    mode;
    orderId;
    items;
    amount;
    currency;
    customer;
    urls;
    merchantDomain;
    providerOptions;
    /** Explicit per-order override; the process configuration is resolved when serializing. */
    gatewayEnvironment;
    constructor(input) {
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
    toPayload() {
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
    static normalizeCustomer(customer) {
        const address = (customer.address ?? '').trim() || [
            (customer.address_line_1 ?? '').trim(),
            (customer.address_line_2 ?? '').trim(),
        ].filter((part) => part !== '').join(', ');
        return { ...customer, address };
    }
}
exports.CreateOrderOptions = CreateOrderOptions;
/** Chooses the vaulted gateway profile; this is separate from `APIX_ENV`. */
(function (GatewayEnvironment) {
    function configuredFor(gateway, explicit = undefined) {
        if (explicit != null)
            return explicit;
        const override = configuredOverride(gateway);
        return override ?? normalize(process.env.APIX_PAYMENT_GATEWAY_ENV);
    }
    GatewayEnvironment.configuredFor = configuredFor;
    function configuredOverride(gateway) {
        const configured = process.env.APIX_PAYMENT_GATEWAY_ENV_OVERRIDES;
        if (configured == null || configured.trim() === '')
            return null;
        let selected = null;
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
            if (rawGateway.trim().toLowerCase() !== gateway)
                continue;
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
    function normalize(value) {
        switch (value?.trim().toLowerCase()) {
            case GatewayEnvironment.Sandbox:
                return GatewayEnvironment.Sandbox;
            case GatewayEnvironment.Production:
                return GatewayEnvironment.Production;
            default:
                return null;
        }
    }
})(GatewayEnvironment || (exports.GatewayEnvironment = GatewayEnvironment = {}));
/** Controls the merchant-server response shape for payment completion. */
class PaymentResponseOptions {
    mode;
    include;
    constructor(input = {}) {
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
    static short() {
        return new PaymentResponseOptions({ mode: 'short' });
    }
    static full() {
        return new PaymentResponseOptions({ mode: 'full' });
    }
    static include(paths) {
        return new PaymentResponseOptions({ mode: 'include', include: paths });
    }
    toPayload() {
        return this.mode === 'include'
            ? { mode: this.mode, include: [...this.include] }
            : { mode: this.mode };
    }
}
exports.PaymentResponseOptions = PaymentResponseOptions;
/** Server-only gateway callback/return completion request. */
class PaymentCompletionOptions {
    gateway;
    completionContext;
    payload;
    response;
    reconcileProvider;
    constructor(input) {
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
    toPayload() {
        return {
            gateway: this.gateway,
            completion_context: this.completionContext,
            payload: { ...this.payload },
            response: this.response.toPayload(),
            reconcile_provider: this.reconcileProvider,
        };
    }
}
exports.PaymentCompletionOptions = PaymentCompletionOptions;
/** Server-side verification for an ordinary checkout or recurring callback. */
class VerifyCallbackOptions {
    gateway;
    payload;
    orderId;
    amount;
    currency;
    flow;
    startupFee;
    constructor(input) {
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
    toPayload() {
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
exports.VerifyCallbackOptions = VerifyCallbackOptions;
/** Callback verification whose returned artifact must remain on the server. */
class SensitiveCallbackOptions {
    flow;
    payload;
    orderId;
    amount;
    currency;
    constructor(input) {
        if (input.flow !== 'preapproval' && input.flow !== 'authorization') {
            throw new TypeError('Sensitive callback flow must be preapproval or authorization.');
        }
        this.flow = input.flow;
        this.payload = { ...input.payload };
        this.orderId = input.orderId;
        this.amount = input.amount;
        this.currency = input.currency;
    }
    toPayload() {
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
exports.SensitiveCallbackOptions = SensitiveCallbackOptions;
/** The prepared server-side checkout session. */
class PaymentSession {
    gateway;
    mode;
    status;
    expiresAt;
    checkout;
    requestId;
    flow;
    binding;
    verification;
    /** Never send this signed value to a browser. Persist it with the pending order. */
    completionContext;
    constructor(data) {
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
    static fromData(data, requestId) {
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
exports.PaymentSession = PaymentSession;
/** Public, browser-safe availability preflight result for Payment Elements. */
class PaymentAvailability {
    ready;
    reason;
    message;
    methods;
    requestId;
    constructor(data) {
        this.ready = data.ready;
        this.reason = data.reason;
        this.message = data.message;
        this.methods = data.methods;
        this.requestId = data.requestId;
    }
    static fromData(data, requestId = null) {
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
    isReady() {
        return this.ready;
    }
    toElementsPayload() {
        return {
            ready: this.ready,
            reason: this.reason,
            message: this.message,
            methods: this.methods.map((method) => ({ ...method })),
        };
    }
    static methodFromData(data) {
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
exports.PaymentAvailability = PaymentAvailability;
/** One normalized result regardless of the gateway's native completion flow. */
class PaymentCompletionResult {
    gateway;
    verified;
    paymentStatus;
    providerStatus;
    orderId;
    gatewayReference;
    amount;
    currency;
    requestId;
    nativeOperations;
    include;
    reconciliation;
    constructor(data) {
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
    static fromData(data, requestId) {
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
exports.PaymentCompletionResult = PaymentCompletionResult;
class VerificationResult {
    verified;
    paymentStatus;
    providerStatus;
    orderId;
    gatewayReference;
    amount;
    currency;
    requestId;
    flow;
    subscription;
    constructor(data) {
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
    static fromData(data, requestId) {
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
exports.VerificationResult = VerificationResult;
/** Sensitive token returned only by PayHere server-side verification. */
class SensitiveMerchantArtifact {
    kind;
    #value;
    constructor(kind, value) {
        this.kind = kind;
        this.#value = value;
    }
    /** Persist this only in the merchant's secure vault, or delete it. */
    get value() {
        return this.#value;
    }
    /** Prevent accidental JSON serialization into logs, caches, or responses. */
    toJSON() {
        throw new TypeError('Sensitive merchant artifacts must not be serialized.');
    }
}
exports.SensitiveMerchantArtifact = SensitiveMerchantArtifact;
class SensitiveVerificationResult {
    verification;
    artifact;
    constructor(verification, artifact) {
        this.verification = verification;
        this.artifact = artifact;
    }
    static fromData(data, requestId) {
        const artifact = isRecord(data.artifact) ? data.artifact : {};
        const kind = scalarString(artifact.kind);
        const value = scalarString(artifact.value);
        if (kind == null || value == null || value === '') {
            throw new PaymentResponseValidationError('AvraAPI returned no sensitive PayHere artifact.');
        }
        return new SensitiveVerificationResult(VerificationResult.fromData(data, requestId), new SensitiveMerchantArtifact(kind, value));
    }
}
exports.SensitiveVerificationResult = SensitiveVerificationResult;
/** An invalid payment success payload is a protocol failure, not proof of payment. */
class PaymentResponseValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'PaymentResponseValidationError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.PaymentResponseValidationError = PaymentResponseValidationError;
function isRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
function scalarString(value) {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
        ? String(value)
        : null;
}
function enumValue(values, value) {
    if (typeof value !== 'string')
        return null;
    return Object.values(values).includes(value) ? value : null;
}
function assertEnumValue(values, value, label) {
    if (enumValue(values, value) == null) {
        throw new TypeError(`${label} is not supported.`);
    }
}
function recordOfNullableStrings(value) {
    if (!isRecord(value))
        return null;
    const result = {};
    for (const [key, entry] of Object.entries(value)) {
        result[key] = scalarString(entry);
    }
    return result;
}
//# sourceMappingURL=PaymentTypes.js.map