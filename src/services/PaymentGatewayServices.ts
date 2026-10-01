/** Gateway-specific server-only Universal Payment Gateway services. */

import { ApiResponse } from '../responses/ApiResponse.js';
import { AbstractService } from './AbstractService.js';
import {
  AuthorizationOptions,
  type KokoCallbackPayloadInput,
  KokoCallbackPayload,
  type KokoReturnPayloadInput,
  KokoReturnPayload,
  KokoOrderView,
  MarxPayInitiatePaymentOptions,
  type MarxPayInitiatePaymentOptionsInput,
  MarxPayPaymentResult,
  MarxPayReturnVerification,
  MarxPayReturnVerificationOptions,
  type MarxPayReturnVerificationOptionsInput,
  OnePayCallbackPayload,
  OnePayReturnPayload,
  type PayHereCaptureInput,
  type PayHereChargeInput,
  type PayHereRefundInput,
  type PayHereSubscriptionCommandInput,
  PaymentElementsRenderer,
  type PaymentElementsOptions,
  PayPlusStatus,
  PreapprovalOptions,
  type PreapprovalOptionsInput,
  RecurringOrderOptions,
  type RecurringOrderOptionsInput,
  SubscriptionCommandResult,
  SubscriptionSummary,
  WebXPayReturnPayload,
} from '../payments/GatewayTypes.js';
import {
  type CreateOrderOptionsInput,
  GatewayCode,
  GatewayEnvironment,
  type PaymentPayload,
  PaymentSession,
  type PaymentSessionData,
} from '../payments/PaymentTypes.js';

/** PayHere advanced operations. Checkout creation remains on PaymentService.createOrder(). */
export class PayHereService extends AbstractService {
  private _retrieval: PayHereRetrievalService | null = null;
  private _refunds: PayHereRefundsService | null = null;
  private _recurring: PayHereRecurringService | null = null;
  private _subscriptions: PayHereSubscriptionService | null = null;
  private _preapprovals: PayHerePreapprovalService | null = null;
  private _authorizations: PayHereAuthorizationService | null = null;
  private _charges: PayHereChargesService | null = null;
  private _captures: PayHereCapturesService | null = null;

  public retrieval(): PayHereRetrievalService { return (this._retrieval ??= new PayHereRetrievalService(this.http)); }
  public refunds(): PayHereRefundsService { return (this._refunds ??= new PayHereRefundsService(this.http)); }
  public recurring(): PayHereRecurringService { return (this._recurring ??= new PayHereRecurringService(this.http)); }
  public subscriptions(): PayHereSubscriptionService { return (this._subscriptions ??= new PayHereSubscriptionService(this.http)); }
  public preapprovals(): PayHerePreapprovalService { return (this._preapprovals ??= new PayHerePreapprovalService(this.http)); }
  public authorizations(): PayHereAuthorizationService { return (this._authorizations ??= new PayHereAuthorizationService(this.http)); }
  public charges(): PayHereChargesService { return (this._charges ??= new PayHereChargesService(this.http)); }
  public captures(): PayHereCapturesService { return (this._captures ??= new PayHereCapturesService(this.http)); }
}

/** Secret-free Payment Elements markup helpers; they never receive SDK credentials. */
export class PaymentElementsService {
  public renderForm(mountId: string, options: PaymentElementsOptions = {}): string {
    return PaymentElementsRenderer.renderForm(mountId, options);
  }

  public renderMethods(mountId: string, options: PaymentElementsOptions = {}): string {
    return PaymentElementsRenderer.renderMethods(mountId, options);
  }
}

export class PayHereRetrievalService extends AbstractService {
  /** Privacy-safe payment projections for one merchant order. */
  public async findByOrderId(orderId: string, gatewayEnvironment?: GatewayEnvironment | null): Promise<PaymentPayload[]> {
    requireText(orderId, 'A PayHere order ID is required.');
    const data = responseData(await this.get('/payments/payhere/retrieval', environmentQuery(GatewayCode.PayHere, gatewayEnvironment, { order_id: orderId })));
    return payloadList(data.payments);
  }
}

