/**
 * @file src/errors/ApixErrors.ts
 *
 * All APIX SDK error classes.
 *
 * Every class extends the base ApixError which itself extends the native
 * Error class, so `instanceof` checks work correctly across module boundaries.
 *
 * Exception hierarchy (mirrors the PHP SDK exactly):
 *
 *   Error
 *   └── ApixError                        (base — catch all APIX errors)
 *       ├── ApixAuthenticationError      (HTTP 401)
 *       ├── ApixInsufficientFundsError   (HTTP 402)
 *       ├── ApixValidationError          (HTTP 422) + validationErrors field
 *       ├── ApixRateLimitError           (HTTP 429)
 *       ├── ApixServiceUnavailableError  (HTTP 503)
 *       └── ApixNetworkError             (transport failure, no HTTP response)
 *
 * Usage:
 *   try {
 *     await apix.sms().sendSingle({ to: '', message: '' });
 *   } catch (err) {
 *     if (err instanceof ApixValidationError) {
 *       console.log(err.validationErrors);
 *     } else if (err instanceof ApixError) {
 *       console.log(err.errorCode, err.httpStatus, err.requestId);
 *     }
 *   }
 */

// ─────────────────────────────────────────────────────────────────────────────
// Shared gateway error payload shape
// ─────────────────────────────────────────────────────────────────────────────

export interface ApixErrorPayload {
  readonly success: false;
  readonly request_id?: string | null;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: Record<string, string[]>;
  };
  readonly meta?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Base error class
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Base error for all APIX SDK failures.
 *
 * Catch this single class to handle any error the SDK can produce:
 *   catch (err) {
 *     if (err instanceof ApixError) { ... }
 *   }
 */
export class ApixError extends Error {
  /** Machine-readable error code from the APIX gateway error envelope. */
  public readonly errorCode: string;

  /** APIX request trace ID. Null when the error occurs before the gateway assigns one. */
  public readonly requestId: string | null;

  /** HTTP status code of the failed response. 0 for network errors. */
  public readonly httpStatus: number;

  /** Full decoded error payload from the gateway. */
  public readonly payload: Partial<ApixErrorPayload>;

  public constructor(
    message: string,
    httpStatus: number,
    errorCode: string = 'unknown_error',
    requestId: string | null = null,
    payload: Partial<ApixErrorPayload> = {},
  ) {
    super(message);

    // Restore the correct prototype chain so `instanceof` works reliably
    // in transpiled CommonJS output.
    Object.setPrototypeOf(this, new.target.prototype);

    this.name       = new.target.name;
    this.errorCode  = errorCode;
    this.requestId  = requestId;
    this.httpStatus = httpStatus;
    this.payload    = payload;
  }

