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
// Raw gateway envelope types (used internally and exported for consumers)
// ─────────────────────────────────────────────────────────────────────────────

export interface ApixRawEnvelope {
  readonly success: boolean;
  readonly request_id: string;
  readonly data: Record<string, unknown>;
  readonly meta?: Record<string, unknown>;
  // Allow index access so it's assignable to/from Record<string, unknown>
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// ApiResponse
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wraps a successful JSON response from the APIX gateway.
 *
 * TData is the expected shape of the `data` field. Defaults to
 * `Record<string, unknown>` when not specified.
 */
export class ApiResponse<TData = Record<string, unknown>> {
  /** Full raw decoded JSON body. */
  public readonly raw: ApixRawEnvelope;

  /** The `data` key of the response envelope. */
  public readonly data: TData;

  /** The `meta` key of the response envelope (may be empty). */
  public readonly meta: Record<string, unknown>;

  /** APIX request trace ID. */
  public readonly requestId: string;

  /** Always true for ApiResponse instances — errors throw instead. */
  public readonly success: boolean;

  /** HTTP status code of the underlying response. */
  public readonly httpStatus: number;

  public constructor(raw: ApixRawEnvelope, httpStatus: number = 200) {
    this.raw        = raw;
    this.httpStatus = httpStatus;
    this.success    = raw.success ?? true;
    this.requestId  = typeof raw.request_id === 'string' ? raw.request_id : '';
    this.data       = (raw.data ?? {}) as TData;
    this.meta       = raw.meta ?? {};
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
  public get(dotPath: string, defaultValue: unknown = undefined): unknown {
    const segments = dotPath.split('.');

    // Try from root first
    const fromRoot = this.dig(this.raw as Record<string, unknown>, segments);
    if (fromRoot !== undefined) return fromRoot;

    // Then try relative to `data`
    const fromData = this.dig(this.data as Record<string, unknown>, segments);
    return fromData !== undefined ? fromData : defaultValue;
  }

  /**
   * Check whether a dot-path key exists and is non-null/undefined.
   */
  public has(dotPath: string): boolean {
    return this.get(dotPath) != null;
  }

  /**
   * Return the full raw payload serialized as a pretty-printed JSON string.
   */
  public toJson(): string {
    return JSON.stringify(this.raw, null, 2);
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private dig(obj: Record<string, unknown>, segments: string[]): unknown {
    let current: unknown = obj;

    for (const segment of segments) {
      if (current == null || typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[segment];
    }

    return current;
  }
}
