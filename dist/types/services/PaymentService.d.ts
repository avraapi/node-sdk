/** Server-only typed Universal Payment Gateway lifecycle operations. */
import { AbstractService } from './AbstractService.js';
import { KokoService, MarxPayService, OnePayService, PaymentElementsService, PayHereService, PayPlusService, WebXPayService } from './PaymentGatewayServices.js';
import { CreateOrderOptions, type CreateOrderOptionsInput, PaymentAvailability, type PaymentCompletionOptionsInput, PaymentCompletionOptions, PaymentCompletionResult, type PaymentMethod, PaymentSession, type SensitiveCallbackOptionsInput, SensitiveCallbackOptions, SensitiveVerificationResult, type VerifyCallbackOptionsInput, VerificationResult, VerifyCallbackOptions } from '../payments/PaymentTypes.js';
/**
 * Typed Universal Payment Gateway lifecycle operations.
 *
 * Every method is server-only. A provider browser event is never payment proof:
 * retain the `completionContext` server-side and use completion/verification
 * methods from an authenticated merchant callback or return handler.
 */
export declare class PaymentService extends AbstractService {
    private _payHere;
    private _marxPay;
    private _onePay;
    private _koko;
    private _payPlus;
    private _webXPay;
    private _elements;
    /** PayHere advanced lifecycle operations. Server-only. */
    payHere(): PayHereService;
    /** PHP-contract alias for `payHere()`. */
    payhere(): PayHereService;
    /** MarxPay v4 server-side operations. */
    marxPay(): MarxPayService;
    /** PHP-contract alias for `marxPay()`. */
    marxpay(): MarxPayService;
    /** OnePay server-side status lookup. */
    onePay(): OnePayService;
    /** PHP-contract alias for `onePay()`. */
    onepay(): OnePayService;
    /** KOKO signed order reconciliation. */
    koko(): KokoService;
    /** PayPlus server-side status reconciliation. */
    payPlus(): PayPlusService;
    /** PHP-contract alias for `payPlus()`. */
    payplus(): PayPlusService;
    /** WebXPay Merchant API status lookup. */
    webXPay(): WebXPayService;
    /** PHP-contract alias for `webXPay()`. */
    webxpay(): WebXPayService;
    /** Secret-free server-rendered Payment Elements helpers. */
    elements(): PaymentElementsService;
    renderForm(mountId: string, options?: import('../payments/GatewayTypes.js').PaymentElementsOptions): string;
    /**
     * Render the payment-method mount. If availability was not supplied, it is
     * fetched from AvraAPI and embedded as browser-safe metadata only.
     */
    renderMethods(mountId: string, options?: import('../payments/GatewayTypes.js').PaymentElementsOptions, merchantDomain?: string): Promise<string>;
    /** Discover public payment methods currently usable by this project. */
    methods(merchantDomain?: string): Promise<PaymentMethod[]>;
    /** Returns only browser-safe Payment Elements availability metadata. */
    availability(merchantDomain?: string): Promise<PaymentAvailability>;
    /** Prepare a server-owned checkout session. Never expose its completion context. */
    createOrder(options: CreateOrderOptions | CreateOrderOptionsInput): Promise<PaymentSession>;
    /** Complete a callback/return from the merchant server only. */
    completePayment(options: PaymentCompletionOptions | PaymentCompletionOptionsInput): Promise<PaymentCompletionResult>;
    /** Verify a checkout or recurring callback on the merchant server. */
    verifyCallback(options: VerifyCallbackOptions | VerifyCallbackOptionsInput): Promise<VerificationResult>;
    /**
     * Verify a PayHere preapproval/authorization callback on the merchant server.
     * The artifact is non-serializable by design and must never reach a browser.
     */
    verifySensitiveCallback(options: SensitiveCallbackOptions | SensitiveCallbackOptionsInput): Promise<SensitiveVerificationResult>;
    private methodDiscoveryQuery;
    /**
     * Current AvraAPI payment discovery routes are GET endpoints. Some already
     * deployed gateway installations still expose the older POST-only contract;
     * retry that form only after an explicit 405 response. This preserves the
     * public GET contract while keeping server integrations migration-safe.
     */
    private discover;
    private methodDiscoveryPayload;
    private isLegacyPostOnlyDiscoveryRoute;
    private expectJson;
    private isRecord;
}
//# sourceMappingURL=PaymentService.d.ts.map