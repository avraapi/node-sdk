/**
 * @file src/ApixClient.ts
 *
 * APIX Node.js SDK — Main Client
 *
 * The primary entry point for all APIX API operations.
 * Instantiate once and reuse across your application.
 *
 * ── Quick Start ───────────────────────────────────────────────────────────────
 *
 *   import { ApixClient } from '@avraapi/apix-sdk';
 *
 *   const apix = new ApixClient({
 *     projectKey: process.env.APIX_PROJECT_KEY,
 *     apiSecret:  process.env.APIX_API_SECRET,
 *   });
 *
 *   // Or rely entirely on environment variables:
 *   const apix = new ApixClient();
 *   // Reads APIX_PROJECT_KEY, APIX_API_SECRET, APIX_ENV, APIX_BASE_URL
 *
 * ── Service Groups ────────────────────────────────────────────────────────────
 *
 *   apix.location()   — IP geolocation lookup
 *   apix.sms()        — SMS send / balance operations
 *   apix.utilities()  — QR codes, barcodes, PDF generation
 *
 * ── Provider Override (fluent) ────────────────────────────────────────────────
 *
 *   await apix.sms().withProvider('quicksend').sendSingle({ to: '...', message: '...' });
 *
 * ── Universal Call (escape hatch) ─────────────────────────────────────────────
 *
 *   // For endpoints not yet covered by a typed service method:
 *   const result = await apix.call('POST', 'payments/checkout', { amount: 2500 });
 *
 *   // Smart path normalization — all equivalent:
 *   apix.call('POST', 'sms/send',                                   payload);
 *   apix.call('POST', '/sms/send',                                  payload);
 *   apix.call('POST', '/api/v1/sms/send',                           payload);
 *   apix.call('POST', 'https://avraapi.com/api/v1/sms/send',        payload);
 *   apix.call('POST', 'http://localhost/api/v1/sms/send',           payload);
 *
 * @api
 */
import { Config, type ApixClientOptions } from './Config.js';
import { LocationService } from './services/LocationService.js';
import { SmsService } from './services/SmsService.js';
import { UtilitiesService } from './services/UtilitiesService.js';
import { ApiResponse } from './responses/ApiResponse.js';
import { BinaryResponse } from './responses/BinaryResponse.js';
export declare class ApixClient {
    /** Resolved, immutable configuration. Useful for debugging. */
    readonly config: Config;
    private readonly http;
    private _location;
    private _sms;
    private _utilities;
    /**
     * Create a new APIX client.
     *
     * @param options  Configuration overrides. Falls back to environment variables
     *                 when keys are omitted.
     *
     * @throws {Error} When `projectKey` or `apiSecret` cannot be resolved from
     *                 either the options object or environment variables.
     *
     * @example
     * ```ts
     * // Explicit config (e.g. in a multi-tenant app):
     * const apix = new ApixClient({
     *   projectKey: 'pk_live_...',
     *   apiSecret:  'sk_live_...',
     *   env:        'prod',
     * });
     *
     * // Local development against Laravel Sail:
     * const apix = new ApixClient({
     *   projectKey: process.env.APIX_PROJECT_KEY,
     *   apiSecret:  process.env.APIX_API_SECRET,
     *   env:        'dev',
     *   baseUrl:    'http://localhost/api/v1',
     * });
     *
     * // Rely entirely on environment variables:
     * const apix = new ApixClient();
     * ```
     */
    constructor(options?: ApixClientOptions);
    /**
     * Access the Location service group.
     *
     * Available operations:
     *   - `lookupIp({ ip })` → ApiResponse<GeoIpData>
     *
     * @example
     * ```ts
     * const geo = await apix.location().lookupIp({ ip: '112.134.205.126' });
     * console.log(geo.data.country);      // 'Sri Lanka'
     * console.log(geo.data.country_code); // 'LK'
     * ```
     */
    location(): LocationService;
    /**
     * Access the SMS service group.
     *
     * Available operations:
     *   - `sendSingle({ to, message })` → ApiResponse<SmsSendData>
     *   - `sendBulkSame({ recipients, message, checkCost? })` → ApiResponse<SmsSendData>
     *   - `sendBulkDifferent({ msgList })` → ApiResponse<SmsSendData>
     *   - `getBalance()` → ApiResponse<SmsBalanceData>
     *
     * @example
     * ```ts
     * await apix.sms().sendSingle({ to: '0771234567', message: 'Hello!' });
     * const balance = await apix.sms().getBalance();
     * console.log(balance.data.balance_formatted); // '1500'
     * ```
     */
    sms(): SmsService;
    /**
     * Access the Utilities service group.
     *
     * Available operations:
     *   - `generateQr({ data, format?, ... })` → BinaryResponse | ApiResponse
     *   - `generateBarcode({ data, type?, ... })` → BinaryResponse
     *   - `generatePdf({ html, responseType?, ... })` → BinaryResponse | ApiResponse
     *
     * @example
     * ```ts
     * const pdf = await apix.utilities().generatePdf({ html: '<h1>Hello</h1>' });
     * await (pdf as BinaryResponse).saveAs('./output/hello.pdf');
     * ```
     */
    utilities(): UtilitiesService;
    /**
     * Make a raw API call to any APIX endpoint.
     *
     * This is the escape hatch for endpoints not yet covered by a typed service
     * method. Uses the same smart path normalization as all service methods.
     *
     * Currently only 'POST' is supported (APIX gateway uses POST for all
     * operations). Pass other methods for future-proofing.
     *
     * @param method   HTTP method (case-insensitive). Only 'POST' dispatches.
     * @param path     Endpoint path in any supported format (see examples).
     * @param payload  JSON-serializable request body.
     *
     * @returns `ApiResponse` for JSON responses, `BinaryResponse` for binary.
     *
     * @throws {ApixError}
     * @throws {ApixNetworkError}
     * @throws {Error} For unsupported HTTP methods.
     *
     * @example
     * ```ts
     * // All of these are equivalent:
     * await apix.call('POST', 'location/lookup',                         { ip: '1.1.1.1' });
     * await apix.call('POST', '/location/lookup',                        { ip: '1.1.1.1' });
     * await apix.call('POST', '/api/v1/location/lookup',                 { ip: '1.1.1.1' });
     * await apix.call('POST', 'https://avraapi.com/api/v1/location/lookup', { ip: '1.1.1.1' });
     *
     * // Call a future endpoint not yet in the SDK:
     * const checkout = await apix.call('POST', 'payments/checkout', {
     *   amount:   2500,
     *   currency: 'LKR',
     * });
     * const response = checkout as ApiResponse;
     * console.log(response.data.checkout_url);
     * ```
     */
    call(method: string, path: string, payload?: Record<string, unknown>): Promise<ApiResponse | BinaryResponse>;
}
//# sourceMappingURL=ApixClient.d.ts.map