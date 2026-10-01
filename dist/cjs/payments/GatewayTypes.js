"use strict";
/**
 * Gateway-specific, server-only contracts for the Universal Payment Gateway.
 *
 * These classes intentionally mirror the PHP SDK's public payment contracts.
 * They contain no merchant credentials and must only be instantiated in
 * trusted backend code.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedirectFormRenderer = exports.PaymentElementsRenderer = exports.KokoReturnPayload = exports.KokoCallbackPayload = exports.WebXPayReturnPayload = exports.OnePayReturnPayload = exports.OnePayCallbackPayload = exports.StripeWebhookPayload = exports.StripeReturnPayload = exports.DirectPayCallbackPayload = exports.PayPlusCallbackPayload = exports.PayPlusStatus = exports.KokoOrderView = exports.SubscriptionCommandResult = exports.SubscriptionSummary = exports.MarxPayReturnVerification = exports.MarxPayPaymentResult = exports.MarxPayReturnVerificationOptions = exports.MarxPayInitiatePaymentOptions = exports.RecurringOrderOptions = exports.PreapprovalOptions = exports.AuthorizationOptions = void 0;
const PaymentTypes_js_1 = require("./PaymentTypes.js");
/** Server-only PayHere authorization hold request. */
class AuthorizationOptions {
    order;
    constructor(order) {
        this.order = order instanceof PaymentTypes_js_1.CreateOrderOptions ? order : new PaymentTypes_js_1.CreateOrderOptions(order);
        if (this.order.gateway !== PaymentTypes_js_1.GatewayCode.PayHere || this.order.mode !== PaymentTypes_js_1.CheckoutMode.Redirect) {
            throw new TypeError('PayHere authorization requires a PayHere redirect order.');
        }
    }
    toPayload() {
        return this.order.toPayload();
    }
}
exports.AuthorizationOptions = AuthorizationOptions;
/** Server-only PayHere preapproval request. */
class PreapprovalOptions {
    orderId;
    items;
    currency;
    customer;
    urls;
    amount;
    merchantDomain;
    constructor(input) {
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
    toPayload() {
        return {
            gateway: PaymentTypes_js_1.GatewayCode.PayHere,
            mode: PaymentTypes_js_1.CheckoutMode.Redirect,
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
    callbackAmount() {
        return this.amount ?? (this.currency === 'LKR' ? '10.00' : '0.51');
    }
}
exports.PreapprovalOptions = PreapprovalOptions;
/** Server-only recurring payment request. */
class RecurringOrderOptions {
    order;
    recurrence;
    duration;
    startupFee;
    recurringStartDate;
    autoCancel;
    maxRetries;
    isRecoveryDue;
    constructor(input) {
        this.order = new PaymentTypes_js_1.CreateOrderOptions(input);
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
    toPayload() {
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
exports.RecurringOrderOptions = RecurringOrderOptions;
class MarxPayInitiatePaymentOptions {
    trId;
    merchantRid;
    gatewayEnvironment;
    constructor(input) {
        if (input.trId.trim() === '' || input.merchantRid.trim() === '') {
            throw new TypeError('A MarxPay trId and merchantRID are required.');
        }
        this.trId = input.trId;
        this.merchantRid = input.merchantRid;
        this.gatewayEnvironment = input.gatewayEnvironment ?? null;
    }
    toPayload() {
        return compact({ tr_id: this.trId, merchant_rid: this.merchantRid, gateway_environment: this.gatewayEnvironment });
    }
}
exports.MarxPayInitiatePaymentOptions = MarxPayInitiatePaymentOptions;
class MarxPayReturnVerificationOptions {
    returnedMerchantRid;
    returnedTrId;
    expectedMerchantRid;
    expectedTrId;
    gatewayEnvironment;
    constructor(input) {
        for (const value of [input.returnedMerchantRid, input.returnedTrId, input.expectedMerchantRid, input.expectedTrId]) {
            if (value.trim() === '')
                throw new TypeError('Both returned and expected MarxPay merchantRID/trId values are required.');
        }
        this.returnedMerchantRid = input.returnedMerchantRid;
        this.returnedTrId = input.returnedTrId;
        this.expectedMerchantRid = input.expectedMerchantRid;
        this.expectedTrId = input.expectedTrId;
        this.gatewayEnvironment = input.gatewayEnvironment ?? null;
    }
    toPayload() {
        return compact({
            payload: { merchantRID: this.returnedMerchantRid, trId: this.returnedTrId },
            expected: { merchant_rid: this.expectedMerchantRid, tr_id: this.expectedTrId },
            gateway_environment: this.gatewayEnvironment,
        });
    }
}
exports.MarxPayReturnVerificationOptions = MarxPayReturnVerificationOptions;
class MarxPayPaymentResult {
    merchantRid;
    trId;
    paymentStatus;
    providerStatus;
    amount;
    currency;
    paymentMethod;
    expiresAt;
    requestId;
    constructor(merchantRid, trId, paymentStatus, providerStatus, amount, currency, paymentMethod, expiresAt, requestId) {
        this.merchantRid = merchantRid;
        this.trId = trId;
        this.paymentStatus = paymentStatus;
        this.providerStatus = providerStatus;
        this.amount = amount;
        this.currency = currency;
        this.paymentMethod = paymentMethod;
        this.expiresAt = expiresAt;
        this.requestId = requestId;
    }
    static fromData(data, requestId) {
        for (const field of ['merchant_rid', 'tr_id', 'payment_status', 'provider_status']) {
            if (!isScalar(data[field]))
                throw new TypeError('AvraAPI returned an invalid MarxPay payment result.');
        }
        return new MarxPayPaymentResult(String(data.merchant_rid), String(data.tr_id), String(data.payment_status), String(data.provider_status), nullableScalar(data.amount), nullableScalar(data.currency), nullableScalar(data.payment_method), nullableScalar(data.expires_at), requestId);
    }
}
exports.MarxPayPaymentResult = MarxPayPaymentResult;
class MarxPayReturnVerification {
    verified;
    merchantRid;
    trId;
    requestId;
    constructor(verified, merchantRid, trId, requestId) {
        this.verified = verified;
        this.merchantRid = merchantRid;
        this.trId = trId;
        this.requestId = requestId;
    }
    static fromData(data, requestId) {
        if (data.verified !== true || !isScalar(data.merchant_rid) || !isScalar(data.tr_id)) {
            throw new TypeError('AvraAPI returned an invalid MarxPay return verification result.');
        }
        return new MarxPayReturnVerification(true, String(data.merchant_rid), String(data.tr_id), requestId);
    }
}
exports.MarxPayReturnVerification = MarxPayReturnVerification;
class SubscriptionSummary {
    subscriptionId;
    orderId;
    status;
    amount;
    currency;
    recurrence;
    constructor(subscriptionId, orderId, status, amount, currency, recurrence) {
        this.subscriptionId = subscriptionId;
        this.orderId = orderId;
        this.status = status;
        this.amount = amount;
        this.currency = currency;
        this.recurrence = recurrence;
    }
    static fromData(data) {
        return new SubscriptionSummary(nullableScalar(data.subscription_id), nullableScalar(data.order_id), String(data.status ?? 'UNKNOWN'), nullableScalar(data.amount), nullableScalar(data.currency), nullableScalar(data.recurrence));
    }
}
exports.SubscriptionSummary = SubscriptionSummary;
class SubscriptionCommandResult {
    accepted;
    providerStatus;
    subscriptionId;
    constructor(accepted, providerStatus, subscriptionId) {
        this.accepted = accepted;
        this.providerStatus = providerStatus;
        this.subscriptionId = subscriptionId;
    }
    static fromData(data) {
        return new SubscriptionCommandResult(data.command_accepted === true, String(data.provider_status ?? 'unknown'), String(data.subscription_id ?? ''));
    }
}
exports.SubscriptionCommandResult = SubscriptionCommandResult;
class KokoOrderView {
    orderId;
    gatewayReference;
    providerStatus;
    native;
    requestId;
    constructor(orderId, gatewayReference, providerStatus, native, requestId) {
        this.orderId = orderId;
        this.gatewayReference = gatewayReference;
        this.providerStatus = providerStatus;
        this.native = native;
        this.requestId = requestId;
    }
    static fromData(data, requestId) {
        for (const field of ['order_id', 'gateway_reference', 'provider_status']) {
            if (!isScalar(data[field]) || String(data[field]).trim() === '')
                throw new TypeError('AvraAPI returned an invalid KOKO order-view result.');
        }
        return new KokoOrderView(String(data.order_id), String(data.gateway_reference), String(data.provider_status), isRecord(data.native) ? { ...data.native } : {}, requestId);
    }
}
exports.KokoOrderView = KokoOrderView;
class PayPlusStatus {
    orderId;
    providerStatus;
    timestamp;
    requestId;
    constructor(orderId, providerStatus, timestamp, requestId) {
        this.orderId = orderId;
        this.providerStatus = providerStatus;
        this.timestamp = timestamp;
        this.requestId = requestId;
    }
    static fromData(data, requestId) {
        if (!isScalar(data.order_id) || !isScalar(data.provider_status))
            throw new TypeError('AvraAPI returned an invalid PayPlus payment status.');
        return new PayPlusStatus(String(data.order_id), String(data.provider_status), nullableScalar(data.timestamp), requestId);
    }
}
exports.PayPlusStatus = PayPlusStatus;
/** Exact signed PayPlus callback evidence for merchant-server completion only. */
class PayPlusCallbackPayload {
    rawBody;
    authorization;
    constructor(rawBody, authorization) {
        if (rawBody.trim() === '' || authorization.trim() === '') {
            throw new TypeError('PayPlus raw callback body and Authorization header are required.');
        }
        this.rawBody = rawBody;
        this.authorization = authorization;
    }
    toPayload() {
        return { raw_body: this.rawBody, authorization: this.authorization };
    }
}
exports.PayPlusCallbackPayload = PayPlusCallbackPayload;
/** Exact DirectPay callback evidence for merchant-server completion only. */
class DirectPayCallbackPayload {
    rawBody;
    authorization;
    constructor(rawBody, authorization) {
        if (rawBody.trim() === '' || authorization.trim() === '') {
            throw new TypeError('DirectPay raw callback body and Authorization header are required.');
        }
        this.rawBody = rawBody;
        this.authorization = authorization;
    }
    toPayload() {
        return { raw_body: this.rawBody, authorization: this.authorization };
    }
}
exports.DirectPayCallbackPayload = DirectPayCallbackPayload;
/** Untrusted Stripe browser return: AvraAPI retrieves the bound Checkout Session. */
class StripeReturnPayload {
    sessionId;
    constructor(sessionId) {
        if (!sessionId.startsWith('cs_'))
            throw new TypeError('A Stripe Checkout Session ID is required.');
        this.sessionId = sessionId;
    }
    toPayload() {
        return { return: { session_id: this.sessionId } };
    }
}
exports.StripeReturnPayload = StripeReturnPayload;
/** Exact raw Stripe webhook evidence, Base64-wrapped only for JSON transport. */
class StripeWebhookPayload {
    rawBody;
    stripeSignature;
    constructor(rawBody, stripeSignature) {
        if (rawBody === '' || stripeSignature.trim() === '') {
            throw new TypeError('Stripe raw webhook body and Stripe-Signature are required.');
        }
        this.rawBody = rawBody;
        this.stripeSignature = stripeSignature;
    }
    toPayload() {
        return {
            webhook: {
                raw_body_base64: Buffer.from(this.rawBody, 'utf8').toString('base64'),
                stripe_signature: this.stripeSignature,
            },
        };
    }
}
exports.StripeWebhookPayload = StripeWebhookPayload;
/** Untrusted OnePay Dashboard callback: use only as a server-side completion trigger. */
class OnePayCallbackPayload {
    callback;
    constructor(callback) {
        this.callback = callback;
    }
    toPayload() { return { callback: { ...this.callback } }; }
}
exports.OnePayCallbackPayload = OnePayCallbackPayload;
/** Untrusted OnePay browser return: use only as a server-side completion trigger. */
class OnePayReturnPayload {
    query;
    constructor(query) {
        this.query = query;
    }
    toPayload() { return { return: { ...this.query } }; }
}
exports.OnePayReturnPayload = OnePayReturnPayload;
/** WebXPay browser return is untrusted until independently reconciled by AvraAPI. */
class WebXPayReturnPayload {
    query;
    constructor(query) {
        this.query = query;
    }
    toPayload() { return { return: { ...this.query } }; }
}
exports.WebXPayReturnPayload = WebXPayReturnPayload;
/** Exact KOKO notification fields. */
class KokoCallbackPayload {
    orderId;
    transactionId;
    status;
    description;
    signature;
    constructor(input) {
        for (const value of [input.orderId, input.transactionId, input.status, input.signature]) {
            if (value.trim() === '')
                throw new TypeError('KOKO callback order ID, transaction ID, status, and signature are required.');
        }
        this.orderId = input.orderId;
        this.transactionId = input.transactionId;
        this.status = input.status;
        this.description = input.description;
        this.signature = input.signature;
    }
    /** Build the exact callback contract from KOKO's posted form fields. */
    static fromForm(fields) {
        return new KokoCallbackPayload({
            orderId: stringField(fields, 'orderId'),
            transactionId: stringField(fields, 'trnId'),
            status: stringField(fields, 'status'),
            description: stringField(fields, 'desc'),
            signature: stringField(fields, 'signature'),
        });
    }
    toPayload() {
        return { orderId: this.orderId, trnId: this.transactionId, status: this.status, desc: this.description, signature: this.signature };
    }
}
exports.KokoCallbackPayload = KokoCallbackPayload;
/** KOKO browser return: never use this as payment proof. */
class KokoReturnPayload {
    orderId;
    transactionId;
    status;
    constructor(input) {
        if (input.orderId.trim() === '')
            throw new TypeError('A KOKO return order ID is required.');
        this.orderId = input.orderId;
        this.transactionId = normalizeNullable(input.transactionId);
        this.status = normalizeNullable(input.status);
    }
    /** Build the unsigned browser-return contract from KOKO query parameters. */
    static fromQuery(query) {
        return new KokoReturnPayload({
            orderId: stringField(query, 'orderId'),
            transactionId: nullableField(query, 'trnId'),
            status: nullableField(query, 'status'),
        });
    }
    toPayload() {
        return compact({ orderId: this.orderId, trnId: this.transactionId, status: this.status });
    }
}
exports.KokoReturnPayload = KokoReturnPayload;
/**
 * Secret-free HTML mount helpers for the independently versioned Payment
 * Elements browser package. Keep checkout creation and completion on the server.
 */
class PaymentElementsRenderer {
    static renderForm(mountId, options = {}) {
        return this.render('form', mountId, options);
    }
    static renderMethods(mountId, options = {}) {
        return this.render('methods', mountId, options);
    }
    static render(component, mountId, options) {
        if (!/^[A-Za-z][A-Za-z0-9_-]{0,127}$/.test(mountId)) {
            throw new TypeError('Payment Elements mount ID must start with a letter and contain only letters, numbers, dashes, or underscores.');
        }
        const cdnUrl = this.cdnUrl(String(options.cdnUrl ?? process.env.PAYMENT_ELEMENTS_CDN_URL ?? 'https://cdn.avraapi.com/payment-elements'));
        const version = String(options.version ?? process.env.PAYMENT_ELEMENTS_VERSION ?? '1.1.0').trim();
        if (!/^\d+\.\d+\.\d+$/.test(version))
            throw new TypeError('Payment Elements version must be an immutable semantic version.');
        const { cdnUrl: _cdn, version: _version, nonce, availability, ...renderOptions } = options;
        void _cdn;
        void _version;
        const safeId = escapeHtml(mountId);
        const safeSrc = escapeHtml(this.scriptUrl(cdnUrl, version));
        const nonceAttribute = nonce == null ? '' : ` nonce="${escapeHtml(String(nonce))}"`;
        const optionsJson = safeJson(renderOptions);
        const availabilityBootstrap = component === 'methods' && isAvailabilityPayload(availability)
            ? `<script${nonceAttribute} type="application/json" id="${safeId}--avraapi-payment-availability" data-avraapi-payment-availability-for="${safeId}">${safeJson(availability)}</script>\n`
            : '';
        return `<div id="${safeId}" data-avraapi-elements-mount="${component}" aria-live="polite"><p>AvraAPI Payment Elements is loading. If this message remains, verify the pinned CDN script and Content Security Policy (elements_script_missing).</p></div>\n${availabilityBootstrap}<script${nonceAttribute} src="${safeSrc}" defer onerror="document.getElementById('${safeId}').textContent='AvraAPI Payment Elements could not load (elements_script_missing). Check the versioned CDN script and Content Security Policy.';"></script>\n<script${nonceAttribute}>window.addEventListener('DOMContentLoaded',function(){var target=document.getElementById('${safeId}');if(!window.AvraAPIPaymentElements||!window.AvraAPIPaymentElements.create){target.textContent='AvraAPI Payment Elements is unavailable (elements_script_missing). Include ${safeSrc} before mounting this component.';return;}try{window.AvraAPIPaymentElements.create({"assetBaseUrl":${safeJson(cdnUrl)}}).render${component === 'form' ? 'Form' : 'Methods'}(target,${optionsJson});}catch(error){target.textContent='AvraAPI Payment Elements could not render ('+(error.code||'elements_render_failed')+').';}});</script>`;
    }
    static cdnUrl(value) {
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
    static scriptUrl(cdnUrl, version) {
        const localBundle = ['dev', 'development'].includes((process.env.APIX_ENV ?? '').trim().toLowerCase())
            && /^(true|1)$/i.test(process.env.PAYMENT_ELEMENTS_LOCAL_BUNDLE ?? '');
        return localBundle ? `${cdnUrl}/avraapi-payment-elements.umd.js` : `${cdnUrl}/v${version}/avraapi-payment-elements.umd.js`;
    }
}
exports.PaymentElementsRenderer = PaymentElementsRenderer;
/** Render an auto-submitting redirect form only for a redirect_form session. */
class RedirectFormRenderer {
    static render(session, submitLabel = 'Continue to payment') {
        if (session.mode !== PaymentTypes_js_1.CheckoutMode.Redirect || session.checkout.type !== 'redirect_form') {
            throw new TypeError('A redirect form can only be rendered for a redirect payment session.');
        }
        const action = typeof session.checkout.action_url === 'string' ? session.checkout.action_url : '';
        const fields = isRecord(session.checkout.fields) ? session.checkout.fields : null;
        if (action === '' || fields == null)
            throw new TypeError('Payment session does not contain a redirect form.');
        const inputs = Object.entries(fields).filter(([, value]) => isScalar(value)).map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(String(value))}">`).join('');
        return `<form method="post" action="${escapeHtml(action)}">${inputs}<button type="submit">${escapeHtml(submitLabel)}</button></form>`;
    }
}
exports.RedirectFormRenderer = RedirectFormRenderer;
function compact(value) {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item != null && item !== ''));
}
function isPositiveAmount(value) {
    return /^(0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value) && !/^0+(?:\.0{1,2})?$/.test(value);
}
function isScalar(value) {
    return ['string', 'number', 'boolean'].includes(typeof value);
}
function nullableScalar(value) {
    return isScalar(value) ? String(value) : null;
}
function isRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
function normalizeNullable(value) {
    const normalized = value?.trim() ?? '';
    return normalized === '' ? null : normalized;
}
function stringField(fields, name) {
    const value = fields[name];
    return isScalar(value) ? String(value).trim() : '';
}
function nullableField(fields, name) {
    const value = stringField(fields, name);
    return value === '' ? null : value;
}
function isAvailabilityPayload(value) {
    return Array.isArray(value) || isRecord(value);
}
function escapeHtml(value) {
    return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[character] ?? character);
}
function safeJson(value) {
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
//# sourceMappingURL=GatewayTypes.js.map