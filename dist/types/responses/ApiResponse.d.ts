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
export interface ApixRawEnvelope {
    readonly success: boolean;
    readonly request_id: string;
    readonly data: Record<string, unknown>;
    readonly meta?: Record<string, unknown>;
    [key: string]: unknown;
}
/**
 * Wraps a successful JSON response from the APIX gateway.
 *
 * TData is the expected shape of the `data` field. Defaults to
 * `Record<string, unknown>` when not specified.
 */
export declare class ApiResponse<TData = Record<string, unknown>> {
    /** Full raw decoded JSON body. */
    readonly raw: ApixRawEnvelope;
    /** The `data` key of the response envelope. */
    readonly data: TData;
    /** The `meta` key of the response envelope (may be empty). */
    readonly meta: Record<string, unknown>;
    /** APIX request trace ID. */
    readonly requestId: string;
    /** Always true for ApiResponse instances — errors throw instead. */
    readonly success: boolean;
    /** HTTP status code of the underlying response. */
    readonly httpStatus: number;
    constructor(raw: ApixRawEnvelope, httpStatus?: number);
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
    get(dotPath: string, defaultValue?: unknown): unknown;
    /**
     * Check whether a dot-path key exists and is non-null/undefined.
     */
    has(dotPath: string): boolean;
    /**
     * Return the full raw payload serialized as a pretty-printed JSON string.
     */
    toJson(): string;
    private dig;
}
//# sourceMappingURL=ApiResponse.d.ts.map