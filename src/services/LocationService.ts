/**
 * @file src/services/LocationService.ts
 *
 * Location Service — IP intelligence and geolocation lookups.
 *
 * Maps to the OpenAPI `Location` tag.
 * Endpoint prefix: /location
 *
 * @see https://avraapi.com/docs#tag/Location
 */

import { AbstractService } from './AbstractService.js';
import { ApiResponse }     from '../responses/ApiResponse.js';

// ─────────────────────────────────────────────────────────────────────────────
// Request / Response types (derived from openapi.json schemas)
// ─────────────────────────────────────────────────────────────────────────────

export interface LookupIpParams {
  /**
   * IPv4 or IPv6 address to resolve.
   * Example: '112.134.205.126' | '2001:4860:7:40f::fe'
   */
  readonly ip: string;

  /**
   * When true, the gateway suppresses payload storage in observability logs.
   * Maps to the X-Privacy-Mode: 1 request header.
   * @default false
   */
  readonly privacyMode?: boolean;
}

/** Resolved geolocation data returned by the MaxMind GeoLite2 provider. */
export interface GeoIpData {
  readonly country:      string;
  readonly country_code: string;
  readonly city:         string | null;
  readonly isp:          string | null;
  readonly latitude:     number;
  readonly longitude:    number;
  readonly timezone:     string;
}

export interface GeoIpMeta {
  readonly provider_override: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// LocationService
// ─────────────────────────────────────────────────────────────────────────────

export class LocationService extends AbstractService {
  /**
   * Resolve an IP address to geographic and ISP metadata.
   *
   * Wraps: POST /location/lookup
   * Provider: MaxMind GeoLite2 (code: 'maxmind')
   *
   * @returns Typed ApiResponse. Key fields in `response.data`:
   *   - `country`       e.g. 'Sri Lanka'
   *   - `country_code`  e.g. 'LK'
   *   - `city`          nullable string
   *   - `isp`           nullable string
   *   - `latitude`      float
   *   - `longitude`     float
   *   - `timezone`      e.g. 'Asia/Colombo'
   *
   * @throws {ApixValidationError}          On invalid IP format.
   * @throws {ApixAuthenticationError}      On auth failure.
   * @throws {ApixInsufficientFundsError}   When credits are exhausted.
   * @throws {ApixError}                    On any other API error.
   * @throws {ApixNetworkError}             On transport failure.
   *
   * @example
   * ```ts
   * const response = await apix.location().lookupIp({ ip: '112.134.205.126' });
   * console.log(response.data.country);      // 'Sri Lanka'
   * console.log(response.data.country_code); // 'LK'
   * console.log(response.get('data.timezone')); // 'Asia/Colombo'
   *
   * // Force a specific provider:
   * const response = await apix.location()
   *   .withProvider('maxmind')
   *   .lookupIp({ ip: '1.1.1.1' });
   * ```
   */
  public async lookupIp(params: LookupIpParams): Promise<ApiResponse<GeoIpData>> {
    const { ip, privacyMode = false } = params;

    const extraHeaders: Record<string, string> = privacyMode
      ? { 'X-Privacy-Mode': '1' }
      : {};

    const response = await this.post(
      '/location/lookup',
      { ip },
      extraHeaders,
    );

    return response as unknown as ApiResponse<GeoIpData>;
  }
}
