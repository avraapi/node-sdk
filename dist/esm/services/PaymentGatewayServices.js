/** Gateway-specific server-only Universal Payment Gateway services. */
import { ApiResponse } from '../responses/ApiResponse.js';
import { AbstractService } from './AbstractService.js';
import { AuthorizationOptions, KokoCallbackPayload, KokoReturnPayload, KokoOrderView, MarxPayInitiatePaymentOptions, MarxPayPaymentResult, MarxPayReturnVerification, MarxPayReturnVerificationOptions, OnePayCallbackPayload, OnePayReturnPayload, PaymentElementsRenderer, PayPlusStatus, PreapprovalOptions, RecurringOrderOptions, SubscriptionCommandResult, SubscriptionSummary, WebXPayReturnPayload, } from '../payments/GatewayTypes.js';
import { GatewayCode, GatewayEnvironment, PaymentSession, } from '../payments/PaymentTypes.js';
/** PayHere advanced operations. Checkout creation remains on PaymentService.createOrder(). */
export class PayHereService extends AbstractService {
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
/** Secret-free Payment Elements markup helpers; they never receive SDK credentials. */
export class PaymentElementsService {
    renderForm(mountId, options = {}) {
        return PaymentElementsRenderer.renderForm(mountId, options);
    }
    renderMethods(mountId, options = {}) {
        return PaymentElementsRenderer.renderMethods(mountId, options);
    }
}
export class PayHereRetrievalService extends AbstractService {
    /** Privacy-safe payment projections for one merchant order. */
    async findByOrderId(orderId, gatewayEnvironment) {
        requireText(orderId, 'A PayHere order ID is required.');
        const data = responseData(await this.get('/payments/payhere/retrieval', environmentQuery(GatewayCode.PayHere, gatewayEnvironment, { order_id: orderId })));
        return payloadList(data.payments);
    }
}
export class PayHereRefundsService extends AbstractService {
    /** Creates a full or partial PayHere refund. This is an irreversible provider action. */
    async create(input) {
        requireText(input.idempotencyKey, 'An Idempotency-Key is required for a PayHere refund.');
        const paymentId = input.paymentId?.trim() ?? '';
        const authorizationToken = input.authorizationToken?.trim() ?? '';
        if ((paymentId === '') === (authorizationToken === ''))
            throw new TypeError('Provide exactly one PayHere payment ID or authorization token.');
        if (input.confirmRefund !== true)
            throw new TypeError('confirmRefund must be true to issue a refund.');
        const payload = environmentPayload(GatewayCode.PayHere, input.gatewayEnvironment, {
            payment_id: paymentId || null,
            authorization_token: authorizationToken || null,
            description: input.description,
            confirm_refund: true,
            amount: input.amount ?? null,
        });
        return responseData(await this.post('/payments/payhere/refunds', payload, { 'Idempotency-Key': input.idempotencyKey }));
    }
}
export class PayHereAuthorizationService extends AbstractService {
    /** Prepares a redirect authorization-hold session. */
    async create(options) {
        const request = options instanceof AuthorizationOptions ? options : new AuthorizationOptions(options);
        return paymentSession(await this.post('/payments/authorizations', request.toPayload()));
    }
}
export class PayHereCapturesService extends AbstractService {
    /** Captures a previously authorized PayHere amount. This is irreversible. */
    async create(input) {
        requireText(input.idempotencyKey, 'An Idempotency-Key is required for a PayHere capture.');
        if (input.confirmCapture !== true)
            throw new TypeError('confirmCapture must be true to capture a PayHere authorization.');
        return responseData(await this.post('/payments/payhere/captures', environmentPayload(GatewayCode.PayHere, input.gatewayEnvironment, {
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
export class PayHerePreapprovalService extends AbstractService {
    async create(options) {
        const request = options instanceof PreapprovalOptions ? options : new PreapprovalOptions(options);
        return paymentSession(await this.post('/payments/preapprovals', request.toPayload()));
    }
}
export class PayHereRecurringService extends AbstractService {
    async create(options) {
        const request = options instanceof RecurringOrderOptions ? options : new RecurringOrderOptions(options);
        return paymentSession(await this.post('/payments/recurring/orders', request.toPayload()));
    }
}
export class PayHereSubscriptionService extends AbstractService {
    async all(gatewayEnvironment) {
        const data = responseData(await this.get('/payments/payhere/subscriptions', environmentQuery(GatewayCode.PayHere, gatewayEnvironment)));
        return payloadList(data.subscriptions).map((subscription) => SubscriptionSummary.fromData(subscription));
    }
    async find(subscriptionId, gatewayEnvironment) {
        const id = payHereSubscriptionId(subscriptionId);
        const data = responseData(await this.get(`/payments/payhere/subscriptions/${encodeURIComponent(id)}`, environmentQuery(GatewayCode.PayHere, gatewayEnvironment)));
        return SubscriptionSummary.fromData(record(data.subscription));
    }
    async payments(subscriptionId, gatewayEnvironment) {
        const id = payHereSubscriptionId(subscriptionId);
        const data = responseData(await this.get(`/payments/payhere/subscriptions/${encodeURIComponent(id)}/payments`, environmentQuery(GatewayCode.PayHere, gatewayEnvironment)));
        return payloadList(data.payments);
    }
    async retry(input) {
        requireText(input.idempotencyKey, 'An Idempotency-Key is required to retry a PayHere subscription.');
        if (input.confirmRetry !== true)
            throw new TypeError('confirmRetry must be true to retry a subscription.');
        const data = responseData(await this.post('/payments/payhere/subscriptions/retry', environmentPayload(GatewayCode.PayHere, input.gatewayEnvironment, {
            subscription_id: payHereSubscriptionId(input.subscriptionId), confirm_retry: true,
        }), { 'Idempotency-Key': input.idempotencyKey }));
        return SubscriptionCommandResult.fromData(data);
    }
    async cancel(input) {
        requireText(input.idempotencyKey, 'An Idempotency-Key is required to cancel a PayHere subscription.');
        if (input.confirmCancel !== true)
            throw new TypeError('confirmCancel must be true to cancel a subscription.');
        const data = responseData(await this.post('/payments/payhere/subscriptions/cancel', environmentPayload(GatewayCode.PayHere, input.gatewayEnvironment, {
            subscription_id: payHereSubscriptionId(input.subscriptionId), confirm_cancel: true,
        }), { 'Idempotency-Key': input.idempotencyKey }));
        return SubscriptionCommandResult.fromData(data);
    }
}
export class PayHereChargesService extends AbstractService {
    /** Charges a stored PayHere customer token. This is irreversible. */
    async create(input) {
        requireText(input.idempotencyKey, 'An Idempotency-Key is required for a PayHere token charge.');
        if (input.confirmCharge !== true)
            throw new TypeError('confirmCharge must be true to create a PayHere token charge.');
        return responseData(await this.post('/payments/payhere/charges', environmentPayload(GatewayCode.PayHere, input.gatewayEnvironment, {
            order_id: input.orderId, items: input.items, currency: input.currency, amount: input.amount,
            customer_token: input.customerToken, confirm_charge: true,
        }), { 'Idempotency-Key': input.idempotencyKey }));
    }
}
/** Server-only MarxPay v4 operations. */
export class MarxPayService extends AbstractService {
    async verifyReturn(options) {
        const request = options instanceof MarxPayReturnVerificationOptions ? options : new MarxPayReturnVerificationOptions(options);
        const response = expectJson(await this.post('/payments/marxpay/returns/verify', withConfiguredEnvironment(GatewayCode.MarxPay, request.gatewayEnvironment, request.toPayload())));
        return MarxPayReturnVerification.fromData(response.data, response.requestId || null);
    }
    async initiatePayment(options) {
        const request = options instanceof MarxPayInitiatePaymentOptions ? options : new MarxPayInitiatePaymentOptions(options);
        const response = expectJson(await this.post('/payments/marxpay/orders/initiate', withConfiguredEnvironment(GatewayCode.MarxPay, request.gatewayEnvironment, request.toPayload())));
        return MarxPayPaymentResult.fromData(response.data, response.requestId || null);
    }
    async retrieveOrderSummary(trId, merchantRid, gatewayEnvironment) {
        requireText(trId, 'A MarxPay trId and merchantRID are required.');
        requireText(merchantRid, 'A MarxPay trId and merchantRID are required.');
        const response = expectJson(await this.get(`/payments/marxpay/orders/${encodeURIComponent(trId.trim())}/summary`, environmentQuery(GatewayCode.MarxPay, gatewayEnvironment, { merchant_rid: merchantRid.trim() })));
        return MarxPayPaymentResult.fromData(response.data, response.requestId || null);
    }
}
/** Server-only OnePay status lookup. */
export class OnePayService extends AbstractService {
    async status(onePayTransactionId, gatewayEnvironment) {
        requireText(onePayTransactionId, 'A OnePay transaction ID is required.');
        return responseData(await this.post('/payments/onepay/status', environmentPayload(GatewayCode.OnePay, gatewayEnvironment, {
            onepay_transaction_id: onePayTransactionId,
        }), { 'X-AvraAPI-Completion-Delivery': 'merchant-server' }));
    }
}
/** Server-only signed KOKO reconciliation. */
export class KokoService extends AbstractService {
    async orderView(orderId, gatewayEnvironment) {
        requireText(orderId, 'A KOKO order ID is required.');
        const response = expectJson(await this.post('/payments/koko/orders/view', environmentPayload(GatewayCode.Koko, gatewayEnvironment, { order_id: orderId.trim() })));
        return KokoOrderView.fromData(response.data, response.requestId || null);
    }
}
/** Server-only PayPlus status reconciliation. Signed callbacks still use completePayment(). */
export class PayPlusService extends AbstractService {
    async status(orderId, gatewayEnvironment) {
        requireText(orderId, 'A PayPlus order ID is required.');
        const response = expectJson(await this.post('/payments/payplus/status', environmentPayload(GatewayCode.PayPlus, gatewayEnvironment, { order_id: orderId.trim() })));
        return PayPlusStatus.fromData(response.data, response.requestId || null);
    }
}
/** Server-only WebXPay Merchant API lookup. Browser returns are never payment proof. */
export class WebXPayService extends AbstractService {
    async status(orderId, gatewayEnvironment) {
        requireText(orderId, 'A WebXPay order ID is required.');
        return responseData(await this.post('/payments/webxpay/status', environmentPayload(GatewayCode.WebXPay, gatewayEnvironment, { order_id: orderId.trim() }), {
            'X-AvraAPI-Completion-Delivery': 'merchant-server',
        }));
    }
}
function expectJson(response) {
    if (!(response instanceof ApiResponse))
        throw new TypeError('AvraAPI returned an unexpected binary response for a payment operation.');
    return response;
}
function responseData(response) {
    return expectJson(response).data;
}
function paymentSession(response) {
    const json = expectJson(response);
    return PaymentSession.fromData(json.data, json.requestId);
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
    const environment = GatewayEnvironment.configuredFor(gateway, explicit);
    return environment == null ? payload : { ...payload, gateway_environment: environment };
}
function environmentPayload(gateway, explicit, payload) {
    return withConfiguredEnvironment(gateway, explicit, payload);
}
function withConfiguredEnvironment(gateway, explicit, payload) {
    const environment = GatewayEnvironment.configuredFor(gateway, explicit);
    const filtered = Object.fromEntries(Object.entries(payload).filter(([, value]) => value != null && value !== ''));
    return environment == null ? filtered : { ...filtered, gateway_environment: environment };
}
export { KokoCallbackPayload, KokoReturnPayload, OnePayCallbackPayload, OnePayReturnPayload, WebXPayReturnPayload };
//# sourceMappingURL=PaymentGatewayServices.js.map