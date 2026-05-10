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
// ─────────────────────────────────────────────────────────────────────────────
// UtilitiesService
// ─────────────────────────────────────────────────────────────────────────────
export class UtilitiesService extends AbstractService {
    // ── QR Code ─────────────────────────────────────────────────────────────────
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
    async generateQr(params) {
        const payload = this.stripNulls({
            data: params.data,
            format: params.format ?? 'png',
            size: params.size,
            foreground_color: params.foregroundColor,
            background_color: params.backgroundColor,
            logo_url: params.logoUrl,
            logo_size_percent: params.logoSizePercent,
            privacy_mode: params.privacyMode === true ? true : undefined,
        });
        return this.post('/utilities/qr/generate', payload);
    }
    // ── Barcode ──────────────────────────────────────────────────────────────────
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
    async generateBarcode(params) {
        const payload = this.stripNulls({
            data: params.data,
            type: params.type ?? 'C128',
            format: params.format ?? 'png',
            height: params.height,
            width_factor: params.widthFactor,
            privacy_mode: params.privacyMode === true ? true : undefined,
        });
        const response = await this.post('/utilities/barcode/generate', payload);
        return response;
    }
    // ── PDF ──────────────────────────────────────────────────────────────────────
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
    async generatePdf(params) {
        const payload = this.stripNulls({
            html: params.html,
            is_base64: params.isBase64 === true ? true : undefined,
            response_type: params.responseType ?? 'binary',
            page_size: params.pageSize ?? 'A4',
            orientation: params.orientation ?? 'portrait',
            margins: params.margins,
            privacy_mode: params.privacyMode === true ? true : undefined,
        });
        return this.post('/utilities/pdf/generate', payload);
    }
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
    async generatePdfFromBase64(params) {
        // Spread optional params (omitting undefined keys) then override html + isBase64
        const { html: _raw, ...rest } = params;
        return this.generatePdf({
            ...rest,
            html: Buffer.from(params.html).toString('base64'),
            isBase64: true,
        });
    }
    // ── Private helpers ──────────────────────────────────────────────────────────
    /**
     * Remove undefined/null values from a payload object before sending.
     *
     * Prevents `additionalProperties: false` validation errors on the gateway
     * when optional parameters are not provided.
     */
    stripNulls(obj) {
        return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null));
    }
}
//# sourceMappingURL=UtilitiesService.js.map