export class PayHereRefundsService extends AbstractService {
  /** Creates a full or partial PayHere refund. This is an irreversible provider action. */
  public async create(input: PayHereRefundInput): Promise<PaymentPayload> {
    requireText(input.idempotencyKey, 'An Idempotency-Key is required for a PayHere refund.');
    const paymentId = input.paymentId?.trim() ?? '';
    const authorizationToken = input.authorizationToken?.trim() ?? '';
    if ((paymentId === '') === (authorizationToken === '')) throw new TypeError('Provide exactly one PayHere payment ID or authorization token.');
    if (input.confirmRefund !== true) throw new TypeError('confirmRefund must be true to issue a refund.');
    const payload = environmentPayload(GatewayCode.PayHere, input.gatewayEnvironment, {
      payment_id: paymentId || null,
      authorization_token: authorizationToken || null,
      description: input.description,
      confirm_refund: true,
      amount: input.amount ?? null,
    });
    return responseData(await this.post('/payments/payhere/refunds', payload, { 'Idempotency-Key': input.idempotencyKey }));
  }
}

export class PayHereAuthorizationService extends AbstractService {
  /** Prepares a redirect authorization-hold session. */
  public async create(options: AuthorizationOptions | CreateOrderOptionsInput): Promise<PaymentSession> {
    const request = options instanceof AuthorizationOptions ? options : new AuthorizationOptions(options);
    return paymentSession(await this.post('/payments/authorizations', request.toPayload()));
  }
}

export class PayHereCapturesService extends AbstractService {
  /** Captures a previously authorized PayHere amount. This is irreversible. */
  public async create(input: PayHereCaptureInput): Promise<PaymentPayload> {
    requireText(input.idempotencyKey, 'An Idempotency-Key is required for a PayHere capture.');
    if (input.confirmCapture !== true) throw new TypeError('confirmCapture must be true to capture a PayHere authorization.');
    return responseData(await this.post('/payments/payhere/captures', environmentPayload(GatewayCode.PayHere, input.gatewayEnvironment, {
      authorization_token: input.authorizationToken,
      amount: input.amount,
      expected_authorized_amount: input.expectedAuthorizedAmount,
      expected_order_id: input.expectedOrderId,
      currency: input.currency,
      deduction_details: input.deductionDetails,
      confirm_capture: true,
    }), { 'Idempotency-Key': input.idempotencyKey }));
  }
}

export class PayHerePreapprovalService extends AbstractService {
  public async create(options: PreapprovalOptions | PreapprovalOptionsInput): Promise<PaymentSession> {
    const request = options instanceof PreapprovalOptions ? options : new PreapprovalOptions(options);
    return paymentSession(await this.post('/payments/preapprovals', request.toPayload()));
  }
}

export class PayHereRecurringService extends AbstractService {
  public async create(options: RecurringOrderOptions | RecurringOrderOptionsInput): Promise<PaymentSession> {
    const request = options instanceof RecurringOrderOptions ? options : new RecurringOrderOptions(options);
    return paymentSession(await this.post('/payments/recurring/orders', request.toPayload()));
  }
}

export class PayHereSubscriptionService extends AbstractService {
  public async all(gatewayEnvironment?: GatewayEnvironment | null): Promise<SubscriptionSummary[]> {
    const data = responseData(await this.get('/payments/payhere/subscriptions', environmentQuery(GatewayCode.PayHere, gatewayEnvironment)));
    return payloadList(data.subscriptions).map((subscription) => SubscriptionSummary.fromData(subscription));
  }

  public async find(subscriptionId: string, gatewayEnvironment?: GatewayEnvironment | null): Promise<SubscriptionSummary> {
    const id = payHereSubscriptionId(subscriptionId);
    const data = responseData(await this.get(`/payments/payhere/subscriptions/${encodeURIComponent(id)}`, environmentQuery(GatewayCode.PayHere, gatewayEnvironment)));
    return SubscriptionSummary.fromData(record(data.subscription));
  }

  public async payments(subscriptionId: string, gatewayEnvironment?: GatewayEnvironment | null): Promise<PaymentPayload[]> {
    const id = payHereSubscriptionId(subscriptionId);
    const data = responseData(await this.get(`/payments/payhere/subscriptions/${encodeURIComponent(id)}/payments`, environmentQuery(GatewayCode.PayHere, gatewayEnvironment)));
    return payloadList(data.payments);
  }

