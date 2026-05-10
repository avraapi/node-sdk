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
    async checkVpn(params) {
        return this.post('/security/vpn-shield', { ip: params.ip });
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
    async checkBurnerEmail(params) {
        return this.post('/security/burner-email-shield', { email: params.email });
    }
}
//# sourceMappingURL=SecurityService.js.map