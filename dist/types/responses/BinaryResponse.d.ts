/**
 * @file src/responses/BinaryResponse.ts
 *
 * Strongly-typed wrapper for a binary response from the APIX gateway.
 *
 * Returned when the gateway sends raw binary content:
 *   - QR code  → image/png  or  image/svg+xml
 *   - Barcode  → image/png  or  image/svg+xml
 *   - PDF      → application/pdf
 *
 * Usage:
 *   const qr = await apix.utilities().generateQr({ data: 'https://example.com' });
 *   await qr.saveAs('./output/qr.png');
 *
 *   // Or work with the raw Buffer:
 *   const buf = qr.getBuffer();
 *   res.setHeader('Content-Type', qr.contentType);
 *   res.send(buf);
 *
 *   // Embed directly in HTML:
 *   const uri = qr.toDataUri();  // 'data:image/png;base64,...'
 */
export declare class BinaryResponse {
    /** Raw binary content as a Node.js Buffer. */
    readonly buffer: Buffer;
    /** MIME type of the content (e.g. 'image/png', 'application/pdf'). */
    readonly contentType: string;
    /** Size of the binary payload in bytes. */
    readonly size: number;
    /** HTTP status code of the underlying response. */
    readonly httpStatus: number;
    /** X-APIX-Request-ID response header value, if present. */
    readonly requestId: string | null;
    constructor(buffer: Buffer, contentType: string, httpStatus?: number, requestId?: string | null);
    /**
     * Get the raw binary Buffer.
     *
     * Use this to pipe into HTTP responses, further processing, or storage.
     *
     * Example (Express.js):
     *   const pdf = await apix.utilities().generatePdf({ html: '<h1>Invoice</h1>' });
     *   res.setHeader('Content-Type', pdf.contentType);
     *   res.setHeader('Content-Length', pdf.size.toString());
     *   res.send(pdf.getBuffer());
     */
    getBuffer(): Buffer;
    /**
     * Save the binary content to a file on disk.
     *
     * Creates intermediate directories if they do not exist.
     * Returns a Promise that resolves to the absolute path of the saved file.
     *
     * @param filePath  Absolute or relative file path (relative to process.cwd()).
     *
     * @throws {Error} When the directory cannot be created or the file cannot be written.
     *
     * Examples:
     *   const savedPath = await qr.saveAs('./output/qr.png');
     *   console.log(`Saved to: ${savedPath}`);
     *
     *   await pdf.saveAs('/tmp/invoice.pdf');
     *   await barcode.saveAs('./barcodes/item-001.png');
     */
    saveAs(filePath: string): Promise<string>;
    /**
     * Synchronous version of saveAs for contexts where async is inconvenient.
     *
     * Prefer the async saveAs() in most cases.
     */
    saveAsSync(filePath: string): string;
    /**
     * Return a base64-encoded data URI suitable for embedding in HTML.
     *
     * Example:
     *   const uri = qr.toDataUri();
     *   // → 'data:image/png;base64,iVBORw0KGgo...'
     *   // <img src={uri} />
     */
    toDataUri(): string;
    /** Whether this response contains a PDF document. */
    isPdf(): boolean;
    /** Whether this response contains a PNG image. */
    isPng(): boolean;
    /** Whether this response contains an SVG image. */
    isSvg(): boolean;
}
//# sourceMappingURL=BinaryResponse.d.ts.map