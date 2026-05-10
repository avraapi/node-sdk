/**
 * @file src/index.ts
 *
 * @avraapi/apix-sdk — Official APIX Node.js SDK
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
 *   import { ApixClient, ApixValidationError, BinaryResponse } from '@avraapi/apix-sdk';
 */
export { ApixClient } from './ApixClient.js';
export type { ApixClientOptions } from './Config.js';
export { ApiResponse } from './responses/ApiResponse.js';
export { BinaryResponse } from './responses/BinaryResponse.js';
export type { ApixRawEnvelope } from './responses/ApiResponse.js';
export { ApixError, ApixAuthenticationError, ApixInsufficientFundsError, ApixValidationError, ApixRateLimitError, ApixServiceUnavailableError, ApixNetworkError, } from './errors/ApixErrors.js';
export type { ApixErrorPayload } from './errors/ApixErrors.js';
export { LocationService } from './services/LocationService.js';
export { SmsService } from './services/SmsService.js';
export { UtilitiesService } from './services/UtilitiesService.js';
export { SecurityService } from './services/SecurityService.js';
export { CurrencyService } from './services/CurrencyService.js';
export type { LookupIpParams, GeoIpData, GeoIpMeta, } from './services/LocationService.js';
export type { SendSingleParams, SendBulkSameParams, SendBulkDifferentParams, SmsRecipientMessage, SmsSendData, SmsBalanceData, } from './services/SmsService.js';
export type { GenerateQrParams, QrFormat, QrBase64Data, GenerateBarcodeParams, BarcodeType, BarcodeFormat, GeneratePdfParams, GeneratePdfFromBase64Params, PdfPageSize, PdfOrientation, PdfResponseType, PdfMargins, PdfBase64Data, } from './services/UtilitiesService.js';
export type { CheckVpnParams, CheckBurnerEmailParams, VpnShieldData, BurnerEmailData, } from './services/SecurityService.js';
export type { CurrencyCodeEntry, CurrencyCodesData, CurrencyLatestRatesData, CurrencyPairRateData, CurrencyConvertData, } from './services/CurrencyService.js';
//# sourceMappingURL=index.d.ts.map