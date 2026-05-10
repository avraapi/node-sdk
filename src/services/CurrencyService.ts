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
import { ApiResponse }     from '../responses/ApiResponse.js';

// ── Response data interfaces ─────────────────────────────────────────────────

/** A single currency code entry. */
export interface CurrencyCodeEntry {
  /** ISO 4217 currency code (e.g. 'USD', 'EUR', 'LKR'). */
  code: string;
  /** Human-readable currency name. */
  name: string;
}

/** Shape of the `data` field in a getCodes() response. */
export interface CurrencyCodesData {
  /** Total number of active currencies. */
  count: number;
  /** List of currency code + name pairs. */
  codes: CurrencyCodeEntry[];
}

/** Shape of the `data` field in a getLatestRates() response. */
export interface CurrencyLatestRatesData {
  /** The base currency code used. */
  base: string;
  /** ISO 8601 timestamp of last rate ingestion. */
  last_updated: string;
  /** Associative map: target currency code → exchange rate. */
  rates: Record<string, number>;
}

/** Shape of the `data` field in a getPairRate() response. */
export interface CurrencyPairRateData {
  /** Source currency code. */
  base: string;
  /** Target currency code. */
  target: string;
  /** Conversion rate (8 decimal places). */
  rate: number;
  /** ISO 8601 timestamp. */
  last_updated: string;
}

/** Shape of the `data` field in a convert() response. */
export interface CurrencyConvertData {
  /** Source currency code. */
  base: string;
  /** Target currency code. */
  target: string;
  /** Conversion rate used. */
  rate: number;
  /** The original amount. */
  amount: number;
  /** The converted amount (6 decimal places). */
  conversion_result: number;
  /** ISO 8601 timestamp. */
  last_updated: string;
}

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
  public async getCodes(): Promise<ApiResponse> {
    return this.get('/utility/currency/codes') as Promise<ApiResponse>;
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
  public async getLatestRates(base: string): Promise<ApiResponse> {
    const b = base.toUpperCase().trim();
    return this.get(`/utility/currency/latest/${b}`) as Promise<ApiResponse>;
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
  public async getPairRate(base: string, target: string): Promise<ApiResponse> {
    const b = base.toUpperCase().trim();
    const t = target.toUpperCase().trim();
    return this.get(`/utility/currency/pair/${b}/${t}`) as Promise<ApiResponse>;
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
  public async convert(base: string, target: string, amount: number): Promise<ApiResponse> {
    const b = base.toUpperCase().trim();
    const t = target.toUpperCase().trim();
    return this.get(`/utility/currency/pair/${b}/${t}/${amount}`) as Promise<ApiResponse>;
  }
}
