/**
 * @file src/Config.ts
 *
 * Immutable configuration container for the APIX Node.js SDK.
 *
 * Resolution priority (highest → lowest):
 *   1. Values passed explicitly via the options object in the constructor.
 *   2. Environment variables read via process.env.
 *
 * Required:
 *   APIX_PROJECT_KEY / projectKey  — Your project client ID  (X-API-KEY header)
 *   APIX_API_SECRET  / apiSecret   — Your project API secret (X-API-SECRET header)
 *
 * Optional:
 *   APIX_ENV     / env      — 'dev' | 'prod'          (default: 'dev')
 *   APIX_BASE_URL / baseUrl — Full base URL            (default: 'https://avraapi.com/api/v1')
 *   APIX_TIMEOUT / timeout  — Request timeout (ms)    (default: 30_000)
 */
export interface ApixClientOptions {
    /**
     * Your APIX project client ID.
     * Maps to the X-API-KEY request header.
     * Falls back to process.env.APIX_PROJECT_KEY when omitted.
     */
    readonly projectKey?: string;
    /**
     * Your APIX project API secret.
     * Maps to the X-API-SECRET request header.
     * Falls back to process.env.APIX_API_SECRET when omitted.
     */
    readonly apiSecret?: string;
    /**
     * Target environment for the project.
     * Accepted: 'dev' | 'development' | 'prod' | 'production'.
     * Normalized to 'dev' or 'prod' before sending.
     * Falls back to process.env.APIX_ENV ?? 'dev'.
     */
    readonly env?: string;
    /**
     * Base URL of the APIX gateway.
     * Override for local testing against Laravel Sail.
     * Falls back to process.env.APIX_BASE_URL ?? 'https://avraapi.com/api/v1'.
     *
     * Example: 'http://localhost/api/v1'
     */
    readonly baseUrl?: string;
    /**
     * HTTP request timeout in milliseconds.
     * Falls back to process.env.APIX_TIMEOUT ?? 30_000.
     */
    readonly timeout?: number;
}
export declare class Config {
    static readonly DEFAULT_BASE_URL = "https://avraapi.com/api/v1";
    static readonly DEFAULT_TIMEOUT = 30000;
    readonly projectKey: string;
    readonly apiSecret: string;
    readonly env: string;
    readonly baseUrl: string;
    readonly timeout: number;
    constructor(options?: ApixClientOptions);
    /**
     * Resolve a value from an explicit option first, then from process.env.
     * Returns undefined when neither source has a non-empty string value.
     */
    private resolve;
    /**
     * Normalize environment aliases.
     *
     * Mirrors the normalizeEnvCode() logic in APIX's CheckApiKey middleware
     * so the SDK and gateway always agree on the target environment.
     *
     *   'dev' / 'development' → 'dev'
     *   'prod' / 'production' → 'prod'
     *   anything else         → 'dev' (safe fallback)
     */
    private normalizeEnv;
}
//# sourceMappingURL=Config.d.ts.map