/**
 * @file src/services/UtilitiesService.ts
 *
 * Utilities Service — QR code, barcode, and PDF generation.
 *
 * Maps to the OpenAPI `Utilities` tag.
 * Endpoint prefix: /utilities
 *
 * Response types depend on the `format` / `responseType` field:
 *   'png' | 'svg'  → BinaryResponse (image Buffer)
 *   'base64'       → ApiResponse    (JSON with data_uri or base64 string)
 *   'binary'       → BinaryResponse (PDF Buffer)
 *
 * @see https://avraapi.com/docs#tag/Utilities
 */
import { AbstractService } from './AbstractService.js';
import { ApiResponse } from '../responses/ApiResponse.js';
import { BinaryResponse } from '../responses/BinaryResponse.js';
export type QrFormat = 'png' | 'svg' | 'base64';
export interface GenerateQrParams {
    /** Text, URL, or BEGIN:VCARD payload to encode. */
    readonly data: string;
    /**
     * Output format.
     * - 'png'    → BinaryResponse (PNG image bytes)
     * - 'svg'    → BinaryResponse (SVG text bytes)
     * - 'base64' → ApiResponse   (JSON with `data_uri`)
     * @default 'png'
     */
    readonly format?: QrFormat;
    /** Width and height in pixels (50–2000). @default 300 */
    readonly size?: number;
    /** 6-digit hex color for dark modules (with or without #). e.g. '1a56db' */
    readonly foregroundColor?: string;
    /** 6-digit hex color for QR background. e.g. 'ffffff' */
    readonly backgroundColor?: string;
    /** Publicly reachable logo URL to embed at center. */
    readonly logoUrl?: string;
    /** Logo size as % of the QR image (5–40). */
    readonly logoSizePercent?: number;
    /** Suppress payload storage in observability logs. @default false */
    readonly privacyMode?: boolean;
}
export interface QrBase64Data {
    readonly format: 'base64';
    readonly data_uri: string;
}
export type BarcodeType = 'C128' | 'C128A' | 'C128B' | 'C128C' | 'EAN13' | 'EAN8' | 'UPCA' | 'UPCE' | 'C39' | 'C39+' | 'I25' | 'ITF14' | 'MSI' | 'POSTNET';
export type BarcodeFormat = 'png' | 'svg';
export interface GenerateBarcodeParams {
    /** Data to encode (max 80 chars). Some types impose strict character requirements. */
    readonly data: string;
    /**
     * Barcode symbology.
     * @default 'C128'
     */
    readonly type?: BarcodeType;
    /**
     * Output format. Always binary — barcode endpoint does not support base64.
     * @default 'png'
     */
    readonly format?: BarcodeFormat;
    /** Barcode height in pixels (20–300). */
    readonly height?: number;
    /** Horizontal bar width multiplier (1–4). */
    readonly widthFactor?: number;
    /** Suppress payload storage in observability logs. @default false */
    readonly privacyMode?: boolean;
}
export type PdfPageSize = 'A4' | 'Letter' | 'Legal';
export type PdfOrientation = 'portrait' | 'landscape';
export type PdfResponseType = 'binary' | 'base64';
/** Page margins in millimetres — PdfMargins schema. */
export interface PdfMargins {
    readonly top?: number;
    readonly right?: number;
    readonly bottom?: number;
    readonly left?: number;
}
export interface GeneratePdfParams {
    /**
     * HTML content to convert (max 512 KB after decoding).
     * Full <!DOCTYPE html> documents and plain fragments are both accepted.
     * When `isBase64` is true, this must be a Base64-encoded HTML string.
     */
    readonly html: string;
    /**
     * Set to `true` if the `html` field contains a Base64-encoded HTML string.
     * The server decodes the content before validation and rendering.
     * Recommended for complex templates with quotes, newlines, and special
     * characters to avoid JSON escaping issues.
     * @default false
     */
    readonly isBase64?: boolean;
    /**
     * Response mode.
     * - 'binary' → BinaryResponse (raw PDF bytes, use saveAs() or getBuffer())
     * - 'base64' → ApiResponse   (JSON with base64-encoded PDF in `data.data`)
     * @default 'binary'
     */
    readonly responseType?: PdfResponseType;
    /**
     * Target paper size.
     * @default 'A4'
     */
    readonly pageSize?: PdfPageSize;
    /**
     * Page orientation.
     * @default 'portrait'
     */
    readonly orientation?: PdfOrientation;
    /** Custom page margins in millimetres. */
    readonly margins?: PdfMargins;
    /**
     * When true, the raw HTML content and PDF metadata are excluded from
     * api_payload_logs. Use for sensitive documents (invoices, contracts, PII).
     * @default false
     */
    readonly privacyMode?: boolean;
}
/** Parameters for the generatePdfFromBase64() convenience method. */
export interface GeneratePdfFromBase64Params {
    /**
     * Raw HTML content (NOT pre-encoded). The SDK encodes it automatically.
     * Full documents and plain fragments are both accepted.
     */
    readonly html: string;
    /** @default 'binary' */
    readonly responseType?: PdfResponseType;
    /** @default 'A4' */
    readonly pageSize?: PdfPageSize;
    /** @default 'portrait' */
    readonly orientation?: PdfOrientation;
    /** Custom page margins in millimetres. */
    readonly margins?: PdfMargins;
    /** Suppress payload storage in observability logs. @default false */
    readonly privacyMode?: boolean;
}
export interface PdfBase64Data {
    readonly format: 'base64';
    readonly media_type: 'application/pdf';
    readonly data: string;
}
export declare class UtilitiesService extends AbstractService {
    /**
     * Generate a QR code from any text, URL, or vCard payload.
     *
     * Wraps: POST /utilities/qr/generate
     * Provider: apix_qr
     *
     * @returns
     *   - `BinaryResponse` when `format` is 'png' or 'svg'.
     *     Use `await response.saveAs('./qr.png')` or `response.getBuffer()`.
     *   - `ApiResponse<QrBase64Data>` when `format` is 'base64'.
     *     Access the data URI via `response.data.data_uri`.
     *
     * @throws {ApixValidationError}
     * @throws {ApixAuthenticationError}
     * @throws {ApixInsufficientFundsError}
     * @throws {ApixRateLimitError}
     * @throws {ApixError}
     * @throws {ApixNetworkError}
     *
     * @example
     * ```ts
     * // Binary PNG — save to disk:
     * const qr = await apix.utilities().generateQr({ data: 'https://avraapi.com' });
     * await (qr as BinaryResponse).saveAs('./output/qr.png');
     *
     * // Styled QR with logo:
     * const branded = await apix.utilities().generateQr({
     *   data:            'https://avraapi.com',
     *   format:          'png',
     *   size:            400,
     *   foregroundColor: '1a56db',
     *   logoUrl:         'https://avraapi.com/logo.png',
     *   logoSizePercent: 20,
     * });
     *
     * // Base64 for HTML embedding:
     * const b64 = await apix.utilities().generateQr({
     *   data:   'https://avraapi.com',
     *   format: 'base64',
     * });
     * const api = b64 as ApiResponse<QrBase64Data>;
     * console.log(api.data.data_uri); // 'data:image/png;base64,...'
     * ```
     */
    generateQr(params: GenerateQrParams): Promise<ApiResponse<QrBase64Data> | BinaryResponse>;
    /**
     * Generate a barcode image from text or numeric data.
     *
     * Wraps: POST /utilities/barcode/generate
     * Provider: apix_barcode
     *
     * Always returns a BinaryResponse — barcode endpoint does not support base64.
     *
     * @throws {ApixValidationError}
     * @throws {ApixAuthenticationError}
     * @throws {ApixInsufficientFundsError}
     * @throws {ApixRateLimitError}
     * @throws {ApixError}
     * @throws {ApixNetworkError}
     *
     * @example
     * ```ts
     * const barcode = await apix.utilities().generateBarcode({
     *   data:   '5901234123457',
     *   type:   'EAN13',
     *   format: 'png',
     *   height: 100,
     * });
     * await barcode.saveAs('./output/barcode.png');
     * console.log(`Size: ${barcode.size} bytes`);
     * ```
     */
    generateBarcode(params: GenerateBarcodeParams): Promise<BinaryResponse>;
    /**
     * Convert an HTML document or fragment to a PDF file.
     *
     * Wraps: POST /utilities/pdf/generate
     * Provider: apix_html2pdf
     *
     * @returns
     *   - `BinaryResponse` when `responseType` is 'binary' (default).
     *     Use `await response.saveAs('./invoice.pdf')` or `response.getBuffer()`.
     *   - `ApiResponse<PdfBase64Data>` when `responseType` is 'base64'.
     *     Access the base64 string via `response.data.data`.
     *
     * @throws {ApixValidationError}
     * @throws {ApixAuthenticationError}
     * @throws {ApixInsufficientFundsError}
     * @throws {ApixRateLimitError}
     * @throws {ApixError}
     * @throws {ApixNetworkError}
     *
     * @example
     * ```ts
     * // Binary PDF — save to disk:
     * const html = '<h1>Invoice #001</h1><p>Total: $99.00</p>';
     * const pdf  = await apix.utilities().generatePdf({ html });
     * await (pdf as BinaryResponse).saveAs('./output/invoice.pdf');
     *
     * // Pre-encoded Base64 HTML input:
     * const encoded = Buffer.from(complexHtml).toString('base64');
     * const pdf = await apix.utilities().generatePdf({
     *   html: encoded,
     *   isBase64: true,
     * });
     * await (pdf as BinaryResponse).saveAs('./output/invoice.pdf');
     *
     * // Landscape A4 with custom margins:
     * const landscape = await apix.utilities().generatePdf({
     *   html,
     *   pageSize:    'A4',
     *   orientation: 'landscape',
     *   margins:     { top: 20, right: 25, bottom: 20, left: 25 },
     * });
     * await (landscape as BinaryResponse).saveAs('./output/landscape.pdf');
     *
     * // Privacy mode (sensitive documents):
     * const pdf = await apix.utilities().generatePdf({ html, privacyMode: true });
     * ```
     */
    generatePdf(params: GeneratePdfParams): Promise<ApiResponse<PdfBase64Data> | BinaryResponse>;
    /**
     * Convert an HTML document to PDF using Base64 transport encoding.
     *
     * Convenience wrapper around generatePdf() that automatically Base64-encodes
     * the raw HTML string. This is the recommended approach for complex templates
     * containing quotes, newlines, inline CSS, or special characters — it avoids
     * JSON escaping issues entirely.
     *
     * The server decodes the Base64 content before validation and rendering.
     * The 512 KB size limit applies to the decoded HTML, not the encoded payload.
     *
     * @param params.html  Raw HTML content (NOT pre-encoded). This method encodes it.
     *
     * @throws {ApixValidationError}
     * @throws {ApixAuthenticationError}
     * @throws {ApixInsufficientFundsError}
     * @throws {ApixRateLimitError}
     * @throws {ApixError}
     * @throws {ApixNetworkError}
     *
     * @example
     * ```ts
     * import { readFileSync } from 'node:fs';
     *
     * // Complex invoice template — no escaping worries:
     * const html = readFileSync('./templates/invoice.html', 'utf-8');
     * const pdf  = await apix.utilities().generatePdfFromBase64({ html });
     * await (pdf as BinaryResponse).saveAs('./output/invoice.pdf');
     * ```
     */
    generatePdfFromBase64(params: GeneratePdfFromBase64Params): Promise<ApiResponse<PdfBase64Data> | BinaryResponse>;
    /**
     * Remove undefined/null values from a payload object before sending.
     *
     * Prevents `additionalProperties: false` validation errors on the gateway
     * when optional parameters are not provided.
     */
    private stripNulls;
}
//# sourceMappingURL=UtilitiesService.d.ts.map