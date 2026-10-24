/**
 * Unit tests for design patterns.
 * Tests: Adapter (BkashAdapter), Factory (NotificationFactory),
 *        EventBus (multiple subscribers), DiscountStrategy, BookingFacade.
 */

import { BkashAdapter, BkashClient, FakeGateway } from '@/patterns/payments/PaymentGateway';
import { NotificationFactory }                    from '@/patterns/notifications/NotificationFactory';
import { EventBus }                               from '@/patterns/events/EventBus';
import {
  NoDiscount, SeniorDiscount, InsuranceDiscount, getDiscount,
} from '@/patterns/billing/DiscountStrategy';
import { BookingFacade }    from '@/patterns/booking/BookingFacade';
import type { AppointmentService } from '@/services/AppointmentService';
import type { BillingService }     from '@/services/BillingService';
import type { DoctorService }      from '@/services/DoctorService';
import type { Appointment, Bill, Doctor } from '@/types';

// ── Adapter ───────────────────────────────────────────────────────────────────

describe('BkashAdapter', () => {
  it('translates a successful BkashClient response to gateway shape', async () => {
    const client = new BkashClient();
    jest.spyOn(client, 'executePayment').mockResolvedValue({ statusCode: '0000', trxID: 'TRX1' });
    const adapter = new BkashAdapter(client);
    const result  = await adapter.charge(500, 'REF-1');
    expect(result.success).toBe(true);
    expect(result.transactionId).toBe('TRX1');
    expect(client.executePayment).toHaveBeenCalledWith({ amount: 500, merchantInvoiceNumber: 'REF-1' });
  });

  it('returns success:false when BkashClient returns non-0000 code', async () => {
    const client = new BkashClient();
    jest.spyOn(client, 'executePayment').mockResolvedValue({ statusCode: '9999', trxID: '' });
    const adapter = new BkashAdapter(client);
    const result  = await adapter.charge(500, 'REF-2');
    expect(result.success).toBe(false);
  });

  it('returns success:false and absorbs exceptions from BkashClient', async () => {
    const client = new BkashClient();
    jest.spyOn(client, 'executePayment').mockRejectedValue(new Error('Network error'));
    const adapter = new BkashAdapter(client);
    const result  = await adapter.charge(500, 'REF-3');
    expect(result.success).toBe(false);
    expect(result.transactionId).toBe('');
  });

  it('FakeGateway succeeds for positive amounts', async () => {
    const gw = new FakeGateway();
    const r  = await gw.charge(100, 'ref');
    expect(r.success).toBe(true);
    expect(r.transactionId).toMatch(/FAKE/);
  });

  it('FakeGateway fails for zero/negative amounts', async () => {
    const gw = new FakeGateway();
    expect((await gw.charge(0, 'ref')).success).toBe(false);
    expect((await gw.charge(-1, 'ref')).success).toBe(false);
  });
});

// ── Factory ───────────────────────────────────────────────────────────────────

describe('NotificationFactory', () => {
  it('creates an EmailNotifier for "email"', () => {
    const n = NotificationFactory.create('email');
    expect(typeof n.send).toBe('function');
  });

  it('creates an SmsNotifier for "sms"', () => {
    const n = NotificationFactory.create('sms');
    expect(typeof n.send).toBe('function');
  });

  it('throws for an unknown channel', () => {
    // @ts-expect-error — intentional unknown channel
    expect(() => NotificationFactory.create('push')).toThrow('Unknown notification channel');
  });
});

// ── EventBus ──────────────────────────────────────────────────────────────────

describe('EventBus', () => {
  const payload = {
    appointmentId: 'a1', patientId: 'p1',
    doctorId: 'd1', start: new Date(),
  };

  it('calls all subscribers for an event', () => {
    const bus  = new EventBus();
    const spy1 = jest.fn();
    const spy2 = jest.fn();
    bus.on('appointment.booked', spy1);
    bus.on('appointment.booked', spy2);
    bus.emit('appointment.booked', payload);
    expect(spy1).toHaveBeenCalledWith(payload);
    expect(spy2).toHaveBeenCalledWith(payload);
  });

  it('does not call subscribers of a different event', () => {
    const bus = new EventBus();
    const spy = jest.fn();
    bus.on('appointment.cancelled', spy);
    bus.emit('appointment.booked', payload);
    expect(spy).not.toHaveBeenCalled();
  });

  it('handles emit with no subscribers gracefully', () => {
    const bus = new EventBus();
    expect(() => bus.emit('appointment.booked', payload)).not.toThrow();
  });
});

// ── Strategy ──────────────────────────────────────────────────────────────────

describe('DiscountStrategy', () => {
  it('NoDiscount returns 0', () => {
    expect(new NoDiscount().calculate(500)).toBe(0);
  });

  it('SeniorDiscount returns 20% of fee', () => {
    expect(new SeniorDiscount().calculate(500)).toBe(100);
  });

  it('InsuranceDiscount returns 50% of fee', () => {
    expect(new InsuranceDiscount().calculate(500)).toBe(250);
  });

  it('getDiscount returns NoDiscount for unknown type', () => {
    const s = getDiscount('vip');
    expect(s.calculate(100)).toBe(0);
  });

  it('getDiscount returns correct strategy for each type', () => {
    expect(getDiscount('regular').calculate(100)).toBe(0);
    expect(getDiscount('senior').calculate(100)).toBe(20);
    expect(getDiscount('insured').calculate(100)).toBe(50);
  });
});

// ── Facade ────────────────────────────────────────────────────────────────────

describe('BookingFacade', () => {
  const futureStart = new Date(Date.now() + 2 * 3600_000).toISOString();
  const futureEnd   = new Date(Date.now() + 3 * 3600_000).toISOString();

  const mockAppt: Appointment = {
    id: 'a1', patientId: 'p1', doctorId: 'd1',
    start: new Date(futureStart), end: new Date(futureEnd),
    status: 'booked', createdAt: new Date(),
  };
  const mockDoctor: Doctor = {
    id: 'd1', userId: 'u1', name: 'Dr Smith',
    specialisation: 'GP', consultationFee: 600,
  };
  const mockBill: Bill = {
    id: 'b1', appointmentId: 'a1', patientId: 'p1',
    amount: 600, discount: 0, paymentStatus: 'unpaid', createdAt: new Date(),
  };

  it('calls book, getById and createBillWithFee in correct order', async () => {
    const apptSvc = {
      book: jest.fn().mockResolvedValue(mockAppt),
    } as unknown as AppointmentService;
    const docSvc = {
      getById: jest.fn().mockResolvedValue(mockDoctor),
    } as unknown as DoctorService;
    const billSvc = {
      createBillWithFee: jest.fn().mockResolvedValue(mockBill),
    } as unknown as BillingService;

    const facade = new BookingFacade(apptSvc, billSvc, docSvc);
    const result = await facade.bookAndBill({
      patientId: 'p1', doctorId: 'd1',
      start: futureStart, end: futureEnd,
    });

    expect(apptSvc.book).toHaveBeenCalledTimes(1);
    expect(docSvc.getById).toHaveBeenCalledWith('d1');
    expect(billSvc.createBillWithFee).toHaveBeenCalledWith('a1', 'p1', 600);
    expect(result.appointment.id).toBe('a1');
    expect(result.bill.id).toBe('b1');
  });
});
