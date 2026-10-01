/**
 * Typed, server-only Universal Payment Gateway contracts.
 *
 * These values mirror the public PHP SDK contract. They deliberately model
 * only transport-safe data; project credentials, Vault values, and provider
 * secrets are never part of a payment result.
 */
export declare enum GatewayCode {
    PayHere = "payhere",
    MarxPay = "marxpay",
    DirectPay = "directpay",
    PayPlus = "payplus",
    WebXPay = "webxpay",
    Koko = "koko",
    OnePay = "onepay",
    Stripe = "stripe"
}
export declare enum GatewayEnvironment {
    Sandbox = "sandbox",
    Production = "production"
}
export declare enum CheckoutMode {
    Redirect = "redirect",
    Overlay = "overlay",
    /** @deprecated New requests use `CheckoutMode.Redirect`. */
    HostedSession = "hosted_session",
    Embedded = "embedded"
}
export declare enum PaymentStatus {
    Succeeded = "succeeded",
    Pending = "pending",
    Failed = "failed",
    Cancelled = "cancelled",
    Unknown = "unknown"
}
export declare enum PaymentAvailabilityReason {
    UpgEntitlementInactive = "upg_entitlement_inactive",
    UpgGatewayNotEntitled = "upg_gateway_not_entitled",
    PaymentConfigurationNotAvailable = "payment_configuration_not_available",
    ProjectPaused = "project_paused",
    Unknown = "unknown"
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
export declare class CreateOrderOptions {
    readonly gateway: GatewayCode;
    readonly mode: CheckoutMode;
    readonly orderId: string;
    readonly items: string;
    readonly amount: string;
    readonly currency: string;
    readonly customer: PaymentCustomer;
    readonly urls: PaymentUrls;
    readonly merchantDomain: string | null;
    readonly providerOptions: PaymentProviderOptions;
    /** Explicit per-order override; the process configuration is resolved when serializing. */
    readonly gatewayEnvironment: GatewayEnvironment | null;
    constructor(input: CreateOrderOptionsInput);
    toPayload(): PaymentPayload;
    private static normalizeCustomer;
}
/** Chooses the vaulted gateway profile; this is separate from `APIX_ENV`. */
export declare namespace GatewayEnvironment {
    function configuredFor(gateway: GatewayCode, explicit?: GatewayEnvironment | null | undefined): GatewayEnvironment | null;
}
export interface PaymentResponseOptionsInput {
    readonly mode?: PaymentResponseMode;
    readonly include?: readonly string[];
}
/** Controls the merchant-server response shape for payment completion. */
export declare class PaymentResponseOptions {
    readonly mode: PaymentResponseMode;
    readonly include: readonly string[];
    constructor(input?: PaymentResponseOptionsInput);
    static short(): PaymentResponseOptions;
    static full(): PaymentResponseOptions;
    static include(paths: readonly string[]): PaymentResponseOptions;
    toPayload(): PaymentPayload;
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
export declare class PaymentCompletionOptions {
    readonly gateway: GatewayCode;
    readonly completionContext: string;
    readonly payload: PaymentPayload;
    readonly response: PaymentResponseOptions;
    readonly reconcileProvider: boolean;
    constructor(input: PaymentCompletionOptionsInput);
    toPayload(): PaymentPayload;
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
export declare class VerifyCallbackOptions {
    readonly gateway: GatewayCode;
    readonly payload: PaymentCallbackPayload;
    readonly orderId: string;
    readonly amount: string;
    readonly currency: string;
    readonly flow: 'checkout' | 'recurring';
    readonly startupFee: string | null;
    constructor(input: VerifyCallbackOptionsInput);
    toPayload(): PaymentPayload;
}
export interface SensitiveCallbackOptionsInput {
    readonly flow: 'preapproval' | 'authorization';
    readonly payload: PaymentCallbackPayload;
    readonly orderId: string;
    readonly amount: string;
    readonly currency: string;
}
/** Callback verification whose returned artifact must remain on the server. */
export declare class SensitiveCallbackOptions {
    readonly flow: 'preapproval' | 'authorization';
    readonly payload: PaymentCallbackPayload;
    readonly orderId: string;
    readonly amount: string;
    readonly currency: string;
    constructor(input: SensitiveCallbackOptionsInput);
    toPayload(): PaymentPayload;
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
export declare class PaymentSession {
    readonly gateway: GatewayCode;
    readonly mode: CheckoutMode;
    readonly status: string;
    readonly expiresAt: string | null;
    readonly checkout: PaymentPayload;
    readonly requestId: string;
    readonly flow: string;
    readonly binding: PaymentPayload;
    readonly verification: PaymentPayload;
    /** Never send this signed value to a browser. Persist it with the pending order. */
    readonly completionContext: string | null;
    private constructor();
    static fromData(data: PaymentSessionData, requestId: string): PaymentSession;
}
export type PaymentMethodAvailability = PaymentPayload & {
    readonly gateway: string;
    readonly available: boolean;
};
/** Public, browser-safe availability preflight result for Payment Elements. */
export declare class PaymentAvailability {
    readonly ready: boolean;
    readonly reason: PaymentAvailabilityReason | null;
    readonly message: string | null;
    readonly methods: readonly PaymentMethodAvailability[];
    readonly requestId: string | null;
    private constructor();
    static fromData(data: PaymentPayload, requestId?: string | null): PaymentAvailability;
    isReady(): boolean;
    toElementsPayload(): {
        ready: boolean;
        reason: string | null;
        message: string | null;
        methods: PaymentMethodAvailability[];
    };
    private static methodFromData;
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
export declare class PaymentCompletionResult {
    readonly gateway: GatewayCode;
    readonly verified: boolean;
    readonly paymentStatus: PaymentStatus;
    readonly providerStatus: string;
    readonly orderId: string | null;
    readonly gatewayReference: string | null;
    readonly amount: string | null;
    readonly currency: string | null;
    readonly requestId: string;
    readonly nativeOperations: PaymentPayload;
    readonly include: PaymentPayload;
    readonly reconciliation: PaymentPayload;
    private constructor();
    static fromData(data: PaymentCompletionResultData, requestId: string): PaymentCompletionResult;
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
export declare class VerificationResult {
    readonly verified: boolean;
    readonly paymentStatus: PaymentStatus;
    readonly providerStatus: string;
    readonly orderId: string;
    readonly gatewayReference: string | null;
    readonly amount: string;
    readonly currency: string;
    readonly requestId: string;
    readonly flow: string;
    readonly subscription: Record<string, string | null> | null;
    private constructor();
    static fromData(data: VerificationResultData, requestId: string): VerificationResult;
}
/** Sensitive token returned only by PayHere server-side verification. */
export declare class SensitiveMerchantArtifact {
    #private;
    readonly kind: string;
    constructor(kind: string, value: string);
    /** Persist this only in the merchant's secure vault, or delete it. */
    get value(): string;
    /** Prevent accidental JSON serialization into logs, caches, or responses. */
    toJSON(): never;
}
export declare class SensitiveVerificationResult {
    readonly verification: VerificationResult;
    readonly artifact: SensitiveMerchantArtifact;
    private constructor();
    static fromData(data: PaymentPayload, requestId: string): SensitiveVerificationResult;
}
/** An invalid payment success payload is a protocol failure, not proof of payment. */
export declare class PaymentResponseValidationError extends Error {
    constructor(message: string);
}
//# sourceMappingURL=PaymentTypes.d.ts.map