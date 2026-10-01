"use strict";
/** Gateway-specific server-only Universal Payment Gateway services. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebXPayReturnPayload = exports.OnePayReturnPayload = exports.OnePayCallbackPayload = exports.KokoReturnPayload = exports.KokoCallbackPayload = exports.WebXPayService = exports.PayPlusService = exports.KokoService = exports.OnePayService = exports.MarxPayService = exports.PayHereChargesService = exports.PayHereSubscriptionService = exports.PayHereRecurringService = exports.PayHerePreapprovalService = exports.PayHereCapturesService = exports.PayHereAuthorizationService = exports.PayHereRefundsService = exports.PayHereRetrievalService = exports.PaymentElementsService = exports.PayHereService = void 0;
const ApiResponse_js_1 = require("../responses/ApiResponse.js");
const AbstractService_js_1 = require("./AbstractService.js");
const GatewayTypes_js_1 = require("../payments/GatewayTypes.js");
Object.defineProperty(exports, "KokoCallbackPayload", { enumerable: true, get: function () { return GatewayTypes_js_1.KokoCallbackPayload; } });
Object.defineProperty(exports, "KokoReturnPayload", { enumerable: true, get: function () { return GatewayTypes_js_1.KokoReturnPayload; } });
Object.defineProperty(exports, "OnePayCallbackPayload", { enumerable: true, get: function () { return GatewayTypes_js_1.OnePayCallbackPayload; } });
Object.defineProperty(exports, "OnePayReturnPayload", { enumerable: true, get: function () { return GatewayTypes_js_1.OnePayReturnPayload; } });
Object.defineProperty(exports, "WebXPayReturnPayload", { enumerable: true, get: function () { return GatewayTypes_js_1.WebXPayReturnPayload; } });
const PaymentTypes_js_1 = require("../payments/PaymentTypes.js");
/** PayHere advanced operations. Checkout creation remains on PaymentService.createOrder(). */
class PayHereService extends AbstractService_js_1.AbstractService {
    _retrieval = null;
    _refunds = null;
    _recurring = null;
    _subscriptions = null;
    _preapprovals = null;
    _authorizations = null;
    _charges = null;
    _captures = null;
    retrieval() { return (this._retrieval ??= new PayHereRetrievalService(this.http)); }
    refunds() { return (this._refunds ??= new PayHereRefundsService(this.http)); }
    recurring() { return (this._recurring ??= new PayHereRecurringService(this.http)); }
    subscriptions() { return (this._subscriptions ??= new PayHereSubscriptionService(this.http)); }
    preapprovals() { return (this._preapprovals ??= new PayHerePreapprovalService(this.http)); }
    authorizations() { return (this._authorizations ??= new PayHereAuthorizationService(this.http)); }
    charges() { return (this._charges ??= new PayHereChargesService(this.http)); }
    captures() { return (this._captures ??= new PayHereCapturesService(this.http)); }
}
exports.PayHereService = PayHereService;
/** Secret-free Payment Elements markup helpers; they never receive SDK credentials. */
class PaymentElementsService {
    renderForm(mountId, options = {}) {
        return GatewayTypes_js_1.PaymentElementsRenderer.renderForm(mountId, options);
    }
    renderMethods(mountId, options = {}) {
        return GatewayTypes_js_1.PaymentElementsRenderer.renderMethods(mountId, options);
    }
}
exports.PaymentElementsService = PaymentElementsService;
class PayHereRetrievalService extends AbstractService_js_1.AbstractService {
    /** Privacy-safe payment projections for one merchant order. */
    async findByOrderId(orderId, gatewayEnvironment) {
        requireText(orderId, 'A PayHere order ID is required.');
        const data = responseData(await this.get('/payments/payhere/retrieval', environmentQuery(PaymentTypes_js_1.GatewayCode.PayHere, gatewayEnvironment, { order_id: orderId })));
        return payloadList(data.payments);
    }
}
exports.PayHereRetrievalService = PayHereRetrievalService;
class PayHereRefundsService extends AbstractService_js_1.AbstractService {
    /** Creates a full or partial PayHere refund. This is an irreversible provider action. */
    async create(input) {
        requireText(input.idempotencyKey, 'An Idempotency-Key is required for a PayHere refund.');
        const paymentId = input.paymentId?.trim() ?? '';
        const authorizationToken = input.authorizationToken?.trim() ?? '';
        if ((paymentId === '') === (authorizationToken === ''))
            throw new TypeError('Provide exactly one PayHere payment ID or authorization token.');
        if (input.confirmRefund !== true)
            throw new TypeError('confirmRefund must be true to issue a refund.');
        const payload = environmentPayload(PaymentTypes_js_1.GatewayCode.PayHere, input.gatewayEnvironment, {
            payment_id: paymentId || null,
            authorization_token: authorizationToken || null,
            description: input.description,
            confirm_refund: true,
            amount: input.amount ?? null,
        });
        return responseData(await this.post('/payments/payhere/refunds', payload, { 'Idempotency-Key': input.idempotencyKey }));
    }
}
exports.PayHereRefundsService = PayHereRefundsService;
class PayHereAuthorizationService extends AbstractService_js_1.AbstractService {
    /** Prepares a redirect authorization-hold session. */
    async create(options) {
        const request = options instanceof GatewayTypes_js_1.AuthorizationOptions ? options : new GatewayTypes_js_1.AuthorizationOptions(options);
        return paymentSession(await this.post('/payments/authorizations', request.toPayload()));
    }
}
exports.PayHereAuthorizationService = PayHereAuthorizationService;
class PayHereCapturesService extends AbstractService_js_1.AbstractService {
    /** Captures a previously authorized PayHere amount. This is irreversible. */
    async create(input) {
        requireText(input.idempotencyKey, 'An Idempotency-Key is required for a PayHere capture.');
        if (input.confirmCapture !== true)
            throw new TypeError('confirmCapture must be true to capture a PayHere authorization.');
        return responseData(await this.post('/payments/payhere/captures', environmentPayload(PaymentTypes_js_1.GatewayCode.PayHere, input.gatewayEnvironment, {
            authorization_token: input.authorizationToken,
            amount: input.amount,
            expected_authorized_amount: input.expectedAuthorizedAmount,
            expected_order_id: input.expectedOrderId,
            currency: input.currency,
            deduction_details: input.deductionDetails,
            confirm_capture: true,
        }), { 'Idempotency-Key': input.idempotencyKey }));
    }
}
exports.PayHereCapturesService = PayHereCapturesService;
class PayHerePreapprovalService extends AbstractService_js_1.AbstractService {
    async create(options) {
        const request = options instanceof GatewayTypes_js_1.PreapprovalOptions ? options : new GatewayTypes_js_1.PreapprovalOptions(options);
        return paymentSession(await this.post('/payments/preapprovals', request.toPayload()));
    }
}
exports.PayHerePreapprovalService = PayHerePreapprovalService;
class PayHereRecurringService extends AbstractService_js_1.AbstractService {
    async create(options) {
        const request = options instanceof GatewayTypes_js_1.RecurringOrderOptions ? options : new GatewayTypes_js_1.RecurringOrderOptions(options);
        return paymentSession(await this.post('/payments/recurring/orders', request.toPayload()));
    }
}
exports.PayHereRecurringService = PayHereRecurringService;
class PayHereSubscriptionService extends AbstractService_js_1.AbstractService {
    async all(gatewayEnvironment) {
        const data = responseData(await this.get('/payments/payhere/subscriptions', environmentQuery(PaymentTypes_js_1.GatewayCode.PayHere, gatewayEnvironment)));
        return payloadList(data.subscriptions).map((subscription) => GatewayTypes_js_1.SubscriptionSummary.fromData(subscription));
    }
    async find(subscriptionId, gatewayEnvironment) {
        const id = payHereSubscriptionId(subscriptionId);
        const data = responseData(await this.get(`/payments/payhere/subscriptions/${encodeURIComponent(id)}`, environmentQuery(PaymentTypes_js_1.GatewayCode.PayHere, gatewayEnvironment)));
        return GatewayTypes_js_1.SubscriptionSummary.fromData(record(data.subscription));
    }
    async payments(subscriptionId, gatewayEnvironment) {
        const id = payHereSubscriptionId(subscriptionId);
        const data = responseData(await this.get(`/payments/payhere/subscriptions/${encodeURIComponent(id)}/payments`, environmentQuery(PaymentTypes_js_1.GatewayCode.PayHere, gatewayEnvironment)));
        return payloadList(data.payments);
    }
    async retry(input) {
        requireText(input.idempotencyKey, 'An Idempotency-Key is required to retry a PayHere subscription.');
        if (input.confirmRetry !== true)
            throw new TypeError('confirmRetry must be true to retry a subscription.');
        const data = responseData(await this.post('/payments/payhere/subscriptions/retry', environmentPayload(PaymentTypes_js_1.GatewayCode.PayHere, input.gatewayEnvironment, {
            subscription_id: payHereSubscriptionId(input.subscriptionId), confirm_retry: true,
        }), { 'Idempotency-Key': input.idempotencyKey }));
        return GatewayTypes_js_1.SubscriptionCommandResult.fromData(data);
    }
    async cancel(input) {
        requireText(input.idempotencyKey, 'An Idempotency-Key is required to cancel a PayHere subscription.');
        if (input.confirmCancel !== true)
            throw new TypeError('confirmCancel must be true to cancel a subscription.');
        const data = responseData(await this.post('/payments/payhere/subscriptions/cancel', environmentPayload(PaymentTypes_js_1.GatewayCode.PayHere, input.gatewayEnvironment, {
            subscription_id: payHereSubscriptionId(input.subscriptionId), confirm_cancel: true,
        }), { 'Idempotency-Key': input.idempotencyKey }));
        return GatewayTypes_js_1.SubscriptionCommandResult.fromData(data);
    }
}
exports.PayHereSubscriptionService = PayHereSubscriptionService;
class PayHereChargesService extends AbstractService_js_1.AbstractService {
    /** Charges a stored PayHere customer token. This is irreversible. */
    async create(input) {
        requireText(input.idempotencyKey, 'An Idempotency-Key is required for a PayHere token charge.');
        if (input.confirmCharge !== true)
            throw new TypeError('confirmCharge must be true to create a PayHere token charge.');
        return responseData(await this.post('/payments/payhere/charges', environmentPayload(PaymentTypes_js_1.GatewayCode.PayHere, input.gatewayEnvironment, {
            order_id: input.orderId, items: input.items, currency: input.currency, amount: input.amount,
            customer_token: input.customerToken, confirm_charge: true,
        }), { 'Idempotency-Key': input.idempotencyKey }));
    }
}
exports.PayHereChargesService = PayHereChargesService;
/** Server-only MarxPay v4 operations. */
class MarxPayService extends AbstractService_js_1.AbstractService {
    async verifyReturn(options) {
        const request = options instanceof GatewayTypes_js_1.MarxPayReturnVerificationOptions ? options : new GatewayTypes_js_1.MarxPayReturnVerificationOptions(options);
        const response = expectJson(await this.post('/payments/marxpay/returns/verify', withConfiguredEnvironment(PaymentTypes_js_1.GatewayCode.MarxPay, request.gatewayEnvironment, request.toPayload())));
        return GatewayTypes_js_1.MarxPayReturnVerification.fromData(response.data, response.requestId || null);
    }
    async initiatePayment(options) {
        const request = options instanceof GatewayTypes_js_1.MarxPayInitiatePaymentOptions ? options : new GatewayTypes_js_1.MarxPayInitiatePaymentOptions(options);
        const response = expectJson(await this.post('/payments/marxpay/orders/initiate', withConfiguredEnvironment(PaymentTypes_js_1.GatewayCode.MarxPay, request.gatewayEnvironment, request.toPayload())));
        return GatewayTypes_js_1.MarxPayPaymentResult.fromData(response.data, response.requestId || null);
    }
    async retrieveOrderSummary(trId, merchantRid, gatewayEnvironment) {
        requireText(trId, 'A MarxPay trId and merchantRID are required.');
        requireText(merchantRid, 'A MarxPay trId and merchantRID are required.');
        const response = expectJson(await this.get(`/payments/marxpay/orders/${encodeURIComponent(trId.trim())}/summary`, environmentQuery(PaymentTypes_js_1.GatewayCode.MarxPay, gatewayEnvironment, { merchant_rid: merchantRid.trim() })));
        return GatewayTypes_js_1.MarxPayPaymentResult.fromData(response.data, response.requestId || null);
    }
}
exports.MarxPayService = MarxPayService;
/** Server-only OnePay status lookup. */
class OnePayService extends AbstractService_js_1.AbstractService {
    async status(onePayTransactionId, gatewayEnvironment) {
        requireText(onePayTransactionId, 'A OnePay transaction ID is required.');
        return responseData(await this.post('/payments/onepay/status', environmentPayload(PaymentTypes_js_1.GatewayCode.OnePay, gatewayEnvironment, {
            onepay_transaction_id: onePayTransactionId,
        }), { 'X-AvraAPI-Completion-Delivery': 'merchant-server' }));
    }
}
exports.OnePayService = OnePayService;
/** Server-only signed KOKO reconciliation. */
class KokoService extends AbstractService_js_1.AbstractService {
    async orderView(orderId, gatewayEnvironment) {
        requireText(orderId, 'A KOKO order ID is required.');
        const response = expectJson(await this.post('/payments/koko/orders/view', environmentPayload(PaymentTypes_js_1.GatewayCode.Koko, gatewayEnvironment, { order_id: orderId.trim() })));
        return GatewayTypes_js_1.KokoOrderView.fromData(response.data, response.requestId || null);
    }
}
exports.KokoService = KokoService;
/** Server-only PayPlus status reconciliation. Signed callbacks still use completePayment(). */
class PayPlusService extends AbstractService_js_1.AbstractService {
    async status(orderId, gatewayEnvironment) {
        requireText(orderId, 'A PayPlus order ID is required.');
        const response = expectJson(await this.post('/payments/payplus/status', environmentPayload(PaymentTypes_js_1.GatewayCode.PayPlus, gatewayEnvironment, { order_id: orderId.trim() })));
        return GatewayTypes_js_1.PayPlusStatus.fromData(response.data, response.requestId || null);
    }
}
exports.PayPlusService = PayPlusService;
/** Server-only WebXPay Merchant API lookup. Browser returns are never payment proof. */
class WebXPayService extends AbstractService_js_1.AbstractService {
    async status(orderId, gatewayEnvironment) {
        requireText(orderId, 'A WebXPay order ID is required.');
        return responseData(await this.post('/payments/webxpay/status', environmentPayload(PaymentTypes_js_1.GatewayCode.WebXPay, gatewayEnvironment, { order_id: orderId.trim() }), {
            'X-AvraAPI-Completion-Delivery': 'merchant-server',
        }));
    }
}
exports.WebXPayService = WebXPayService;
function expectJson(response) {
    if (!(response instanceof ApiResponse_js_1.ApiResponse))
        throw new TypeError('AvraAPI returned an unexpected binary response for a payment operation.');
    return response;
}
function responseData(response) {
    return expectJson(response).data;
}
function paymentSession(response) {
    const json = expectJson(response);
    return PaymentTypes_js_1.PaymentSession.fromData(json.data, json.requestId);
}
function record(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function payloadList(value) {
    return Array.isArray(value) ? value.filter((item) => item != null && typeof item === 'object' && !Array.isArray(item)).map((item) => ({ ...item })) : [];
}
function requireText(value, message) {
    if (value.trim() === '')
        throw new TypeError(message);
}
function payHereSubscriptionId(value) {
    const id = value.trim();
    if (!/^\d{1,32}$/.test(id))
        throw new TypeError('subscriptionId must be a PayHere numeric subscription ID.');
    return id;
}
function environmentQuery(gateway, explicit, payload = {}) {
    const environment = PaymentTypes_js_1.GatewayEnvironment.configuredFor(gateway, explicit);
    return environment == null ? payload : { ...payload, gateway_environment: environment };
}
function environmentPayload(gateway, explicit, payload) {
    return withConfiguredEnvironment(gateway, explicit, payload);
}
function withConfiguredEnvironment(gateway, explicit, payload) {
    const environment = PaymentTypes_js_1.GatewayEnvironment.configuredFor(gateway, explicit);
    const filtered = Object.fromEntries(Object.entries(payload).filter(([, value]) => value != null && value !== ''));
    return environment == null ? filtered : { ...filtered, gateway_environment: environment };
}
//# sourceMappingURL=PaymentGatewayServices.js.map