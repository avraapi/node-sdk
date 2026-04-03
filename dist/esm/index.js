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
 *
 *   Types (all parameter + response interfaces):
 *     LookupIpParams, GeoIpData
 *     SendSingleParams, SendBulkSameParams, SendBulkDifferentParams
 *     SmsRecipientMessage, SmsSendData, SmsBalanceData
 *     GenerateQrParams, QrFormat, QrBase64Data
 *     GenerateBarcodeParams, BarcodeType, BarcodeFormat
 *     GeneratePdfParams, PdfPageSize, PdfOrientation, PdfResponseType
 *     PdfMargins, PdfBase64Data
 *
 * Usage:
 *   import { ApixClient, ApixValidationError, BinaryResponse } from '@avraapi/apix-sdk';
 */
// ── Client ────────────────────────────────────────────────────────────────────
export { ApixClient } from './ApixClient.js';
// ── Responses ─────────────────────────────────────────────────────────────────
export { ApiResponse } from './responses/ApiResponse.js';
export { BinaryResponse } from './responses/BinaryResponse.js';
// ── Errors ────────────────────────────────────────────────────────────────────
export { ApixError, ApixAuthenticationError, ApixInsufficientFundsError, ApixValidationError, ApixRateLimitError, ApixServiceUnavailableError, ApixNetworkError, } from './errors/ApixErrors.js';
// ── Services ──────────────────────────────────────────────────────────────────
export { LocationService } from './services/LocationService.js';
export { SmsService } from './services/SmsService.js';
export { UtilitiesService } from './services/UtilitiesService.js';
//# sourceMappingURL=index.js.map