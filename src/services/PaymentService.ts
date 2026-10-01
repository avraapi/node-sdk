/** Server-only typed Universal Payment Gateway lifecycle operations. */

import { ApiResponse } from '../responses/ApiResponse.js';
import { AbstractService } from './AbstractService.js';
import {
  KokoService,
  MarxPayService,
  OnePayService,
  PaymentElementsService,
  PayHereService,
  PayPlusService,
  WebXPayService,
} from './PaymentGatewayServices.js';
import {
  CreateOrderOptions,
  type CreateOrderOptionsInput,
  GatewayCode,
  GatewayEnvironment,
  PaymentAvailability,
  type PaymentCompletionOptionsInput,
  PaymentCompletionOptions,
  PaymentCompletionResult,
  type PaymentMethod,
  type PaymentPayload,
  PaymentSession,
  type PaymentSessionData,
  type PaymentCompletionResultData,
  type SensitiveCallbackOptionsInput,
  SensitiveCallbackOptions,
  SensitiveVerificationResult,
  type VerifyCallbackOptionsInput,
  type VerificationResultData,
  VerificationResult,
  VerifyCallbackOptions,
} from '../payments/PaymentTypes.js';

/**
 * Typed Universal Payment Gateway lifecycle operations.
 *
 * Every method is server-only. A provider browser event is never payment proof:
 * retain the `completionContext` server-side and use completion/verification
 * methods from an authenticated merchant callback or return handler.
 */
export class PaymentService extends AbstractService {
  private _payHere: PayHereService | null = null;
  private _marxPay: MarxPayService | null = null;
  private _onePay: OnePayService | null = null;
  private _koko: KokoService | null = null;
  private _payPlus: PayPlusService | null = null;
  private _webXPay: WebXPayService | null = null;
  private _elements: PaymentElementsService | null = null;

  /** PayHere advanced lifecycle operations. Server-only. */
  public payHere(): PayHereService {
    return (this._payHere ??= new PayHereService(this.http));
  }

  /** PHP-contract alias for `payHere()`. */
  public payhere(): PayHereService {
    return this.payHere();
  }

  /** MarxPay v4 server-side operations. */
  public marxPay(): MarxPayService {
    return (this._marxPay ??= new MarxPayService(this.http));
  }

  /** PHP-contract alias for `marxPay()`. */
  public marxpay(): MarxPayService {
    return this.marxPay();
  }

  /** OnePay server-side status lookup. */
  public onePay(): OnePayService {
    return (this._onePay ??= new OnePayService(this.http));
  }

  /** PHP-contract alias for `onePay()`. */
  public onepay(): OnePayService {
    return this.onePay();
  }

  /** KOKO signed order reconciliation. */
  public koko(): KokoService {
    return (this._koko ??= new KokoService(this.http));
  }

  /** PayPlus server-side status reconciliation. */
  public payPlus(): PayPlusService {
    return (this._payPlus ??= new PayPlusService(this.http));
  }

  /** PHP-contract alias for `payPlus()`. */
  public payplus(): PayPlusService {
    return this.payPlus();
  }

  /** WebXPay Merchant API status lookup. */
  public webXPay(): WebXPayService {
    return (this._webXPay ??= new WebXPayService(this.http));
  }

  /** PHP-contract alias for `webXPay()`. */
  public webxpay(): WebXPayService {
    return this.webXPay();
  }

  /** Secret-free server-rendered Payment Elements helpers. */
  public elements(): PaymentElementsService {
    return (this._elements ??= new PaymentElementsService());
  }

  public renderForm(mountId: string, options: import('../payments/GatewayTypes.js').PaymentElementsOptions = {}): string {
    return this.elements().renderForm(mountId, options);
  }

  /**
   * Render the payment-method mount. If availability was not supplied, it is
   * fetched from AvraAPI and embedded as browser-safe metadata only.
   */
  public async renderMethods(
    mountId: string,
    options: import('../payments/GatewayTypes.js').PaymentElementsOptions = {},
    merchantDomain?: string,
  ): Promise<string> {
    if (!Object.hasOwn(options, 'availability') && !Object.hasOwn(options, 'methods')) {
      const availability = await this.availability(merchantDomain);
      return this.elements().renderMethods(mountId, { ...options, availability: availability.toElementsPayload() });
    }
    return this.elements().renderMethods(mountId, options);
  }

  /** Discover public payment methods currently usable by this project. */
  public async methods(merchantDomain?: string): Promise<PaymentMethod[]> {
    const response = this.expectJson(await this.discover(
      '/payments/methods',
      merchantDomain,
    ));
    const methods = response.data.methods;

    return Array.isArray(methods) ? methods.filter(this.isRecord).map((method) => ({ ...method })) : [];
  }