  public async retry(input: PayHereSubscriptionCommandInput & { readonly confirmRetry: boolean }): Promise<SubscriptionCommandResult> {
    requireText(input.idempotencyKey, 'An Idempotency-Key is required to retry a PayHere subscription.');
    if (input.confirmRetry !== true) throw new TypeError('confirmRetry must be true to retry a subscription.');
    const data = responseData(await this.post('/payments/payhere/subscriptions/retry', environmentPayload(GatewayCode.PayHere, input.gatewayEnvironment, {
      subscription_id: payHereSubscriptionId(input.subscriptionId), confirm_retry: true,
    }), { 'Idempotency-Key': input.idempotencyKey }));
    return SubscriptionCommandResult.fromData(data);
  }

  public async cancel(input: PayHereSubscriptionCommandInput & { readonly confirmCancel: boolean }): Promise<SubscriptionCommandResult> {
    requireText(input.idempotencyKey, 'An Idempotency-Key is required to cancel a PayHere subscription.');
    if (input.confirmCancel !== true) throw new TypeError('confirmCancel must be true to cancel a subscription.');
    const data = responseData(await this.post('/payments/payhere/subscriptions/cancel', environmentPayload(GatewayCode.PayHere, input.gatewayEnvironment, {
      subscription_id: payHereSubscriptionId(input.subscriptionId), confirm_cancel: true,
    }), { 'Idempotency-Key': input.idempotencyKey }));
    return SubscriptionCommandResult.fromData(data);
  }
}

export class PayHereChargesService extends AbstractService {
  /** Charges a stored PayHere customer token. This is irreversible. */
  public async create(input: PayHereChargeInput): Promise<PaymentPayload> {
    requireText(input.idempotencyKey, 'An Idempotency-Key is required for a PayHere token charge.');
    if (input.confirmCharge !== true) throw new TypeError('confirmCharge must be true to create a PayHere token charge.');
    return responseData(await this.post('/payments/payhere/charges', environmentPayload(GatewayCode.PayHere, input.gatewayEnvironment, {
      order_id: input.orderId, items: input.items, currency: input.currency, amount: input.amount,
      customer_token: input.customerToken, confirm_charge: true,
    }), { 'Idempotency-Key': input.idempotencyKey }));
  }
}

/** Server-only MarxPay v4 operations. */
export class MarxPayService extends AbstractService {
  public async verifyReturn(options: MarxPayReturnVerificationOptions | MarxPayReturnVerificationOptionsInput): Promise<MarxPayReturnVerification> {
    const request = options instanceof MarxPayReturnVerificationOptions ? options : new MarxPayReturnVerificationOptions(options);
    const response = expectJson(await this.post('/payments/marxpay/returns/verify', withConfiguredEnvironment(GatewayCode.MarxPay, request.gatewayEnvironment, request.toPayload())));
    return MarxPayReturnVerification.fromData(response.data, response.requestId || null);
  }

  public async initiatePayment(options: MarxPayInitiatePaymentOptions | MarxPayInitiatePaymentOptionsInput): Promise<MarxPayPaymentResult> {
    const request = options instanceof MarxPayInitiatePaymentOptions ? options : new MarxPayInitiatePaymentOptions(options);
    const response = expectJson(await this.post('/payments/marxpay/orders/initiate', withConfiguredEnvironment(GatewayCode.MarxPay, request.gatewayEnvironment, request.toPayload())));
    return MarxPayPaymentResult.fromData(response.data, response.requestId || null);
  }

  public async retrieveOrderSummary(trId: string, merchantRid: string, gatewayEnvironment?: GatewayEnvironment | null): Promise<MarxPayPaymentResult> {
    requireText(trId, 'A MarxPay trId and merchantRID are required.');
    requireText(merchantRid, 'A MarxPay trId and merchantRID are required.');
    const response = expectJson(await this.get(`/payments/marxpay/orders/${encodeURIComponent(trId.trim())}/summary`, environmentQuery(GatewayCode.MarxPay, gatewayEnvironment, { merchant_rid: merchantRid.trim() })));
    return MarxPayPaymentResult.fromData(response.data, response.requestId || null);
  }
}

/** Server-only OnePay status lookup. */
export class OnePayService extends AbstractService {
  public async status(onePayTransactionId: string, gatewayEnvironment?: GatewayEnvironment | null): Promise<PaymentPayload> {
    requireText(onePayTransactionId, 'A OnePay transaction ID is required.');
    return responseData(await this.post('/payments/onepay/status', environmentPayload(GatewayCode.OnePay, gatewayEnvironment, {
      onepay_transaction_id: onePayTransactionId,
    }), { 'X-AvraAPI-Completion-Delivery': 'merchant-server' }));
  }
}

