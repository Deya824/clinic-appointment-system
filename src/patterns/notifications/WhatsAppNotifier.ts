/** WhatsApp notifier — in production, call WhatsApp Business API / Twilio here. */
import type { Notifier } from './NotificationFactory';

export class WhatsAppNotifier implements Notifier {
  async send(to: string, message: string): Promise<void> {
    // TODO: integrate real WhatsApp provider (e.g. Twilio, WhatsApp Business API)
    console.log(`[WHATSAPP] To: ${to} | ${message}`);
  }
}
