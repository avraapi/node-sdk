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

import * as fs from 'node:fs';
import * as path from 'node:path';

export class BinaryResponse {
  /** Raw binary content as a Node.js Buffer. */
  public readonly buffer: Buffer;

  /** MIME type of the content (e.g. 'image/png', 'application/pdf'). */
  public readonly contentType: string;

  /** Size of the binary payload in bytes. */
  public readonly size: number;

  /** HTTP status code of the underlying response. */
  public readonly httpStatus: number;

  /** X-APIX-Request-ID response header value, if present. */
  public readonly requestId: string | null;

  public constructor(
    buffer: Buffer,
    contentType: string,
    httpStatus: number = 200,
    requestId: string | null = null,
  ) {
    this.buffer      = buffer;
    this.contentType = contentType;
    this.httpStatus  = httpStatus;
    this.requestId   = requestId;
    this.size        = buffer.length;
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
  public getBuffer(): Buffer {
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
  public async saveAs(filePath: string): Promise<string> {
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
  public saveAsSync(filePath: string): string {
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
  public toDataUri(): string {
    return `data:${this.contentType};base64,${this.buffer.toString('base64')}`;
  }

  /** Whether this response contains a PDF document. */
  public isPdf(): boolean {
    return this.contentType.includes('application/pdf');
  }

  /** Whether this response contains a PNG image. */
  public isPng(): boolean {
    return this.contentType.includes('image/png');
  }

  /** Whether this response contains an SVG image. */
  public isSvg(): boolean {
    return this.contentType.includes('image/svg');
  }
}