  /**
   * Factory: construct from a decoded APIX error response envelope.
   *
   * Called by HttpClient after receiving a non-2xx response.
   * Subclasses override this to add extra fields (e.g. validationErrors).
   */
  public static fromPayload(httpStatus: number, payload: Partial<ApixErrorPayload>): ApixError {
    const errorCode = payload.error?.code ?? 'unknown_error';
    const message   = payload.error?.message ?? 'An unknown error occurred.';
    const requestId = payload.request_id ?? null;

    return new ApixError(message, httpStatus, errorCode, requestId, payload);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP 401 — Authentication failure
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thrown when the APIX gateway returns HTTP 401.
 *
 * Causes:
 *   - Missing X-API-KEY or X-API-SECRET headers
 *   - Invalid credentials
 *   - Project is inactive
 *   - Wrong X-ENV for the credential
 */
export class ApixAuthenticationError extends ApixError {
  public static override fromPayload(
    httpStatus: number,
    payload: Partial<ApixErrorPayload>,
  ): ApixAuthenticationError {
    const errorCode = payload.error?.code ?? 'unauthorized';
    const message   = payload.error?.message ?? 'Authentication failed.';
    const requestId = payload.request_id ?? null;

    return new ApixAuthenticationError(message, httpStatus, errorCode, requestId, payload);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP 402 — Insufficient funds
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thrown when the APIX gateway returns HTTP 402.
 *
 * Your APIX wallet balance is too low to complete the request.
 * Top up your balance in the APIX dashboard before retrying.
 */
export class ApixInsufficientFundsError extends ApixError {
  public static override fromPayload(
    httpStatus: number,
    payload: Partial<ApixErrorPayload>,
  ): ApixInsufficientFundsError {
    const errorCode = payload.error?.code ?? 'insufficient_funds';
    const message   = payload.error?.message ?? 'Insufficient wallet balance.';
    const requestId = payload.request_id ?? null;

    return new ApixInsufficientFundsError(message, httpStatus, errorCode, requestId, payload);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP 422 — Validation failure
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thrown when the APIX gateway returns HTTP 422.
 *
 * Exposes field-level validation messages exactly as returned by the
 * APIX error envelope's `error.details` object.
 *
 * Example:
 *   try {
 *     await apix.sms().sendSingle({ to: '', message: '' });
 *   } catch (err) {
 *     if (err instanceof ApixValidationError) {
 *       for (const [field, messages] of Object.entries(err.validationErrors)) {
 *         console.log(`${field}: ${messages.join(', ')}`);
 *       }
 *     }
 *   }
 */
export class ApixValidationError extends ApixError {
  /** Field-level validation errors keyed by field name. */
  public readonly validationErrors: Record<string, string[]>;

  public constructor(
    message: string,
    httpStatus: number,
    errorCode: string,
    requestId: string | null,
    payload: Partial<ApixErrorPayload>,
    validationErrors: Record<string, string[]> = {},
  ) {
    super(message, httpStatus, errorCode, requestId, payload);
    Object.setPrototypeOf(this, new.target.prototype);
    this.validationErrors = validationErrors;
  }

  public static override fromPayload(
    httpStatus: number,
    payload: Partial<ApixErrorPayload>,
  ): ApixValidationError {
    const errorCode = payload.error?.code ?? 'validation_error';
    const message   = payload.error?.message ?? 'Validation failed.';
    const requestId = payload.request_id ?? null;

    const validationErrors: Record<string, string[]> = {};
    const details = payload.error?.details;
    if (details != null && typeof details === 'object') {
      for (const [field, messages] of Object.entries(details)) {
        if (Array.isArray(messages)) {
          validationErrors[field] = messages.filter((m): m is string => typeof m === 'string');
        }
      }
    }

    return new ApixValidationError(
      message,
      httpStatus,
      errorCode,
      requestId,
      payload,
      validationErrors,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP 429 — Rate limit exceeded
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thrown when the APIX gateway returns HTTP 429.
 *
 * You have exceeded the rate limit configured on your project integration.
 * Implement exponential back-off before retrying.
 */
export class ApixRateLimitError extends ApixError {
  public static override fromPayload(
    httpStatus: number,
    payload: Partial<ApixErrorPayload>,
  ): ApixRateLimitError {
    const errorCode = payload.error?.code ?? 'rate_limit_exceeded';
    const message   = payload.error?.message ?? 'Rate limit exceeded.';
    const requestId = payload.request_id ?? null;

    return new ApixRateLimitError(message, httpStatus, errorCode, requestId, payload);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP 503 — Service unavailable (Kill Switch)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thrown when the APIX gateway returns HTTP 503.
 *
 * Most commonly caused by the project owner activating the Kill Switch
 * (project_paused). Credentials are valid — the service is deliberately
 * paused. Retry later or contact your project owner.
 */
export class ApixServiceUnavailableError extends ApixError {
  public static override fromPayload(
    httpStatus: number,
    payload: Partial<ApixErrorPayload>,
  ): ApixServiceUnavailableError {
    const errorCode = payload.error?.code ?? 'service_unavailable';
    const message   = payload.error?.message ?? 'Service temporarily unavailable.';
    const requestId = payload.request_id ?? null;

    return new ApixServiceUnavailableError(message, httpStatus, errorCode, requestId, payload);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Network / transport failure
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thrown when a network-level error prevents communication with the gateway.
 *
 * The gateway never received the request, so no request_id is available.
 *
 * Common causes:
 *   - DNS resolution failure (wrong APIX_BASE_URL in local testing)
 *   - Connection timeout (server unreachable)
 *   - TLS handshake failure
 *   - Laravel Sail not running during local development
 */
export class ApixNetworkError extends ApixError {
  public constructor(message: string, cause?: Error) {
    super(message, 0, 'network_error', null, {});
    Object.setPrototypeOf(this, new.target.prototype);
    if (cause != null) {
      this.cause = cause;
    }
  }
}
