"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectPayCallbackPayload = exports.PayPlusCallbackPayload = exports.PayPlusStatus = exports.KokoOrderView = exports.SubscriptionCommandResult = exports.SubscriptionSummary = exports.MarxPayReturnVerification = exports.MarxPayPaymentResult = exports.MarxPayReturnVerificationOptions = exports.MarxPayInitiatePaymentOptions = exports.RecurringOrderOptions = exports.PreapprovalOptions = exports.AuthorizationOptions = exports.PaymentResponseValidationError = exports.SensitiveVerificationResult = exports.SensitiveMerchantArtifact = exports.VerificationResult = exports.PaymentCompletionResult = exports.PaymentAvailability = exports.PaymentSession = exports.SensitiveCallbackOptions = exports.VerifyCallbackOptions = exports.PaymentCompletionOptions = exports.PaymentResponseOptions = exports.CreateOrderOptions = exports.PaymentAvailabilityReason = exports.PaymentStatus = exports.CheckoutMode = exports.GatewayEnvironment = exports.GatewayCode = exports.PaymentService = exports.CurrencyService = exports.SecurityService = exports.UtilitiesService = exports.SmsService = exports.LocationService = exports.PaymentVerificationError = exports.PaymentProviderError = exports.PaymentConfigurationError = exports.PaymentAccessError = exports.ApixNetworkError = exports.ApixServiceUnavailableError = exports.ApixRateLimitError = exports.ApixValidationError = exports.ApixInsufficientFundsError = exports.ApixAuthenticationError = exports.ApixError = exports.BinaryResponse = exports.ApiResponse = exports.ApixClient = void 0;
exports.WebXPayService = exports.PayPlusService = exports.KokoService = exports.OnePayService = exports.MarxPayService = exports.PayHereChargesService = exports.PayHereSubscriptionService = exports.PayHereRecurringService = exports.PayHerePreapprovalService = exports.PayHereCapturesService = exports.PayHereAuthorizationService = exports.PayHereRefundsService = exports.PayHereRetrievalService = exports.PaymentElementsService = exports.PayHereService = exports.RedirectFormRenderer = exports.PaymentElementsRenderer = exports.WebXPayReturnPayload = exports.KokoReturnPayload = exports.KokoCallbackPayload = exports.OnePayReturnPayload = exports.OnePayCallbackPayload = exports.StripeWebhookPayload = exports.StripeReturnPayload = void 0;
// ── Client ────────────────────────────────────────────────────────────────────
var ApixClient_js_1 = require("./ApixClient.js");
Object.defineProperty(exports, "ApixClient", { enumerable: true, get: function () { return ApixClient_js_1.ApixClient; } });
// ── Responses ─────────────────────────────────────────────────────────────────
var ApiResponse_js_1 = require("./responses/ApiResponse.js");
Object.defineProperty(exports, "ApiResponse", { enumerable: true, get: function () { return ApiResponse_js_1.ApiResponse; } });
var BinaryResponse_js_1 = require("./responses/BinaryResponse.js");
Object.defineProperty(exports, "BinaryResponse", { enumerable: true, get: function () { return BinaryResponse_js_1.BinaryResponse; } });
// ── Errors ────────────────────────────────────────────────────────────────────
var ApixErrors_js_1 = require("./errors/ApixErrors.js");
Object.defineProperty(exports, "ApixError", { enumerable: true, get: function () { return ApixErrors_js_1.ApixError; } });
Object.defineProperty(exports, "ApixAuthenticationError", { enumerable: true, get: function () { return ApixErrors_js_1.ApixAuthenticationError; } });
Object.defineProperty(exports, "ApixInsufficientFundsError", { enumerable: true, get: function () { return ApixErrors_js_1.ApixInsufficientFundsError; } });
Object.defineProperty(exports, "ApixValidationError", { enumerable: true, get: function () { return ApixErrors_js_1.ApixValidationError; } });
Object.defineProperty(exports, "ApixRateLimitError", { enumerable: true, get: function () { return ApixErrors_js_1.ApixRateLimitError; } });
Object.defineProperty(exports, "ApixServiceUnavailableError", { enumerable: true, get: function () { return ApixErrors_js_1.ApixServiceUnavailableError; } });
Object.defineProperty(exports, "ApixNetworkError", { enumerable: true, get: function () { return ApixErrors_js_1.ApixNetworkError; } });
Object.defineProperty(exports, "PaymentAccessError", { enumerable: true, get: function () { return ApixErrors_js_1.PaymentAccessError; } });
Object.defineProperty(exports, "PaymentConfigurationError", { enumerable: true, get: function () { return ApixErrors_js_1.PaymentConfigurationError; } });
Object.defineProperty(exports, "PaymentProviderError", { enumerable: true, get: function () { return ApixErrors_js_1.PaymentProviderError; } });
Object.defineProperty(exports, "PaymentVerificationError", { enumerable: true, get: function () { return ApixErrors_js_1.PaymentVerificationError; } });
// ── Services ──────────────────────────────────────────────────────────────────
var LocationService_js_1 = require("./services/LocationService.js");
Object.defineProperty(exports, "LocationService", { enumerable: true, get: function () { return LocationService_js_1.LocationService; } });
var SmsService_js_1 = require("./services/SmsService.js");
Object.defineProperty(exports, "SmsService", { enumerable: true, get: function () { return SmsService_js_1.SmsService; } });
var UtilitiesService_js_1 = require("./services/UtilitiesService.js");
Object.defineProperty(exports, "UtilitiesService", { enumerable: true, get: function () { return UtilitiesService_js_1.UtilitiesService; } });
var SecurityService_js_1 = require("./services/SecurityService.js");
Object.defineProperty(exports, "SecurityService", { enumerable: true, get: function () { return SecurityService_js_1.SecurityService; } });
var CurrencyService_js_1 = require("./services/CurrencyService.js");
Object.defineProperty(exports, "CurrencyService", { enumerable: true, get: function () { return CurrencyService_js_1.CurrencyService; } });
var PaymentService_js_1 = require("./services/PaymentService.js");
Object.defineProperty(exports, "PaymentService", { enumerable: true, get: function () { return PaymentService_js_1.PaymentService; } });
// ── Universal Payment Gateway (server-only) ──────────────────────────────────
var PaymentTypes_js_1 = require("./payments/PaymentTypes.js");
Object.defineProperty(exports, "GatewayCode", { enumerable: true, get: function () { return PaymentTypes_js_1.GatewayCode; } });
Object.defineProperty(exports, "GatewayEnvironment", { enumerable: true, get: function () { return PaymentTypes_js_1.GatewayEnvironment; } });
Object.defineProperty(exports, "CheckoutMode", { enumerable: true, get: function () { return PaymentTypes_js_1.CheckoutMode; } });
Object.defineProperty(exports, "PaymentStatus", { enumerable: true, get: function () { return PaymentTypes_js_1.PaymentStatus; } });
Object.defineProperty(exports, "PaymentAvailabilityReason", { enumerable: true, get: function () { return PaymentTypes_js_1.PaymentAvailabilityReason; } });
Object.defineProperty(exports, "CreateOrderOptions", { enumerable: true, get: function () { return PaymentTypes_js_1.CreateOrderOptions; } });
Object.defineProperty(exports, "PaymentResponseOptions", { enumerable: true, get: function () { return PaymentTypes_js_1.PaymentResponseOptions; } });
Object.defineProperty(exports, "PaymentCompletionOptions", { enumerable: true, get: function () { return PaymentTypes_js_1.PaymentCompletionOptions; } });
Object.defineProperty(exports, "VerifyCallbackOptions", { enumerable: true, get: function () { return PaymentTypes_js_1.VerifyCallbackOptions; } });
Object.defineProperty(exports, "SensitiveCallbackOptions", { enumerable: true, get: function () { return PaymentTypes_js_1.SensitiveCallbackOptions; } });
Object.defineProperty(exports, "PaymentSession", { enumerable: true, get: function () { return PaymentTypes_js_1.PaymentSession; } });
Object.defineProperty(exports, "PaymentAvailability", { enumerable: true, get: function () { return PaymentTypes_js_1.PaymentAvailability; } });
Object.defineProperty(exports, "PaymentCompletionResult", { enumerable: true, get: function () { return PaymentTypes_js_1.PaymentCompletionResult; } });
Object.defineProperty(exports, "VerificationResult", { enumerable: true, get: function () { return PaymentTypes_js_1.VerificationResult; } });
Object.defineProperty(exports, "SensitiveMerchantArtifact", { enumerable: true, get: function () { return PaymentTypes_js_1.SensitiveMerchantArtifact; } });
Object.defineProperty(exports, "SensitiveVerificationResult", { enumerable: true, get: function () { return PaymentTypes_js_1.SensitiveVerificationResult; } });
Object.defineProperty(exports, "PaymentResponseValidationError", { enumerable: true, get: function () { return PaymentTypes_js_1.PaymentResponseValidationError; } });
var GatewayTypes_js_1 = require("./payments/GatewayTypes.js");
Object.defineProperty(exports, "AuthorizationOptions", { enumerable: true, get: function () { return GatewayTypes_js_1.AuthorizationOptions; } });
Object.defineProperty(exports, "PreapprovalOptions", { enumerable: true, get: function () { return GatewayTypes_js_1.PreapprovalOptions; } });
Object.defineProperty(exports, "RecurringOrderOptions", { enumerable: true, get: function () { return GatewayTypes_js_1.RecurringOrderOptions; } });
Object.defineProperty(exports, "MarxPayInitiatePaymentOptions", { enumerable: true, get: function () { return GatewayTypes_js_1.MarxPayInitiatePaymentOptions; } });
Object.defineProperty(exports, "MarxPayReturnVerificationOptions", { enumerable: true, get: function () { return GatewayTypes_js_1.MarxPayReturnVerificationOptions; } });
Object.defineProperty(exports, "MarxPayPaymentResult", { enumerable: true, get: function () { return GatewayTypes_js_1.MarxPayPaymentResult; } });
Object.defineProperty(exports, "MarxPayReturnVerification", { enumerable: true, get: function () { return GatewayTypes_js_1.MarxPayReturnVerification; } });
Object.defineProperty(exports, "SubscriptionSummary", { enumerable: true, get: function () { return GatewayTypes_js_1.SubscriptionSummary; } });
Object.defineProperty(exports, "SubscriptionCommandResult", { enumerable: true, get: function () { return GatewayTypes_js_1.SubscriptionCommandResult; } });
Object.defineProperty(exports, "KokoOrderView", { enumerable: true, get: function () { return GatewayTypes_js_1.KokoOrderView; } });
Object.defineProperty(exports, "PayPlusStatus", { enumerable: true, get: function () { return GatewayTypes_js_1.PayPlusStatus; } });
Object.defineProperty(exports, "PayPlusCallbackPayload", { enumerable: true, get: function () { return GatewayTypes_js_1.PayPlusCallbackPayload; } });
Object.defineProperty(exports, "DirectPayCallbackPayload", { enumerable: true, get: function () { return GatewayTypes_js_1.DirectPayCallbackPayload; } });
Object.defineProperty(exports, "StripeReturnPayload", { enumerable: true, get: function () { return GatewayTypes_js_1.StripeReturnPayload; } });
Object.defineProperty(exports, "StripeWebhookPayload", { enumerable: true, get: function () { return GatewayTypes_js_1.StripeWebhookPayload; } });
Object.defineProperty(exports, "OnePayCallbackPayload", { enumerable: true, get: function () { return GatewayTypes_js_1.OnePayCallbackPayload; } });
Object.defineProperty(exports, "OnePayReturnPayload", { enumerable: true, get: function () { return GatewayTypes_js_1.OnePayReturnPayload; } });
Object.defineProperty(exports, "KokoCallbackPayload", { enumerable: true, get: function () { return GatewayTypes_js_1.KokoCallbackPayload; } });
Object.defineProperty(exports, "KokoReturnPayload", { enumerable: true, get: function () { return GatewayTypes_js_1.KokoReturnPayload; } });
Object.defineProperty(exports, "WebXPayReturnPayload", { enumerable: true, get: function () { return GatewayTypes_js_1.WebXPayReturnPayload; } });
Object.defineProperty(exports, "PaymentElementsRenderer", { enumerable: true, get: function () { return GatewayTypes_js_1.PaymentElementsRenderer; } });
Object.defineProperty(exports, "RedirectFormRenderer", { enumerable: true, get: function () { return GatewayTypes_js_1.RedirectFormRenderer; } });
var PaymentGatewayServices_js_1 = require("./services/PaymentGatewayServices.js");
Object.defineProperty(exports, "PayHereService", { enumerable: true, get: function () { return PaymentGatewayServices_js_1.PayHereService; } });
Object.defineProperty(exports, "PaymentElementsService", { enumerable: true, get: function () { return PaymentGatewayServices_js_1.PaymentElementsService; } });
Object.defineProperty(exports, "PayHereRetrievalService", { enumerable: true, get: function () { return PaymentGatewayServices_js_1.PayHereRetrievalService; } });
Object.defineProperty(exports, "PayHereRefundsService", { enumerable: true, get: function () { return PaymentGatewayServices_js_1.PayHereRefundsService; } });
Object.defineProperty(exports, "PayHereAuthorizationService", { enumerable: true, get: function () { return PaymentGatewayServices_js_1.PayHereAuthorizationService; } });
Object.defineProperty(exports, "PayHereCapturesService", { enumerable: true, get: function () { return PaymentGatewayServices_js_1.PayHereCapturesService; } });
Object.defineProperty(exports, "PayHerePreapprovalService", { enumerable: true, get: function () { return PaymentGatewayServices_js_1.PayHerePreapprovalService; } });
Object.defineProperty(exports, "PayHereRecurringService", { enumerable: true, get: function () { return PaymentGatewayServices_js_1.PayHereRecurringService; } });
Object.defineProperty(exports, "PayHereSubscriptionService", { enumerable: true, get: function () { return PaymentGatewayServices_js_1.PayHereSubscriptionService; } });
Object.defineProperty(exports, "PayHereChargesService", { enumerable: true, get: function () { return PaymentGatewayServices_js_1.PayHereChargesService; } });
Object.defineProperty(exports, "MarxPayService", { enumerable: true, get: function () { return PaymentGatewayServices_js_1.MarxPayService; } });
Object.defineProperty(exports, "OnePayService", { enumerable: true, get: function () { return PaymentGatewayServices_js_1.OnePayService; } });
Object.defineProperty(exports, "KokoService", { enumerable: true, get: function () { return PaymentGatewayServices_js_1.KokoService; } });
Object.defineProperty(exports, "PayPlusService", { enumerable: true, get: function () { return PaymentGatewayServices_js_1.PayPlusService; } });
Object.defineProperty(exports, "WebXPayService", { enumerable: true, get: function () { return PaymentGatewayServices_js_1.WebXPayService; } });
//# sourceMappingURL=index.js.map