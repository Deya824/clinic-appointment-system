/** Email notifier — in production, call an SMTP/SendGrid SDK here. */
import type { Notifier } from './NotificationFactory';

export class EmailNotifier implements Notifier {
  async send(to: string, message: string): Promise<void> {
    // TODO: integrate real email provider (e.g. SendGrid, Nodemailer)
    console.log(`[EMAIL] To: ${to} | ${message}`);
  }
}
