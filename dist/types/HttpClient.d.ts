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
import { Config } from './Config.js';
import { ApiResponse } from './responses/ApiResponse.js';
import { BinaryResponse } from './responses/BinaryResponse.js';
export declare class HttpClient {
    private readonly config;
    private readonly axiosInstance;
    /** Per-request provider override — consumed once, then cleared. */
    private pendingProviderOverride;
    constructor(config: Config);
    /**
     * Execute a POST request and return a typed response object.
     *
     * @throws {ApixError}         On any API-level error.
     * @throws {ApixNetworkError}  On transport-level failure (no HTTP response).
     */
    post(path: string, payload?: Record<string, unknown>, extraHeaders?: Record<string, string>): Promise<ApiResponse | BinaryResponse>;
    /**
     * Stage a provider override for the next request only.
     * Called by AbstractService.withProvider(). Auto-cleared after dispatch.
     *
     * @internal
     */
    setProviderOverride(providerCode: string): void;
    private handleResponse;
    private mapError;
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
    private normalizePath;
    private buildRequestHeaders;
    private extractContentType;
    private extractRequestId;
    private isBinary;
    /**
     * Parse an ArrayBuffer body as JSON.
     *
     * Returns a synthetic error envelope if the body is empty or not valid JSON.
     * This handles unexpected HTML error pages from reverse proxies gracefully.
     */
    private parseJson;
}
//# sourceMappingURL=HttpClient.d.ts.map