/**
 * @file src/responses/ApiResponse.ts
 *
 * Strongly-typed wrapper for a successful APIX JSON response.
 *
 * Every APIX success envelope has the shape:
 *   {
 *     "success":    true,
 *     "request_id": "uuid-...",
 *     "data":       { ... },
 *     "meta":       { ... }   ← present on some endpoints
 *   }
 *
 * Usage:
 *   const response = await apix.location().lookupIp('1.1.1.1');
 *   console.log(response.data.country);         // 'Australia'
 *   console.log(response.get('data.country'));   // dot-notation accessor
 *   console.log(response.requestId);             // 'req_...'
 */
// ─────────────────────────────────────────────────────────────────────────────
// ApiResponse
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Wraps a successful JSON response from the APIX gateway.
 *
 * TData is the expected shape of the `data` field. Defaults to
 * `Record<string, unknown>` when not specified.
 */
export class ApiResponse {
    /** Full raw decoded JSON body. */
    raw;
    /** The `data` key of the response envelope. */
    data;
    /** The `meta` key of the response envelope (may be empty). */
    meta;
    /** APIX request trace ID. */
    requestId;
    /** Always true for ApiResponse instances — errors throw instead. */
    success;
    /** HTTP status code of the underlying response. */
    httpStatus;
    constructor(raw, httpStatus = 200) {
        this.raw = raw;
        this.httpStatus = httpStatus;
        this.success = raw.success ?? true;
        this.requestId = typeof raw.request_id === 'string' ? raw.request_id : '';
        this.data = (raw.data ?? {});
        this.meta = raw.meta ?? {};
    }
    /**
     * Dot-notation accessor for nested response values.
     *
     * Traverses both `data` and the full raw payload.
     *
     * Examples:
     *   response.get('country')             // from data
     *   response.get('data.country')        // same
     *   response.get('meta.provider_override')
     *   response.get('data.send_method')
     *   response.get('missing.key', 'n/a')  // returns default
     */
    get(dotPath, defaultValue = undefined) {
        const segments = dotPath.split('.');
        // Try from root first
        const fromRoot = this.dig(this.raw, segments);
        if (fromRoot !== undefined)
            return fromRoot;
        // Then try relative to `data`
        const fromData = this.dig(this.data, segments);
        return fromData !== undefined ? fromData : defaultValue;
    }
    /**
     * Check whether a dot-path key exists and is non-null/undefined.
     */
    has(dotPath) {
        return this.get(dotPath) != null;
    }
    /**
     * Return the full raw payload serialized as a pretty-printed JSON string.
     */
    toJson() {
        return JSON.stringify(this.raw, null, 2);
    }
    // ── Private helpers ─────────────────────────────────────────────────────────
    dig(obj, segments) {
        let current = obj;
        for (const segment of segments) {
            if (current == null || typeof current !== 'object')
                return undefined;
            current = current[segment];
        }
        return current;
    }
}
//# sourceMappingURL=ApiResponse.js.map