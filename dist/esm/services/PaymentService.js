/** Server-only typed Universal Payment Gateway lifecycle operations. */
import { ApiResponse } from '../responses/ApiResponse.js';
import { AbstractService } from './AbstractService.js';
import { KokoService, MarxPayService, OnePayService, PaymentElementsService, PayHereService, PayPlusService, WebXPayService, } from './PaymentGatewayServices.js';
import { CreateOrderOptions, GatewayCode, GatewayEnvironment, PaymentAvailability, PaymentCompletionOptions, PaymentCompletionResult, PaymentSession, SensitiveCallbackOptions, SensitiveVerificationResult, VerificationResult, VerifyCallbackOptions, } from '../payments/PaymentTypes.js';
/**
 * Typed Universal Payment Gateway lifecycle operations.
 *
 * Every method is server-only. A provider browser event is never payment proof:
 * retain the `completionContext` server-side and use completion/verification
 * methods from an authenticated merchant callback or return handler.
 */
export class PaymentService extends AbstractService {
    _payHere = null;
    _marxPay = null;
    _onePay = null;
    _koko = null;
    _payPlus = null;
    _webXPay = null;
    _elements = null;
    /** PayHere advanced lifecycle operations. Server-only. */
    payHere() {
        return (this._payHere ??= new PayHereService(this.http));
    }
    /** PHP-contract alias for `payHere()`. */
    payhere() {
        return this.payHere();
    }
    /** MarxPay v4 server-side operations. */
    marxPay() {
        return (this._marxPay ??= new MarxPayService(this.http));
    }
    /** PHP-contract alias for `marxPay()`. */
    marxpay() {
        return this.marxPay();
    }
    /** OnePay server-side status lookup. */
    onePay() {
        return (this._onePay ??= new OnePayService(this.http));
    }
    /** PHP-contract alias for `onePay()`. */
    onepay() {
        return this.onePay();
    }
    /** KOKO signed order reconciliation. */
    koko() {
        return (this._koko ??= new KokoService(this.http));
    }
    /** PayPlus server-side status reconciliation. */
    payPlus() {
        return (this._payPlus ??= new PayPlusService(this.http));
    }
    /** PHP-contract alias for `payPlus()`. */
    payplus() {
        return this.payPlus();
    }
    /** WebXPay Merchant API status lookup. */
    webXPay() {
        return (this._webXPay ??= new WebXPayService(this.http));
    }
    /** PHP-contract alias for `webXPay()`. */
    webxpay() {
        return this.webXPay();
    }
    /** Secret-free server-rendered Payment Elements helpers. */
    elements() {
        return (this._elements ??= new PaymentElementsService());
    }
    renderForm(mountId, options = {}) {
        return this.elements().renderForm(mountId, options);
    }
    /**
     * Render the payment-method mount. If availability was not supplied, it is
     * fetched from AvraAPI and embedded as browser-safe metadata only.
     */
    async renderMethods(mountId, options = {}, merchantDomain) {
        if (!Object.hasOwn(options, 'availability') && !Object.hasOwn(options, 'methods')) {
            const availability = await this.availability(merchantDomain);
            return this.elements().renderMethods(mountId, { ...options, availability: availability.toElementsPayload() });
        }
        return this.elements().renderMethods(mountId, options);
    }
    /** Discover public payment methods currently usable by this project. */
    async methods(merchantDomain) {
        const response = this.expectJson(await this.discover('/payments/methods', merchantDomain));
        const methods = response.data.methods;
        return Array.isArray(methods) ? methods.filter(this.isRecord).map((method) => ({ ...method })) : [];
    }
    /** Returns only browser-safe Payment Elements availability metadata. */
    async availability(merchantDomain) {
        const response = this.expectJson(await this.discover('/payments/availability', merchantDomain));
        return PaymentAvailability.fromData(response.data, response.requestId || null);
    }
    /** Prepare a server-owned checkout session. Never expose its completion context. */
    async createOrder(options) {
        const request = options instanceof CreateOrderOptions ? options : new CreateOrderOptions(options);
        const response = this.expectJson(await this.post('/payments/orders', request.toPayload()));
        return PaymentSession.fromData(response.data, response.requestId);
    }
    /** Complete a callback/return from the merchant server only. */
    async completePayment(options) {
        const request = options instanceof PaymentCompletionOptions ? options : new PaymentCompletionOptions(options);
        const response = this.expectJson(await this.post('/payments/complete', request.toPayload(), { 'X-AvraAPI-Completion-Delivery': 'merchant-server' }));
        return PaymentCompletionResult.fromData(response.data, response.requestId);
    }
    /** Verify a checkout or recurring callback on the merchant server. */
    async verifyCallback(options) {
        const request = options instanceof VerifyCallbackOptions ? options : new VerifyCallbackOptions(options);
        const response = this.expectJson(await this.post('/payments/callbacks/verify', request.toPayload()));
        return VerificationResult.fromData(response.data, response.requestId);
    }
    /**
     * Verify a PayHere preapproval/authorization callback on the merchant server.
     * The artifact is non-serializable by design and must never reach a browser.
     */
    async verifySensitiveCallback(options) {
        const request = options instanceof SensitiveCallbackOptions ? options : new SensitiveCallbackOptions(options);
        const response = this.expectJson(await this.post('/payments/sensitive/callbacks/verify', request.toPayload(), { 'X-AvraAPI-Artifact-Delivery': 'merchant-server' }));
        return SensitiveVerificationResult.fromData(response.data, response.requestId);
    }
    methodDiscoveryQuery(merchantDomain) {
        const query = {};
        for (const gateway of Object.values(GatewayCode)) {
            const environment = GatewayEnvironment.configuredFor(gateway);
            if (environment != null)
                query[`gateway_environments[${gateway}]`] = environment;
        }
        if (merchantDomain != null)
            query.merchant_domain = merchantDomain;
        return query;
    }
    /**
     * Current AvraAPI payment discovery routes are GET endpoints. Some already
     * deployed gateway installations still expose the older POST-only contract;
     * retry that form only after an explicit 405 response. This preserves the
     * public GET contract while keeping server integrations migration-safe.
     */
    async discover(path, merchantDomain) {
        try {
            return await this.get(path, this.methodDiscoveryQuery(merchantDomain));
        }
        catch (error) {
            if (!this.isLegacyPostOnlyDiscoveryRoute(error))
                throw error;
            return this.post(path, this.methodDiscoveryPayload(merchantDomain));
        }
    }
    methodDiscoveryPayload(merchantDomain) {
        const gatewayEnvironments = {};
        for (const gateway of Object.values(GatewayCode)) {
            const environment = GatewayEnvironment.configuredFor(gateway);
            if (environment != null)
                gatewayEnvironments[gateway] = environment;
        }
        return {
            ...(Object.keys(gatewayEnvironments).length === 0 ? {} : { gateway_environments: gatewayEnvironments }),
            ...(merchantDomain == null ? {} : { merchant_domain: merchantDomain }),
        };
    }
    isLegacyPostOnlyDiscoveryRoute(error) {
        return typeof error === 'object'
            && error != null
            && 'httpStatus' in error
            && error.httpStatus === 405
            && (!('errorCode' in error) || error.errorCode === 'method_not_allowed');
    }
    expectJson(response) {
        if (!(response instanceof ApiResponse)) {
            throw new Error('AvraAPI returned an unexpected binary response for a payment operation.');
        }
        return response;
    }
    isRecord(value) {
        return value != null && typeof value === 'object' && !Array.isArray(value);
    }
}
//# sourceMappingURL=PaymentService.js.map