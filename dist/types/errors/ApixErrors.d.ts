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
/**
 * Base error for all APIX SDK failures.
 *
 * Catch this single class to handle any error the SDK can produce:
 *   catch (err) {
 *     if (err instanceof ApixError) { ... }
 *   }
 */
export declare class ApixError extends Error {
    /** Machine-readable error code from the APIX gateway error envelope. */
    readonly errorCode: string;
    /** APIX request trace ID. Null when the error occurs before the gateway assigns one. */
    readonly requestId: string | null;
    /** HTTP status code of the failed response. 0 for network errors. */
    readonly httpStatus: number;
    /** Full decoded error payload from the gateway. */
    readonly payload: Partial<ApixErrorPayload>;
    constructor(message: string, httpStatus: number, errorCode?: string, requestId?: string | null, payload?: Partial<ApixErrorPayload>);
    /**
     * Factory: construct from a decoded APIX error response envelope.
     *
     * Called by HttpClient after receiving a non-2xx response.
     * Subclasses override this to add extra fields (e.g. validationErrors).
     */
    static fromPayload(httpStatus: number, payload: Partial<ApixErrorPayload>): ApixError;
}
/**
 * Thrown when the APIX gateway returns HTTP 401.
 *
 * Causes:
 *   - Missing X-API-KEY or X-API-SECRET headers
 *   - Invalid credentials
 *   - Project is inactive
 *   - Wrong X-ENV for the credential
 */
export declare class ApixAuthenticationError extends ApixError {
    static fromPayload(httpStatus: number, payload: Partial<ApixErrorPayload>): ApixAuthenticationError;
}
/**
 * Thrown when the APIX gateway returns HTTP 402.
 *
 * Your APIX wallet balance is too low to complete the request.
 * Top up your balance in the APIX dashboard before retrying.
 */
export declare class ApixInsufficientFundsError extends ApixError {
    static fromPayload(httpStatus: number, payload: Partial<ApixErrorPayload>): ApixInsufficientFundsError;
}
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
export declare class ApixValidationError extends ApixError {
    /** Field-level validation errors keyed by field name. */
    readonly validationErrors: Record<string, string[]>;
    constructor(message: string, httpStatus: number, errorCode: string, requestId: string | null, payload: Partial<ApixErrorPayload>, validationErrors?: Record<string, string[]>);
    static fromPayload(httpStatus: number, payload: Partial<ApixErrorPayload>): ApixValidationError;
}
/**
 * Thrown when the APIX gateway returns HTTP 429.
 *
 * You have exceeded the rate limit configured on your project integration.
 * Implement exponential back-off before retrying.
 */
export declare class ApixRateLimitError extends ApixError {
    static fromPayload(httpStatus: number, payload: Partial<ApixErrorPayload>): ApixRateLimitError;
}
/**
 * Thrown when the APIX gateway returns HTTP 503.
 *
 * Most commonly caused by the project owner activating the Kill Switch
 * (project_paused). Credentials are valid — the service is deliberately
 * paused. Retry later or contact your project owner.
 */
export declare class ApixServiceUnavailableError extends ApixError {
    static fromPayload(httpStatus: number, payload: Partial<ApixErrorPayload>): ApixServiceUnavailableError;
}
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
export declare class ApixNetworkError extends ApixError {
    constructor(message: string, cause?: Error);
}
//# sourceMappingURL=ApixErrors.d.ts.map