/**
 * @file src/services/AbstractService.ts
 *
 * Base class shared by all APIX service groups.
 *
 * Provides:
 *   - withProvider() — fluent provider override (consumed once per request)
 *   - post()         — delegates to the shared HttpClient instance
 */

import { HttpClient }     from '../HttpClient.js';
import { ApiResponse }    from '../responses/ApiResponse.js';
import { BinaryResponse } from '../responses/BinaryResponse.js';

export abstract class AbstractService {
  public constructor(protected readonly http: HttpClient) {}

  /**
   * Force the APIX gateway to route the NEXT request through a specific provider.
   *
   * Injects an `X-Provider-Override` header on the next request only.
   * The override is automatically cleared after the request is dispatched,
   * so subsequent calls on the same service instance are unaffected.
   *
   * @param providerCode  The provider's machine-readable code
   *                      (e.g. 'quicksend', 'maxmind', 'apix_qr').
   *
   * @returns `this` — fluent, for chaining.
   *
   * Example:
   *   await apix.sms().withProvider('quicksend').sendSingle({ to: '...', message: '...' });
   */
  public withProvider(providerCode: string): this {
    this.http.setProviderOverride(providerCode.trim());
    return this;
  }

  /**
   * Dispatch a POST request via the shared HttpClient.
   *
   * @param path         Endpoint path (any format — HttpClient normalizes it).
   * @param payload      JSON-serializable request body.
   * @param extraHeaders Additional per-request headers.
   */
  protected async post(
    path: string,
    payload: Record<string, unknown> = {},
    extraHeaders: Record<string, string> = {},
  ): Promise<ApiResponse | BinaryResponse> {
    return this.http.post(path, payload, extraHeaders);
  }
}
