/**
 * PATTERN: Adapter
 * WHY: BkashClient has its own API shape (different method names, response
 *      structure). Rather than letting services know about Bkash internals,
 *      BkashAdapter wraps BkashClient behind the PaymentGateway interface.
 *      Switching to a different gateway (Nagad, SSL) only means writing a
 *      new adapter — no service code changes.
 */

/** Common interface all gateways must satisfy. */
export interface PaymentGateway {
  charge(amount: number, ref: string): Promise<{ success: boolean; transactionId: string }>;
}

/** Simulates Bkash's real API shape (different from our interface). */
export class BkashClient {
  async executePayment(payload: {
    amount: number;
    merchantInvoiceNumber: string;
  }): Promise<{ statusCode: string; trxID: string }> {
    // In production: call https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/execute
    console.log('[BKASH] executePayment', payload);
    return { statusCode: '0000', trxID: `BK-${Date.now()}` };
  }
}

/** Adapter: translates our PaymentGateway calls → BkashClient calls. */
export class BkashAdapter implements PaymentGateway {
  constructor(private client: BkashClient) {}

  async charge(
    amount: number,
    ref: string
  ): Promise<{ success: boolean; transactionId: string }> {
    try {
      const result = await this.client.executePayment({
        amount,
        merchantInvoiceNumber: ref,
      });
      // Translate Bkash response → our common shape
      return {
        success: result.statusCode === '0000',
        transactionId: result.trxID,
      };
    } catch (err) {
      // Adapter absorbs gateway-specific errors; callers see a standard shape
      console.error('[BkashAdapter] payment failed', err);
      return { success: false, transactionId: '' };
    }
  }
}

/** FakeGateway — used in demo and unit tests instead of real network calls. */
export class FakeGateway implements PaymentGateway {
  async charge(
    amount: number,
    ref: string
  ): Promise<{ success: boolean; transactionId: string }> {
    if (amount <= 0) {
      return { success: false, transactionId: '' };
    }
    return { success: true, transactionId: `FAKE-${ref}-${Date.now()}` };
  }
}
