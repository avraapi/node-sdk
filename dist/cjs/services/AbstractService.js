"use strict";
/**
 * @file src/services/AbstractService.ts
 *
 * Base class shared by all APIX service groups.
 *
 * Provides:
 *   - withProvider() — fluent provider override (consumed once per request)
 *   - post()         — delegates to the shared HttpClient instance
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractService = void 0;
class AbstractService {
    http;
    constructor(http) {
        this.http = http;
    }
    /**
     * Force the APIX gateway to route the NEXT request through a specific provider.
     *
     * Injects an `X-Provider-Override` header on the next request only.
     * The override is automatically cleared after the request is dispatched,
     * so subsequent calls on the same service instance are unaffected.
     *
     * @param providerCode  The provider's machine-readable code
     *                      (e.g. 'quicksend', 'maxmind', 'apix_qr').
     *
     * @returns `this` — fluent, for chaining.
     *
     * Example:
     *   await apix.sms().withProvider('quicksend').sendSingle({ to: '...', message: '...' });
     */
    withProvider(providerCode) {
        this.http.setProviderOverride(providerCode.trim());
        return this;
    }
    /**
     * Enable AvraAPI Privacy Mode for the next request only.
     *
     * The SDK sends `X-Privacy-Mode: 1` and clears the flag immediately after
     * dispatch. Privacy Mode preserves normal routing, billing, and usage
     * tracking while suppressing request and response payload storage according
     * to the AvraAPI privacy guarantee.
     *
     * @returns `this` — fluent, for chaining.
     *
     * @example
     * ```ts
     * const response = await apix.security()
     *   .withPrivacyMode()
     *   .checkBurnerEmail({ email: 'customer@example.com' });
     * ```
     */
    withPrivacyMode() {
        this.http.enablePrivacyMode();
        return this;
    }
    /**
     * Dispatch a POST request via the shared HttpClient.
     *
     * @param path         Endpoint path (any format — HttpClient normalizes it).
     * @param payload      JSON-serializable request body.
     * @param extraHeaders Additional per-request headers.
     */
    async post(path, payload = {}, extraHeaders = {}) {
        return this.http.post(path, payload, extraHeaders);
    }
    /**
     * Dispatch a GET request via the shared HttpClient.
     *
     * Used by endpoints that accept path parameters instead of JSON bodies
     * (e.g. currency conversion endpoints).
     *
     * @param path         Endpoint path (any format — HttpClient normalizes it).
     * @param query        Optional query string parameters.
     * @param extraHeaders Additional per-request headers.
     */
    async get(path, query = {}, extraHeaders = {}) {
        return this.http.get(path, query, extraHeaders);
    }
}
exports.AbstractService = AbstractService;
//# sourceMappingURL=AbstractService.js.map