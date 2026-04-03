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
// ─────────────────────────────────────────────────────────────────────────────
// Config class
// ─────────────────────────────────────────────────────────────────────────────
export class Config {
    static DEFAULT_BASE_URL = 'https://avraapi.com/api/v1';
    static DEFAULT_TIMEOUT = 30_000; // milliseconds
    projectKey;
    apiSecret;
    env;
    baseUrl;
    timeout;
    constructor(options = {}) {
        const projectKey = this.resolve(options.projectKey, 'APIX_PROJECT_KEY');
        if (projectKey == null) {
            throw new Error('APIX SDK: projectKey is required. ' +
                'Pass it via new ApixClient({ projectKey: "..." }) or set the APIX_PROJECT_KEY environment variable.');
        }
        const apiSecret = this.resolve(options.apiSecret, 'APIX_API_SECRET');
        if (apiSecret == null) {
            throw new Error('APIX SDK: apiSecret is required. ' +
                'Pass it via new ApixClient({ apiSecret: "..." }) or set the APIX_API_SECRET environment variable.');
        }
        this.projectKey = projectKey;
        this.apiSecret = apiSecret;
        const rawEnv = this.resolve(options.env, 'APIX_ENV') ?? 'dev';
        this.env = this.normalizeEnv(rawEnv);
        const rawBaseUrl = this.resolve(options.baseUrl, 'APIX_BASE_URL') ?? Config.DEFAULT_BASE_URL;
        this.baseUrl = rawBaseUrl.replace(/\/+$/, ''); // strip trailing slashes
        const rawTimeout = this.resolve(options.timeout != null ? String(options.timeout) : undefined, 'APIX_TIMEOUT');
        this.timeout = rawTimeout != null ? parseInt(rawTimeout, 10) : Config.DEFAULT_TIMEOUT;
    }
    // ── Private helpers ─────────────────────────────────────────────────────────
    /**
     * Resolve a value from an explicit option first, then from process.env.
     * Returns undefined when neither source has a non-empty string value.
     */
    resolve(explicit, envKey) {
        if (typeof explicit === 'string' && explicit.trim() !== '') {
            return explicit.trim();
        }
        const fromEnv = process.env[envKey];
        if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
            return fromEnv.trim();
        }
        return undefined;
    }
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
    normalizeEnv(raw) {
        switch (raw.toLowerCase().trim()) {
            case 'prod':
            case 'production':
                return 'prod';
            default:
                return 'dev';
        }
    }
}
//# sourceMappingURL=Config.js.map