/** Server-only signed KOKO reconciliation. */
export class KokoService extends AbstractService {
  public async orderView(orderId: string, gatewayEnvironment?: GatewayEnvironment | null): Promise<KokoOrderView> {
    requireText(orderId, 'A KOKO order ID is required.');
    const response = expectJson(await this.post('/payments/koko/orders/view', environmentPayload(GatewayCode.Koko, gatewayEnvironment, { order_id: orderId.trim() })));
    return KokoOrderView.fromData(response.data, response.requestId || null);
  }
}

/** Server-only PayPlus status reconciliation. Signed callbacks still use completePayment(). */
export class PayPlusService extends AbstractService {
  public async status(orderId: string, gatewayEnvironment?: GatewayEnvironment | null): Promise<PayPlusStatus> {
    requireText(orderId, 'A PayPlus order ID is required.');
    const response = expectJson(await this.post('/payments/payplus/status', environmentPayload(GatewayCode.PayPlus, gatewayEnvironment, { order_id: orderId.trim() })));
    return PayPlusStatus.fromData(response.data, response.requestId || null);
  }
}

/** Server-only WebXPay Merchant API lookup. Browser returns are never payment proof. */
export class WebXPayService extends AbstractService {
  public async status(orderId: string, gatewayEnvironment?: GatewayEnvironment | null): Promise<PaymentPayload> {
    requireText(orderId, 'A WebXPay order ID is required.');
    return responseData(await this.post('/payments/webxpay/status', environmentPayload(GatewayCode.WebXPay, gatewayEnvironment, { order_id: orderId.trim() }), {
      'X-AvraAPI-Completion-Delivery': 'merchant-server',
    }));
  }
}

function expectJson(response: ApiResponse | unknown): ApiResponse<PaymentPayload> {
  if (!(response instanceof ApiResponse)) throw new TypeError('AvraAPI returned an unexpected binary response for a payment operation.');
  return response as ApiResponse<PaymentPayload>;
}

function responseData(response: ApiResponse | unknown): PaymentPayload {
  return expectJson(response).data;
}

function paymentSession(response: ApiResponse | unknown): PaymentSession {
  const json = expectJson(response);
  return PaymentSession.fromData(json.data as unknown as PaymentSessionData, json.requestId);
}

function record(value: unknown): PaymentPayload {
  return value != null && typeof value === 'object' && !Array.isArray(value) ? value as PaymentPayload : {};
}

function payloadList(value: unknown): PaymentPayload[] {
  return Array.isArray(value) ? value.filter((item): item is PaymentPayload => item != null && typeof item === 'object' && !Array.isArray(item)).map((item) => ({ ...item })) : [];
}

function requireText(value: string, message: string): void {
  if (value.trim() === '') throw new TypeError(message);
}

function payHereSubscriptionId(value: string): string {
  const id = value.trim();
  if (!/^\d{1,32}$/.test(id)) throw new TypeError('subscriptionId must be a PayHere numeric subscription ID.');
  return id;
}

function environmentQuery(gateway: GatewayCode, explicit?: GatewayEnvironment | null, payload: Record<string, string> = {}): Record<string, string> {
  const environment = GatewayEnvironment.configuredFor(gateway, explicit);
  return environment == null ? payload : { ...payload, gateway_environment: environment };
}

function environmentPayload(gateway: GatewayCode, explicit: GatewayEnvironment | null | undefined, payload: PaymentPayload): PaymentPayload {
  return withConfiguredEnvironment(gateway, explicit, payload);
}

function withConfiguredEnvironment(gateway: GatewayCode, explicit: GatewayEnvironment | null | undefined, payload: PaymentPayload): PaymentPayload {
  const environment = GatewayEnvironment.configuredFor(gateway, explicit);
  const filtered = Object.fromEntries(Object.entries(payload).filter(([, value]) => value != null && value !== ''));
  return environment == null ? filtered : { ...filtered, gateway_environment: environment };
}

export { KokoCallbackPayload, KokoReturnPayload, OnePayCallbackPayload, OnePayReturnPayload, WebXPayReturnPayload };
export type { KokoCallbackPayloadInput, KokoReturnPayloadInput };
