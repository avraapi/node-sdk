/**
 * @file src/services/CurrencyService.ts
 *
 * Currency Service — Multi-Currency Rates & Conversion.
 *
 * Maps to the OpenAPI `Currency` tag.
 * Endpoint prefix: /utility/currency
 *
 * All endpoints use GET requests with path parameters.
 * Rates are derived from local USD-base cross-rate computations, cached for 2 hours.
 * This is a FREE service — no wallet credits are deducted.
 *
 * @see https://avraapi.com/docs#tag/Currency
 */
import { AbstractService } from './AbstractService.js';
// ── Service ──────────────────────────────────────────────────────────────────
export class CurrencyService extends AbstractService {
    // ── Currency Codes ──────────────────────────────────────────────────────────
    /**
     * Retrieve all supported currency codes.
     *
     * Wraps: GET /utility/currency/codes
     *
     * @example
     * ```ts
     * const result = await client.currency().getCodes();
     * console.log(result.data.count);    // 161
     * result.data.codes.forEach(c => console.log(`${c.code} — ${c.name}`));
     * ```
     */
    async getCodes() {
        return this.get('/utility/currency/codes');
    }
    // ── Latest Rates ────────────────────────────────────────────────────────────
    /**
     * Get all conversion rates from a given base currency.
     *
     * Wraps: GET /utility/currency/latest/{base}
     *
     * @param base  ISO 4217 base currency code (e.g. 'USD', 'EUR'). Case-insensitive.
     *
     * @example
     * ```ts
     * const result = await client.currency().getLatestRates('USD');
     * console.log(result.data.rates['EUR']); // 0.89123456
     * console.log(result.data.rates['LKR']); // 298.50000000
     * ```
     */
    async getLatestRates(base) {
        const b = base.toUpperCase().trim();
        return this.get(`/utility/currency/latest/${b}`);
    }
    // ── Pair Rate ───────────────────────────────────────────────────────────────
    /**
     * Get the exchange rate between two specific currencies.
     *
     * Wraps: GET /utility/currency/pair/{base}/{target}
     *
     * @param base    Source currency code (e.g. 'USD').
     * @param target  Target currency code (e.g. 'EUR').
     *
     * @example
     * ```ts
     * const result = await client.currency().getPairRate('USD', 'EUR');
     * console.log(result.data.rate); // 0.89123456
     * ```
     */
    async getPairRate(base, target) {
        const b = base.toUpperCase().trim();
        const t = target.toUpperCase().trim();
        return this.get(`/utility/currency/pair/${b}/${t}`);
    }
    // ── Convert ─────────────────────────────────────────────────────────────────
    /**
     * Convert a specific amount from one currency to another.
     *
     * Wraps: GET /utility/currency/pair/{base}/{target}/{amount}
     *
     * @param base    Source currency code (e.g. 'USD').
     * @param target  Target currency code (e.g. 'LKR').
     * @param amount  The amount to convert (must be > 0).
     *
     * @example
     * ```ts
     * const result = await client.currency().convert('USD', 'LKR', 100);
     * console.log(result.data.conversion_result); // 29850.000000
     * ```
     */
    async convert(base, target, amount) {
        const b = base.toUpperCase().trim();
        const t = target.toUpperCase().trim();
        return this.get(`/utility/currency/pair/${b}/${t}/${amount}`);
    }
}
//# sourceMappingURL=CurrencyService.js.map