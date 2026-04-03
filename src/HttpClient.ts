/**
 * @file src/HttpClient.ts
 *
 * Internal HTTP transport layer for the APIX Node.js SDK.
 *
 * Responsibilities:
 *   1. Build and sign every request with the correct APIX auth headers.
 *   2. Smart path normalization — strips full URLs or /api/v1 prefixes so
 *      developers can paste any form of an endpoint path without breakage.
 *   3. Detect binary vs JSON response bodies and return the right object.
 *   4. Map all HTTP error codes to typed SDK error classes.
 *
 * @internal — consume only through ApixClient or a Service class.
 */

import axios, {
  type AxiosInstance,
  type AxiosResponse,
  isAxiosError,
} from 'axios';

import { Config }                              from './Config.js';
import { ApiResponse, type ApixRawEnvelope }   from './responses/ApiResponse.js';
import { BinaryResponse }                      from './responses/BinaryResponse.js';
import {
  ApixError,
  ApixAuthenticationError,
  ApixInsufficientFundsError,
  ApixValidationError,
  ApixRateLimitError,
  ApixServiceUnavailableError,
  ApixNetworkError,
  type ApixErrorPayload,
} from './errors/ApixErrors.js';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const BINARY_CONTENT_TYPES = ['image/png', 'image/svg+xml', 'application/pdf'] as const;
const SDK_VERSION          = '1.0.0';

// ─────────────────────────────────────────────────────────────────────────────
// HttpClient
// ─────────────────────────────────────────────────────────────────────────────

export class HttpClient {
  private readonly axiosInstance: AxiosInstance;

  /** Per-request provider override — consumed once, then cleared. */
  private pendingProviderOverride: string | null = null;

  public constructor(private readonly config: Config) {
    this.axiosInstance = axios.create({
      timeout: config.timeout,
      // We handle HTTP errors manually to produce rich typed errors.
      // validateStatus returns true for all codes so Axios never throws.
      validateStatus: () => true,
      // Request binary responses as ArrayBuffer so we can build a Buffer.
      // JSON responses are also handled correctly because Axios checks
      // Content-Type and parses JSON automatically when responseType is
      // not set; we override per-request when needed.
      headers: {
        'Accept':       'application/json, image/png, image/svg+xml, application/pdf',
        'Content-Type': 'application/json',
        'User-Agent':   `avraapi/apix-node-sdk/${SDK_VERSION} Node/${process.version}`,
      },
    });
  }

  // ── Public transport ────────────────────────────────────────────────────────

