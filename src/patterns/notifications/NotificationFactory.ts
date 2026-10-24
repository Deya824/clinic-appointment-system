/**
 * PATTERN: Factory Method
 * WHY: The route or service that needs to send a notification should not
 *      hard-code which channel to use. NotificationFactory.create() returns
 *      the right Notifier based on a string key, so adding a new channel
 *      only requires a new class and one case here.
 */

import { EmailNotifier }    from './EmailNotifier';
import { SmsNotifier }      from './SmsNotifier';
import { WhatsAppNotifier } from './WhatsAppNotifier';

export interface Notifier {
  send(to: string, message: string): Promise<void>;
}

export type NotificationChannel = 'email' | 'sms' | 'whatsapp';

export class NotificationFactory {
  static create(channel: NotificationChannel): Notifier {
    switch (channel) {
      case 'email':    return new EmailNotifier();
      case 'sms':      return new SmsNotifier();
      case 'whatsapp': return new WhatsAppNotifier();
      default:
        // TypeScript exhaustiveness check — this line should never run
        throw new Error(`Unknown notification channel: ${channel as string}`);
    }
  }
}
