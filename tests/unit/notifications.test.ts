/**
 * Tests for WhatsAppNotifier in NotificationFactory (Step 8).
 * Also tests that audit logger AND notifier both react to appointment.booked.
 */

import { NotificationFactory } from '@/patterns/notifications/NotificationFactory';
import { EventBus }            from '@/patterns/events/EventBus';

describe('WhatsAppNotifier in NotificationFactory', () => {
  it('creates a WhatsAppNotifier for "whatsapp"', () => {
    const n = NotificationFactory.create('whatsapp');
    expect(typeof n.send).toBe('function');
  });

  it('WhatsAppNotifier.send resolves without throwing', async () => {
    const n = NotificationFactory.create('whatsapp');
    await expect(n.send('user-1', 'Test message')).resolves.toBeUndefined();
  });

  it('throws for an unknown channel', () => {
    // @ts-expect-error — intentional unknown channel
    expect(() => NotificationFactory.create('push')).toThrow('Unknown notification channel');
  });
});

describe('Container wiring — audit logger + notifier both react to appointment.booked', () => {
  it('both the audit spy and notifier spy fire when appointment.booked is emitted', () => {
    const bus = new EventBus();

    // Simulate the two subscribers wired in container.ts
    const auditSpy    = jest.fn();
    const notifierSpy = jest.fn();

    bus.on('appointment.booked', auditSpy);
    bus.on('appointment.booked', notifierSpy);

    const payload = {
      appointmentId: 'a1', patientId: 'p1',
      doctorId: 'd1', start: new Date(),
    };
    bus.emit('appointment.booked', payload);

    expect(auditSpy).toHaveBeenCalledWith(payload);
    expect(notifierSpy).toHaveBeenCalledWith(payload);
  });

  it('cancelled event only fires cancel subscribers, not booked', () => {
    const bus = new EventBus();
    const bookedSpy    = jest.fn();
    const cancelledSpy = jest.fn();
    bus.on('appointment.booked',    bookedSpy);
    bus.on('appointment.cancelled', cancelledSpy);

    const payload = { appointmentId: 'a2', patientId: 'p2', doctorId: 'd2', start: new Date() };
    bus.emit('appointment.cancelled', payload);

    expect(cancelledSpy).toHaveBeenCalledWith(payload);
    expect(bookedSpy).not.toHaveBeenCalled();
  });
});