  /**
   * Execute a POST request and return a typed response object.
   *
   * @throws {ApixError}         On any API-level error.
   * @throws {ApixNetworkError}  On transport-level failure (no HTTP response).
   */
  public async post(
    path: string,
    payload: Record<string, unknown> = {},
    extraHeaders: Record<string, string> = {},
  ): Promise<ApiResponse | BinaryResponse> {
    const url     = this.normalizePath(path);
    const headers = this.buildRequestHeaders(extraHeaders);

    let response: AxiosResponse;

    try {
      // We request arraybuffer for ALL calls so we can detect binary responses
      // by Content-Type rather than guessing. JSON is still handled correctly
      // because we JSON.parse it manually when the content type is not binary.
      response = await this.axiosInstance.post<ArrayBuffer>(url, payload, {
        headers,
        responseType: 'arraybuffer',
      });
    } catch (err) {
      // Axios throws here only for network-level failures (ECONNREFUSED,
      // ETIMEDOUT, etc.) — not for HTTP 4xx/5xx which are caught by
      // validateStatus: () => true above.
      if (isAxiosError(err) && err.request != null && err.response == null) {
        throw new ApixNetworkError(
          `Could not connect to APIX gateway at '${url}'. ` +
          `Check baseUrl and ensure the server is reachable. ` +
          `Original error: ${err.message}`,
          err,
        );
      }
      throw new ApixNetworkError(
        `APIX request failed: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err : undefined,
      );
    }

    return this.handleResponse(response);
  }

  /**
   * Stage a provider override for the next request only.
   * Called by AbstractService.withProvider(). Auto-cleared after dispatch.
   *
   * @internal
   */
  public setProviderOverride(providerCode: string): void {
    this.pendingProviderOverride = providerCode.trim();
  }

  // ── Response handling ───────────────────────────────────────────────────────

  private handleResponse(response: AxiosResponse<ArrayBuffer>): ApiResponse | BinaryResponse {
    const status      = response.status;
    const contentType = this.extractContentType(response);
    const bodyBuffer  = Buffer.from(response.data);

    // ── Binary success ──────────────────────────────────────────────────────
    if (status >= 200 && status < 300 && this.isBinary(contentType)) {
      const requestId = this.extractRequestId(response);
      return new BinaryResponse(bodyBuffer, contentType, status, requestId);
    }

    // ── Parse as JSON ───────────────────────────────────────────────────────
    const decoded = this.parseJson(bodyBuffer, status);

    // ── JSON success ────────────────────────────────────────────────────────
    if (status >= 200 && status < 300) {
      return new ApiResponse(decoded as ApixRawEnvelope, status);
    }

    // ── Error — map to typed error class ───────────────────────────────────
    throw this.mapError(status, decoded as Partial<ApixErrorPayload>);
  }

  // ── Error mapping ───────────────────────────────────────────────────────────

  private mapError(httpStatus: number, payload: Partial<ApixErrorPayload>): ApixError {
    switch (httpStatus) {
      case 401: return ApixAuthenticationError.fromPayload(httpStatus, payload);
      case 402: return ApixInsufficientFundsError.fromPayload(httpStatus, payload);
      case 422: return ApixValidationError.fromPayload(httpStatus, payload);
      case 429: return ApixRateLimitError.fromPayload(httpStatus, payload);
      case 503: return ApixServiceUnavailableError.fromPayload(httpStatus, payload);
      default:  return ApixError.fromPayload(httpStatus, payload);
    }
  }

  // ── Smart path normalization ─────────────────────────────────────────────────

  /**
   * Normalize any path format into a full request URI.
   *
   * All of these forms resolve to the same canonical URL:
   *   'https://avraapi.com/api/v1/sms/send'
   *   'http://localhost/api/v1/sms/send'
   *   '/api/v1/sms/send'
   *   'api/v1/sms/send'
   *   '/sms/send'
   *   'sms/send'
   *
   * Algorithm (exact port of PHP SDK normalizePath):
   *   1. Strip the configured baseUrl prefix if the path starts with it.
   *   2. For other full URLs, strip scheme + host.
   *   3. Strip any /api/vN/ prefix.
   *   4. Strip remaining leading slashes.
   *   5. Append clean segment to baseUrl.
   */
  private normalizePath(input: string): string {
    let p = input.trim();

    // Step 1 — strip configured base URL
    if (p.startsWith(this.config.baseUrl)) {
      p = p.slice(this.config.baseUrl.length);
    } else if (/^https?:\/\//i.test(p)) {
      // Step 2 — strip scheme + host from any other full URL
      p = p.replace(/^https?:\/\/[^/]+/i, '');
    }

    // Step 3 — strip /api/vN/ prefix (case-insensitive, any version number)
    p = p.replace(/^\/?api\/v\d+\//i, '');

    // Step 4 — strip remaining leading slashes
    p = p.replace(/^\/+/, '');

    // Step 5 — final URI
    return `${this.config.baseUrl}/${p}`;
  }

  // ── Header builders ──────────────────────────────────────────────────────────

  private buildRequestHeaders(extra: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'X-API-KEY':    this.config.projectKey,
      'X-API-SECRET': this.config.apiSecret,
      'X-ENV':        this.config.env,
      ...extra,
    };

    // Consume and inject the staged provider override (if any)
    if (this.pendingProviderOverride != null) {
      headers['X-Provider-Override'] = this.pendingProviderOverride;
      this.pendingProviderOverride    = null;
    }

    return headers;
  }

  // ── Utility helpers ──────────────────────────────────────────────────────────

  private extractContentType(response: AxiosResponse): string {
    const raw = (response.headers['content-type'] as string | undefined) ?? '';
    return raw.split(';')[0]!.toLowerCase().trim();
  }

  private extractRequestId(response: AxiosResponse): string | null {
    const id = response.headers['x-apix-request-id'] as string | undefined;
    return typeof id === 'string' && id.trim() !== '' ? id.trim() : null;
  }

  private isBinary(contentType: string): boolean {
    return BINARY_CONTENT_TYPES.some((t) => contentType.includes(t));
  }

  /**
   * Parse an ArrayBuffer body as JSON.
   *
   * Returns a synthetic error envelope if the body is empty or not valid JSON.
   * This handles unexpected HTML error pages from reverse proxies gracefully.
   */
  private parseJson(buffer: Buffer, httpStatus: number): Record<string, unknown> {
    const text = buffer.toString('utf-8').trim();

    if (text === '') {
      return {
        success:    false,
        request_id: null,
        error: {
          code:    'empty_response',
          message: `The APIX gateway returned an empty body with HTTP ${httpStatus}.`,
        },
      };
    }

    try {
      const parsed = JSON.parse(text) as unknown;
      return typeof parsed === 'object' && parsed !== null
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {
        success:    false,
        request_id: null,
        error: {
          code:    'invalid_json_response',
          message: `The APIX gateway returned a non-JSON body with HTTP ${httpStatus}. ` +
                   `This may indicate a reverse-proxy error or server misconfiguration.`,
        },
      };
    }
  }
}
