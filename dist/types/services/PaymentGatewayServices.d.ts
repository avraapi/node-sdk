/** Gateway-specific server-only Universal Payment Gateway services. */
import { AbstractService } from './AbstractService.js';
import { AuthorizationOptions, type KokoCallbackPayloadInput, KokoCallbackPayload, type KokoReturnPayloadInput, KokoReturnPayload, KokoOrderView, MarxPayInitiatePaymentOptions, type MarxPayInitiatePaymentOptionsInput, MarxPayPaymentResult, MarxPayReturnVerification, MarxPayReturnVerificationOptions, type MarxPayReturnVerificationOptionsInput, OnePayCallbackPayload, OnePayReturnPayload, type PayHereCaptureInput, type PayHereChargeInput, type PayHereRefundInput, type PayHereSubscriptionCommandInput, type PaymentElementsOptions, PayPlusStatus, PreapprovalOptions, type PreapprovalOptionsInput, RecurringOrderOptions, type RecurringOrderOptionsInput, SubscriptionCommandResult, SubscriptionSummary, WebXPayReturnPayload } from '../payments/GatewayTypes.js';
import { type CreateOrderOptionsInput, GatewayEnvironment, type PaymentPayload, PaymentSession } from '../payments/PaymentTypes.js';
/** PayHere advanced operations. Checkout creation remains on PaymentService.createOrder(). */
export declare class PayHereService extends AbstractService {
    private _retrieval;
    private _refunds;
    private _recurring;
    private _subscriptions;
    private _preapprovals;
    private _authorizations;
    private _charges;
    private _captures;
    retrieval(): PayHereRetrievalService;
    refunds(): PayHereRefundsService;
    recurring(): PayHereRecurringService;
    subscriptions(): PayHereSubscriptionService;
    preapprovals(): PayHerePreapprovalService;
    authorizations(): PayHereAuthorizationService;
    charges(): PayHereChargesService;
    captures(): PayHereCapturesService;
}
/** Secret-free Payment Elements markup helpers; they never receive SDK credentials. */
export declare class PaymentElementsService {
    renderForm(mountId: string, options?: PaymentElementsOptions): string;
    renderMethods(mountId: string, options?: PaymentElementsOptions): string;
}
export declare class PayHereRetrievalService extends AbstractService {
    /** Privacy-safe payment projections for one merchant order. */
    findByOrderId(orderId: string, gatewayEnvironment?: GatewayEnvironment | null): Promise<PaymentPayload[]>;
}
export declare class PayHereRefundsService extends AbstractService {
    /** Creates a full or partial PayHere refund. This is an irreversible provider action. */
    create(input: PayHereRefundInput): Promise<PaymentPayload>;
}
export declare class PayHereAuthorizationService extends AbstractService {
    /** Prepares a redirect authorization-hold session. */
    create(options: AuthorizationOptions | CreateOrderOptionsInput): Promise<PaymentSession>;
}
export declare class PayHereCapturesService extends AbstractService {
    /** Captures a previously authorized PayHere amount. This is irreversible. */
    create(input: PayHereCaptureInput): Promise<PaymentPayload>;
}
export declare class PayHerePreapprovalService extends AbstractService {
    create(options: PreapprovalOptions | PreapprovalOptionsInput): Promise<PaymentSession>;
}
export declare class PayHereRecurringService extends AbstractService {
    create(options: RecurringOrderOptions | RecurringOrderOptionsInput): Promise<PaymentSession>;
}
export declare class PayHereSubscriptionService extends AbstractService {
    all(gatewayEnvironment?: GatewayEnvironment | null): Promise<SubscriptionSummary[]>;
    find(subscriptionId: string, gatewayEnvironment?: GatewayEnvironment | null): Promise<SubscriptionSummary>;
    payments(subscriptionId: string, gatewayEnvironment?: GatewayEnvironment | null): Promise<PaymentPayload[]>;
    retry(input: PayHereSubscriptionCommandInput & {
        readonly confirmRetry: boolean;
    }): Promise<SubscriptionCommandResult>;
    cancel(input: PayHereSubscriptionCommandInput & {
        readonly confirmCancel: boolean;
    }): Promise<SubscriptionCommandResult>;
}
export declare class PayHereChargesService extends AbstractService {
    /** Charges a stored PayHere customer token. This is irreversible. */
    create(input: PayHereChargeInput): Promise<PaymentPayload>;
}
/** Server-only MarxPay v4 operations. */
export declare class MarxPayService extends AbstractService {
    verifyReturn(options: MarxPayReturnVerificationOptions | MarxPayReturnVerificationOptionsInput): Promise<MarxPayReturnVerification>;
    initiatePayment(options: MarxPayInitiatePaymentOptions | MarxPayInitiatePaymentOptionsInput): Promise<MarxPayPaymentResult>;
    retrieveOrderSummary(trId: string, merchantRid: string, gatewayEnvironment?: GatewayEnvironment | null): Promise<MarxPayPaymentResult>;
}
/** Server-only OnePay status lookup. */
export declare class OnePayService extends AbstractService {
    status(onePayTransactionId: string, gatewayEnvironment?: GatewayEnvironment | null): Promise<PaymentPayload>;
}
/** Server-only signed KOKO reconciliation. */
export declare class KokoService extends AbstractService {
    orderView(orderId: string, gatewayEnvironment?: GatewayEnvironment | null): Promise<KokoOrderView>;
}
/** Server-only PayPlus status reconciliation. Signed callbacks still use completePayment(). */
export declare class PayPlusService extends AbstractService {
    status(orderId: string, gatewayEnvironment?: GatewayEnvironment | null): Promise<PayPlusStatus>;
}
/** Server-only WebXPay Merchant API lookup. Browser returns are never payment proof. */
export declare class WebXPayService extends AbstractService {
    status(orderId: string, gatewayEnvironment?: GatewayEnvironment | null): Promise<PaymentPayload>;
}
export { KokoCallbackPayload, KokoReturnPayload, OnePayCallbackPayload, OnePayReturnPayload, WebXPayReturnPayload };
export type { KokoCallbackPayloadInput, KokoReturnPayloadInput };
//# sourceMappingURL=PaymentGatewayServices.d.ts.map