  /** Returns only browser-safe Payment Elements availability metadata. */
  public async availability(merchantDomain?: string): Promise<PaymentAvailability> {
    const response = this.expectJson(await this.discover(
      '/payments/availability',
      merchantDomain,
    ));
    return PaymentAvailability.fromData(response.data, response.requestId || null);
  }

  /** Prepare a server-owned checkout session. Never expose its completion context. */
  public async createOrder(options: CreateOrderOptions | CreateOrderOptionsInput): Promise<PaymentSession> {
    const request = options instanceof CreateOrderOptions ? options : new CreateOrderOptions(options);
    const response = this.expectJson(await this.post('/payments/orders', request.toPayload()));
    return PaymentSession.fromData(response.data as unknown as PaymentSessionData, response.requestId);
  }

  /** Complete a callback/return from the merchant server only. */
  public async completePayment(
    options: PaymentCompletionOptions | PaymentCompletionOptionsInput,
  ): Promise<PaymentCompletionResult> {
    const request = options instanceof PaymentCompletionOptions ? options : new PaymentCompletionOptions(options);
    const response = this.expectJson(await this.post(
      '/payments/complete',
      request.toPayload(),
      { 'X-AvraAPI-Completion-Delivery': 'merchant-server' },
    ));
    return PaymentCompletionResult.fromData(response.data as unknown as PaymentCompletionResultData, response.requestId);
  }

  /** Verify a checkout or recurring callback on the merchant server. */
  public async verifyCallback(
    options: VerifyCallbackOptions | VerifyCallbackOptionsInput,
  ): Promise<VerificationResult> {
    const request = options instanceof VerifyCallbackOptions ? options : new VerifyCallbackOptions(options);
    const response = this.expectJson(await this.post('/payments/callbacks/verify', request.toPayload()));
    return VerificationResult.fromData(response.data as unknown as VerificationResultData, response.requestId);
  }

  /**
   * Verify a PayHere preapproval/authorization callback on the merchant server.
   * The artifact is non-serializable by design and must never reach a browser.
   */
  public async verifySensitiveCallback(
    options: SensitiveCallbackOptions | SensitiveCallbackOptionsInput,
  ): Promise<SensitiveVerificationResult> {
    const request = options instanceof SensitiveCallbackOptions ? options : new SensitiveCallbackOptions(options);
    const response = this.expectJson(await this.post(
      '/payments/sensitive/callbacks/verify',
      request.toPayload(),
      { 'X-AvraAPI-Artifact-Delivery': 'merchant-server' },
    ));
    return SensitiveVerificationResult.fromData(response.data, response.requestId);
  }

  private methodDiscoveryQuery(merchantDomain?: string): Record<string, string> {
    const query: Record<string, string> = {};
    for (const gateway of Object.values(GatewayCode)) {
      const environment = GatewayEnvironment.configuredFor(gateway);
      if (environment != null) query[`gateway_environments[${gateway}]`] = environment;
    }
    if (merchantDomain != null) query.merchant_domain = merchantDomain;
    return query;
  }

  /**
   * Current AvraAPI payment discovery routes are GET endpoints. Some already
   * deployed gateway installations still expose the older POST-only contract;
   * retry that form only after an explicit 405 response. This preserves the
   * public GET contract while keeping server integrations migration-safe.
   */
  private async discover(path: string, merchantDomain?: string): Promise<ApiResponse | unknown> {
    try {
      return await this.get(path, this.methodDiscoveryQuery(merchantDomain));
    } catch (error) {
      if (!this.isLegacyPostOnlyDiscoveryRoute(error)) throw error;
      return this.post(path, this.methodDiscoveryPayload(merchantDomain));
    }
  }

  private methodDiscoveryPayload(merchantDomain?: string): PaymentPayload {
    const gatewayEnvironments: Record<string, string> = {};
    for (const gateway of Object.values(GatewayCode)) {
      const environment = GatewayEnvironment.configuredFor(gateway);
      if (environment != null) gatewayEnvironments[gateway] = environment;
    }

    return {
      ...(Object.keys(gatewayEnvironments).length === 0 ? {} : { gateway_environments: gatewayEnvironments }),
      ...(merchantDomain == null ? {} : { merchant_domain: merchantDomain }),
    };
  }

  private isLegacyPostOnlyDiscoveryRoute(error: unknown): error is { httpStatus: number; errorCode?: string } {
    return typeof error === 'object'
      && error != null
      && 'httpStatus' in error
      && error.httpStatus === 405
      && (!('errorCode' in error) || error.errorCode === 'method_not_allowed');
  }

  private expectJson(response: ApiResponse | unknown): ApiResponse<PaymentPayload> {
    if (!(response instanceof ApiResponse)) {
      throw new Error('AvraAPI returned an unexpected binary response for a payment operation.');
    }
    return response as ApiResponse<PaymentPayload>;
  }

  private isRecord(value: unknown): value is PaymentPayload {
    return value != null && typeof value === 'object' && !Array.isArray(value);
  }
}
