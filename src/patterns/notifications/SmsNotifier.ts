/** SMS notifier — in production, call Twilio / Bangladesh SMS gateway here. */
import type { Notifier } from './NotificationFactory';

export class SmsNotifier implements Notifier {
  async send(to: string, message: string): Promise<void> {
    // TODO: integrate real SMS provider (e.g. Twilio, SSLCommerz SMS)
    console.log(`[SMS] To: ${to} | ${message}`);
  }
}
