"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinaryResponse = void 0;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
class BinaryResponse {
    /** Raw binary content as a Node.js Buffer. */
    buffer;
    /** MIME type of the content (e.g. 'image/png', 'application/pdf'). */
    contentType;
    /** Size of the binary payload in bytes. */
    size;
    /** HTTP status code of the underlying response. */
    httpStatus;
    /** X-APIX-Request-ID response header value, if present. */
    requestId;
    constructor(buffer, contentType, httpStatus = 200, requestId = null) {
        this.buffer = buffer;
        this.contentType = contentType;
        this.httpStatus = httpStatus;
        this.requestId = requestId;
        this.size = buffer.length;
    }
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
    getBuffer() {
        return this.buffer;
    }
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
    async saveAs(filePath) {
        const absolutePath = path.isAbsolute(filePath)
            ? filePath
            : path.resolve(process.cwd(), filePath);
        const directory = path.dirname(absolutePath);
        // Create parent directories (equivalent to mkdir -p)
        await fs.promises.mkdir(directory, { recursive: true });
        await fs.promises.writeFile(absolutePath, this.buffer);
        return absolutePath;
    }
    /**
     * Synchronous version of saveAs for contexts where async is inconvenient.
     *
     * Prefer the async saveAs() in most cases.
     */
    saveAsSync(filePath) {
        const absolutePath = path.isAbsolute(filePath)
            ? filePath
            : path.resolve(process.cwd(), filePath);
        const directory = path.dirname(absolutePath);
        fs.mkdirSync(directory, { recursive: true });
        fs.writeFileSync(absolutePath, this.buffer);
        return absolutePath;
    }
    /**
     * Return a base64-encoded data URI suitable for embedding in HTML.
     *
     * Example:
     *   const uri = qr.toDataUri();
     *   // → 'data:image/png;base64,iVBORw0KGgo...'
     *   // <img src={uri} />
     */
    toDataUri() {
        return `data:${this.contentType};base64,${this.buffer.toString('base64')}`;
    }
    /** Whether this response contains a PDF document. */
    isPdf() {
        return this.contentType.includes('application/pdf');
    }
    /** Whether this response contains a PNG image. */
    isPng() {
        return this.contentType.includes('image/png');
    }
    /** Whether this response contains an SVG image. */
    isSvg() {
        return this.contentType.includes('image/svg');
    }
}
exports.BinaryResponse = BinaryResponse;
//# sourceMappingURL=BinaryResponse.js.map