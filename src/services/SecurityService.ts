/**
 * @file src/services/SecurityService.ts
 *
 * Security Service — VPN & Proxy Shield, Burner Email Detection.
 *
 * Maps to the OpenAPI `Security` tag.
 * Endpoint prefix: /security
 *
 * All methods return an ApiResponse wrapping the standard AvraAPI envelope:
 *   { "success": true, "request_id": "...", "data": { ... } }
 *
 * @see https://avraapi.com/docs#tag/Security
 */

import { AbstractService } from './AbstractService.js';
import { ApiResponse }     from '../responses/ApiResponse.js';

// ── Request parameter interfaces ─────────────────────────────────────────────

/** Parameters for the VPN & Proxy Shield lookup. */
export interface CheckVpnParams {
  /** A valid IPv4 or IPv6 address to analyse. */
  ip: string;
}

/** Parameters for the Burner Email Shield check. */
export interface CheckBurnerEmailParams {
  /** A valid email address to check (max 255 chars, RFC 5322). */
  email: string;
}

// ── Response data interfaces ─────────────────────────────────────────────────

/** Shape of the `data` field in a VPN Shield response. */
export interface VpnShieldData {
  /** The IP that was analysed. */
  ip_address: string;
  /** Detected as a VPN endpoint. */
  is_vpn: boolean;
  /** Detected as a proxy server. */
  is_proxy: boolean;
  /** Detected as a Tor exit node. */
  is_tor: boolean;
  /** Detected as an iCloud Private Relay node. */
  is_relay: boolean;
  /** Detected as a hosting/datacenter IP. */
  is_hosting: boolean;
  /** ISO 3166-1 alpha-2 country code, or null. */
  country_code: string | null;
  /** City name, or null. */
  city: string | null;
  /** Autonomous System Number, or null. */
  asn: string | null;
  /** ISP / network organization name, or null. */
  network_name: string | null;
  /** Upstream provider that answered ('vpnapi' or 'iplocate'). */
  provider_name: string;
}

/** Shape of the `data` field in a Burner Email Shield response. */
export interface BurnerEmailData {
  /** The email that was checked. */
  email: string;
  /** Extracted domain portion (lowercase). */
  domain: string;
  /** Whether the email passes RFC 5322 validation. */
  is_valid_syntax: boolean;
  /** Whether the domain is in the blocklist. */
  is_disposable: boolean;
  /** Which list matched: 'custom', 'global', or 'none'. */
  source: 'custom' | 'global' | 'none';
  /** Wall-clock time in milliseconds (2 decimal places). */
  execution_time_ms: number;
}

// ── Service ──────────────────────────────────────────────────────────────────

export class SecurityService extends AbstractService {

  // ── VPN & Proxy Shield ──────────────────────────────────────────────────────

  /**
   * Check whether an IP address is associated with a VPN, proxy, Tor node,
   * relay (iCloud Private Relay), or hosting/datacenter.
   *
   * Wraps: POST /security/vpn-shield
   *
   * @example
   * ```ts
   * const result = await client.security().checkVpn({ ip: '8.8.8.8' });
   * console.log(result.data.is_vpn);        // false
   * console.log(result.data.country_code);   // 'US'
   * console.log(result.data.network_name);   // 'Google LLC'
   * ```
   */
  public async checkVpn(params: CheckVpnParams): Promise<ApiResponse> {
    return this.post('/security/vpn-shield', { ip: params.ip }) as Promise<ApiResponse>;
  }

  // ── Burner Email Shield ─────────────────────────────────────────────────────

  /**
   * Check whether an email address uses a temporary/disposable domain.
   *
   * Wraps: POST /security/burner-email-shield
   *
   * @example
   * ```ts
   * const result = await client.security().checkBurnerEmail({ email: 'user@mailinator.com' });
   * console.log(result.data.is_disposable); // true
   * console.log(result.data.source);        // 'global'
   * ```
   */
  public async checkBurnerEmail(params: CheckBurnerEmailParams): Promise<ApiResponse> {
    return this.post('/security/burner-email-shield', { email: params.email }) as Promise<ApiResponse>;
  }
}
