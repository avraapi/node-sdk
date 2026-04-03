/**
 * @file src/services/AbstractService.ts
 *
 * Base class shared by all APIX service groups.
 *
 * Provides:
 *   - withProvider() — fluent provider override (consumed once per request)
 *   - post()         — delegates to the shared HttpClient instance
 */
export class AbstractService {
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
     * Dispatch a POST request via the shared HttpClient.
     *
     * @param path         Endpoint path (any format — HttpClient normalizes it).
     * @param payload      JSON-serializable request body.
     * @param extraHeaders Additional per-request headers.
     */
    async post(path, payload = {}, extraHeaders = {}) {
        return this.http.post(path, payload, extraHeaders);
    }
}
//# sourceMappingURL=AbstractService.js.map