/**
 * Gateway-specific, server-only contracts for the Universal Payment Gateway.
 *
 * These classes intentionally mirror the PHP SDK's public payment contracts.
 * They contain no merchant credentials and must only be instantiated in
 * trusted backend code.
 */
import { CreateOrderOptions, type CreateOrderOptionsInput, GatewayEnvironment, type PaymentPayload, type PaymentCustomer, type PaymentUrls, PaymentSession } from './PaymentTypes.js';
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
export declare class AuthorizationOptions {
    readonly order: CreateOrderOptions;
    constructor(order: CreateOrderOptions | CreateOrderOptionsInput);
    toPayload(): PaymentPayload;
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
export declare class PreapprovalOptions {
    readonly orderId: string;
    readonly items: string;
    readonly currency: string;
    readonly customer: PaymentCustomer;
    readonly urls: PaymentUrls;
    readonly amount: string | null;
    readonly merchantDomain: string | null;
    constructor(input: PreapprovalOptionsInput);
    toPayload(): PaymentPayload;
    callbackAmount(): string;
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
export declare class RecurringOrderOptions {
    private readonly order;
    readonly recurrence: string;
    readonly duration: string;
    readonly startupFee: string | null;
    readonly recurringStartDate: string | null;
    readonly autoCancel: boolean | null;
    readonly maxRetries: number | null;
    readonly isRecoveryDue: boolean | null;
    constructor(input: RecurringOrderOptionsInput);
    toPayload(): PaymentPayload;
}
export interface MarxPayInitiatePaymentOptionsInput {
    readonly trId: string;
    readonly merchantRid: string;
    readonly gatewayEnvironment?: GatewayEnvironment | null;
}
export declare class MarxPayInitiatePaymentOptions {
    readonly trId: string;
    readonly merchantRid: string;
    readonly gatewayEnvironment: GatewayEnvironment | null;
    constructor(input: MarxPayInitiatePaymentOptionsInput);
    toPayload(): PaymentPayload;
}
export interface MarxPayReturnVerificationOptionsInput {
    readonly returnedMerchantRid: string;
    readonly returnedTrId: string;
    readonly expectedMerchantRid: string;
    readonly expectedTrId: string;
    readonly gatewayEnvironment?: GatewayEnvironment | null;
}
export declare class MarxPayReturnVerificationOptions {
    readonly returnedMerchantRid: string;
    readonly returnedTrId: string;
    readonly expectedMerchantRid: string;
    readonly expectedTrId: string;
    readonly gatewayEnvironment: GatewayEnvironment | null;
    constructor(input: MarxPayReturnVerificationOptionsInput);
    toPayload(): PaymentPayload;
}
export declare class MarxPayPaymentResult {
    readonly merchantRid: string;
    readonly trId: string;
    readonly paymentStatus: string;
    readonly providerStatus: string;
    readonly amount: string | null;
    readonly currency: string | null;
    readonly paymentMethod: string | null;
    readonly expiresAt: string | null;
    readonly requestId: string | null;
    constructor(merchantRid: string, trId: string, paymentStatus: string, providerStatus: string, amount: string | null, currency: string | null, paymentMethod: string | null, expiresAt: string | null, requestId: string | null);
    static fromData(data: PaymentPayload, requestId: string | null): MarxPayPaymentResult;
}
export declare class MarxPayReturnVerification {
    readonly verified: true;
    readonly merchantRid: string;
    readonly trId: string;
    readonly requestId: string | null;
    constructor(verified: true, merchantRid: string, trId: string, requestId: string | null);
    static fromData(data: PaymentPayload, requestId: string | null): MarxPayReturnVerification;
}
export declare class SubscriptionSummary {
    readonly subscriptionId: string | null;
    readonly orderId: string | null;
    readonly status: string;
    readonly amount: string | null;
    readonly currency: string | null;
    readonly recurrence: string | null;
    constructor(subscriptionId: string | null, orderId: string | null, status: string, amount: string | null, currency: string | null, recurrence: string | null);
    static fromData(data: PaymentPayload): SubscriptionSummary;
}
export declare class SubscriptionCommandResult {
    readonly accepted: boolean;
    readonly providerStatus: string;
    readonly subscriptionId: string;
    constructor(accepted: boolean, providerStatus: string, subscriptionId: string);
    static fromData(data: PaymentPayload): SubscriptionCommandResult;
}
export declare class KokoOrderView {
    readonly orderId: string;
    readonly gatewayReference: string;
    readonly providerStatus: string;
    readonly native: PaymentPayload;
    readonly requestId: string | null;
    constructor(orderId: string, gatewayReference: string, providerStatus: string, native: PaymentPayload, requestId: string | null);
    static fromData(data: PaymentPayload, requestId: string | null): KokoOrderView;
}
export declare class PayPlusStatus {
    readonly orderId: string;
    readonly providerStatus: string;
    readonly timestamp: string | null;
    readonly requestId: string | null;
    constructor(orderId: string, providerStatus: string, timestamp: string | null, requestId: string | null);
    static fromData(data: PaymentPayload, requestId: string | null): PayPlusStatus;
}
/** Exact signed PayPlus callback evidence for merchant-server completion only. */
export declare class PayPlusCallbackPayload {
    readonly rawBody: string;
    readonly authorization: string;
    constructor(rawBody: string, authorization: string);
    toPayload(): PaymentPayload;
}
/** Exact DirectPay callback evidence for merchant-server completion only. */
export declare class DirectPayCallbackPayload {
    readonly rawBody: string;
    readonly authorization: string;
    constructor(rawBody: string, authorization: string);
    toPayload(): PaymentPayload;
}
/** Untrusted Stripe browser return: AvraAPI retrieves the bound Checkout Session. */
export declare class StripeReturnPayload {
    readonly sessionId: string;
    constructor(sessionId: string);
    toPayload(): PaymentPayload;
}
/** Exact raw Stripe webhook evidence, Base64-wrapped only for JSON transport. */
export declare class StripeWebhookPayload {
    readonly rawBody: string;
    readonly stripeSignature: string;
    constructor(rawBody: string, stripeSignature: string);
    toPayload(): PaymentPayload;
}
/** Untrusted OnePay Dashboard callback: use only as a server-side completion trigger. */
export declare class OnePayCallbackPayload {
    private readonly callback;
    constructor(callback: PaymentPayload);
    toPayload(): PaymentPayload;
}
/** Untrusted OnePay browser return: use only as a server-side completion trigger. */
export declare class OnePayReturnPayload {
    private readonly query;
    constructor(query: PaymentPayload);
    toPayload(): PaymentPayload;
}
/** WebXPay browser return is untrusted until independently reconciled by AvraAPI. */
export declare class WebXPayReturnPayload {
    private readonly query;
    constructor(query: PaymentPayload);
    toPayload(): PaymentPayload;
}
export interface KokoCallbackPayloadInput {
    readonly orderId: string;
    readonly transactionId: string;
    readonly status: string;
    readonly description: string;
    readonly signature: string;
}
/** Exact KOKO notification fields. */
export declare class KokoCallbackPayload {
    readonly orderId: string;
    readonly transactionId: string;
    readonly status: string;
    readonly description: string;
    readonly signature: string;
    constructor(input: KokoCallbackPayloadInput);
    /** Build the exact callback contract from KOKO's posted form fields. */
    static fromForm(fields: Readonly<Record<string, unknown>>): KokoCallbackPayload;
    toPayload(): PaymentPayload;
}
export interface KokoReturnPayloadInput {
    readonly orderId: string;
    readonly transactionId?: string | null;
    readonly status?: string | null;
}
/** KOKO browser return: never use this as payment proof. */
export declare class KokoReturnPayload {
    readonly orderId: string;
    readonly transactionId: string | null;
    readonly status: string | null;
    constructor(input: KokoReturnPayloadInput);
    /** Build the unsigned browser-return contract from KOKO query parameters. */
    static fromQuery(query: Readonly<Record<string, unknown>>): KokoReturnPayload;
    toPayload(): PaymentPayload;
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
export declare class PaymentElementsRenderer {
    static renderForm(mountId: string, options?: PaymentElementsOptions): string;
    static renderMethods(mountId: string, options?: PaymentElementsOptions): string;
    private static render;
    private static cdnUrl;
    private static scriptUrl;
}
/** Render an auto-submitting redirect form only for a redirect_form session. */
export declare class RedirectFormRenderer {
    static render(session: PaymentSession, submitLabel?: string): string;
}
//# sourceMappingURL=GatewayTypes.d.ts.map