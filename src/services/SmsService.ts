/**
 * @file src/services/SmsService.ts
 *
 * SMS Service — QuickSend.lk backed messaging operations.
 *
 * Maps to the OpenAPI `SMS` tag.
 * Endpoint prefix: /sms
 *
 * All three send methods POST to /sms/send and are differentiated by the
 * `send_method` discriminator field, exactly as defined in the SmsSendRequest
 * oneOf schema in openapi.json.
 *
 * @see https://avraapi.com/docs#tag/SMS
 */

import { AbstractService } from './AbstractService.js';
import { ApiResponse }     from '../responses/ApiResponse.js';

// ─────────────────────────────────────────────────────────────────────────────
// Request / Response types (derived from openapi.json schemas)
// ─────────────────────────────────────────────────────────────────────────────

/** Parameters for sendSingle — SmsSendSingleRequest schema. */
export interface SendSingleParams {
  /** Sri Lankan mobile number (e.g. '0771234567'). */
  readonly to: string;
  /** Text content to deliver. */
  readonly message: string;
}

/** Parameters for sendBulkSame — SmsSendBulkSameRequest schema. */
export interface SendBulkSameParams {
  /** Array of Sri Lankan mobile numbers (1–10,000). */
  readonly recipients: string[];
  /** Shared message body sent to all recipients. */
  readonly message: string;
  /**
   * When true, QuickSend returns cost info without dispatching the messages.
   * @default false
   */
  readonly checkCost?: boolean;
}

/** One row in the sendBulkDifferent message list — SmsRecipientMessage schema. */
export interface SmsRecipientMessage {
  /** Sri Lankan mobile number for this row. */
  readonly to: string;
  /** SMS content to send to this specific recipient. */
  readonly msg: string;
}

/** Parameters for sendBulkDifferent — SmsSendBulkDifferentRequest schema. */
export interface SendBulkDifferentParams {
  /**
   * Array of recipient/message pairs (max 20 per request — gateway limit).
   * Each entry must have `to` and `msg`.
   */
  readonly msgList: SmsRecipientMessage[];
}

/** Shape of the `data` field in a successful SMS send response. */
export interface SmsSendData {
  readonly send_method:       'single' | 'bulk_same' | 'bulk_different';
  readonly message_count:     number;
  readonly credits_charged:   number;
  readonly provider_response: Record<string, unknown>;
}

/** Shape of the `data` field in a successful SMS balance response. */
export interface SmsBalanceData {
  readonly source:            'quicksend_direct' | 'apix_wallet';
  readonly balance_formatted: string;
  readonly provider_response: Record<string, unknown> | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SmsService
// ─────────────────────────────────────────────────────────────────────────────

export class SmsService extends AbstractService {
  /**
   * Send a single SMS message to one recipient.
   *
   * Wraps: POST /sms/send  { send_method: "single" }
   *
   * @returns Typed ApiResponse. Key fields in `response.data`:
   *   - `send_method`       'single'
   *   - `message_count`     should be 1
   *   - `credits_charged`   integer credits deducted
   *   - `provider_response` raw QuickSend response object
   *
   * @throws {ApixValidationError}
   * @throws {ApixAuthenticationError}
   * @throws {ApixInsufficientFundsError}
   * @throws {ApixRateLimitError}
   * @throws {ApixError}
   * @throws {ApixNetworkError}
   *
   * @example
   * ```ts
   * const result = await apix.sms().sendSingle({
   *   to: '0771234567',
   *   message: 'Hello from APIX!',
   * });
   * console.log(result.data.message_count);   // 1
   * console.log(result.data.credits_charged); // 1
   * ```
   */
  public async sendSingle(params: SendSingleParams): Promise<ApiResponse<SmsSendData>> {
    const response = await this.post('/sms/send', {
      send_method: 'single',
      to:          params.to,
      message:     params.message,
    });

    return response as unknown as ApiResponse<SmsSendData>;
  }

  /**
   * Send the same SMS message to multiple recipients (broadcast).
   *
   * Wraps: POST /sms/send  { send_method: "bulk_same" }
   *
   * @returns Typed ApiResponse. Key fields in `response.data`:
   *   - `send_method`     'bulk_same'
   *   - `message_count`   number of messages dispatched
   *   - `credits_charged` integer credits deducted
   *
   * @throws {ApixValidationError}
   * @throws {ApixAuthenticationError}
   * @throws {ApixInsufficientFundsError}
   * @throws {ApixRateLimitError}
   * @throws {ApixError}
   * @throws {ApixNetworkError}
   *
   * @example
   * ```ts
   * const result = await apix.sms().sendBulkSame({
   *   recipients: ['0771234567', '0777654321'],
   *   message: 'Broadcast from APIX!',
   * });
   * console.log(result.data.message_count); // 2
   *
   * // Dry-run — get cost without sending:
   * await apix.sms().sendBulkSame({
   *   recipients: ['0771234567'],
   *   message: 'Test',
   *   checkCost: true,
   * });
   * ```
   */
  public async sendBulkSame(params: SendBulkSameParams): Promise<ApiResponse<SmsSendData>> {
    const response = await this.post('/sms/send', {
      send_method: 'bulk_same',
      recipients:  params.recipients,
      message:     params.message,
      ...(params.checkCost === true ? { check_cost: true } : {}),
    });

    return response as unknown as ApiResponse<SmsSendData>;
  }

  /**
   * Send a different message to each recipient.
   *
   * Wraps: POST /sms/send  { send_method: "bulk_different" }
   *
   * Maximum 20 entries per request — gateway-enforced limit.
   *
   * @returns Typed ApiResponse.
   *
   * @throws {ApixValidationError}
   * @throws {ApixAuthenticationError}
   * @throws {ApixInsufficientFundsError}
   * @throws {ApixRateLimitError}
   * @throws {ApixError}
   * @throws {ApixNetworkError}
   *
   * @example
   * ```ts
   * const result = await apix.sms().sendBulkDifferent({
   *   msgList: [
   *     { to: '0771234567', msg: 'Hello Alice!' },
   *     { to: '0777654321', msg: 'Hello Bob!' },
   *   ],
   * });
   * console.log(result.data.message_count); // 2
   * ```
   */
  public async sendBulkDifferent(
    params: SendBulkDifferentParams,
  ): Promise<ApiResponse<SmsSendData>> {
    const response = await this.post('/sms/send', {
      send_method: 'bulk_different',
      msg_list:    params.msgList,
    });

    return response as unknown as ApiResponse<SmsSendData>;
  }
  
  /**
   * Check the QuickSend.lk SMS balance for this project's integration.
   *
   * Wraps: POST /sms/balance
   *
   * This request is always FREE — no wallet credits are deducted.
   *
   * @returns Typed ApiResponse. Key fields in `response.data`:
   *   - `source`            'quicksend_direct' or 'apix_wallet'
   *   - `balance_formatted` human-readable balance string (e.g. '1500')
   *   - `provider_response` raw QuickSend response (may be null)
   *
   * @throws {ApixAuthenticationError}
   * @throws {ApixError}
   * @throws {ApixNetworkError}
   *
   * @example
   * ```ts
   * const balance = await apix.sms().getBalance();
   * console.log(balance.data.source);            // 'quicksend_direct'
   * console.log(balance.data.balance_formatted); // '1500'
   * ```
   */
  public async getBalance(): Promise<ApiResponse<SmsBalanceData>> {
    const response = await this.post('/sms/balance', {});
    return response as unknown as ApiResponse<SmsBalanceData>;
  }
}
