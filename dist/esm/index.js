/**
 * @file src/index.ts
 *
 * @avraapi/node-sdk — Official AvraAPI Node.js SDK
 *
 * Public surface area (everything a consumer can import):
 *
 *   Client:
 *     ApixClient          — Main entry point
 *     ApixClientOptions   — Constructor options interface
 *
 *   Responses:
 *     ApiResponse         — Wraps successful JSON responses
 *     BinaryResponse      — Wraps binary (image/pdf) responses
 *
 *   Errors:
 *     ApixError                    — Base (catch all APIX errors)
 *     ApixAuthenticationError      — HTTP 401
 *     ApixInsufficientFundsError   — HTTP 402
 *     ApixValidationError          — HTTP 422 + validationErrors
 *     ApixRateLimitError           — HTTP 429
 *     ApixServiceUnavailableError  — HTTP 503
 *     ApixNetworkError             — Transport failure (no HTTP response)
 *
 *   Services (for instanceof checks / type narrowing):
 *     LocationService
 *     SmsService
 *     UtilitiesService
 *     SecurityService
 *     CurrencyService
 *
 *   Types (all parameter + response interfaces):
 *     LookupIpParams, GeoIpData
 *     SendSingleParams, SendBulkSameParams, SendBulkDifferentParams
 *     SmsRecipientMessage, SmsSendData, SmsBalanceData
 *     GenerateQrParams, QrFormat, QrBase64Data
 *     GenerateBarcodeParams, BarcodeType, BarcodeFormat
 *     GeneratePdfParams, GeneratePdfFromBase64Params, PdfPageSize, PdfOrientation
 *     PdfResponseType, PdfMargins, PdfBase64Data
 *     CheckVpnParams, VpnShieldData
 *     CheckBurnerEmailParams, BurnerEmailData
 *     CurrencyCodeEntry, CurrencyCodesData, CurrencyLatestRatesData
 *     CurrencyPairRateData, CurrencyConvertData
 *
 * Usage:
 *   import { ApixClient, ApixValidationError, BinaryResponse } from '@avraapi/node-sdk';
 */
// ── Client ────────────────────────────────────────────────────────────────────
export { ApixClient } from './ApixClient.js';
// ── Responses ─────────────────────────────────────────────────────────────────
export { ApiResponse } from './responses/ApiResponse.js';
export { BinaryResponse } from './responses/BinaryResponse.js';
// ── Errors ────────────────────────────────────────────────────────────────────
export { ApixError, ApixAuthenticationError, ApixInsufficientFundsError, ApixValidationError, ApixRateLimitError, ApixServiceUnavailableError, ApixNetworkError, PaymentAccessError, PaymentConfigurationError, PaymentProviderError, PaymentVerificationError, } from './errors/ApixErrors.js';
// ── Services ──────────────────────────────────────────────────────────────────
export { LocationService } from './services/LocationService.js';
export { SmsService } from './services/SmsService.js';
export { UtilitiesService } from './services/UtilitiesService.js';
export { SecurityService } from './services/SecurityService.js';
export { CurrencyService } from './services/CurrencyService.js';
export { PaymentService } from './services/PaymentService.js';
// ── Universal Payment Gateway (server-only) ──────────────────────────────────
export { GatewayCode, GatewayEnvironment, CheckoutMode, PaymentStatus, PaymentAvailabilityReason, CreateOrderOptions, PaymentResponseOptions, PaymentCompletionOptions, VerifyCallbackOptions, SensitiveCallbackOptions, PaymentSession, PaymentAvailability, PaymentCompletionResult, VerificationResult, SensitiveMerchantArtifact, SensitiveVerificationResult, PaymentResponseValidationError, } from './payments/PaymentTypes.js';
export { AuthorizationOptions, PreapprovalOptions, RecurringOrderOptions, MarxPayInitiatePaymentOptions, MarxPayReturnVerificationOptions, MarxPayPaymentResult, MarxPayReturnVerification, SubscriptionSummary, SubscriptionCommandResult, KokoOrderView, PayPlusStatus, PayPlusCallbackPayload, DirectPayCallbackPayload, StripeReturnPayload, StripeWebhookPayload, OnePayCallbackPayload, OnePayReturnPayload, KokoCallbackPayload, KokoReturnPayload, WebXPayReturnPayload, PaymentElementsRenderer, RedirectFormRenderer, } from './payments/GatewayTypes.js';
export { PayHereService, PaymentElementsService, PayHereRetrievalService, PayHereRefundsService, PayHereAuthorizationService, PayHereCapturesService, PayHerePreapprovalService, PayHereRecurringService, PayHereSubscriptionService, PayHereChargesService, MarxPayService, OnePayService, KokoService, PayPlusService, WebXPayService, } from './services/PaymentGatewayServices.js';
//# sourceMappingURL=index.js.map