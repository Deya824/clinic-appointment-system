/**
 * Unit tests for BillingService.
 * Mocks IBillRepository, IPatientRepository, PaymentGateway.
 * Tests: negative fee, duplicate bill, discount per patient type,
 *        pay success / failure / pay twice.
 */

import { BillingService }       from '@/services/BillingService';
import { FakeGateway }          from '@/patterns/payments/PaymentGateway';
import type { IBillRepository, IPatientRepository } from '@/repositories/interfaces';
import type { Bill, Patient }   from '@/types';
import type { PaymentGateway }  from '@/patterns/payments/PaymentGateway';

// ── Helpers ───────────────────────────────────────────────────────────────────

const PATIENT_REGULAR: Patient = {
  id: 'p1', name: 'Alice', phone: '01711000001',
  dob: new Date('1990-01-01'), patientType: 'regular', createdAt: new Date(),
};
const PATIENT_SENIOR: Patient  = { ...PATIENT_REGULAR, id: 'p2', patientType: 'senior' };
const PATIENT_INSURED: Patient = { ...PATIENT_REGULAR, id: 'p3', patientType: 'insured' };

const UNPAID_BILL: Bill = {
  id: 'b1', appointmentId: 'a1', patientId: 'p1',
  amount: 500, discount: 0, paymentStatus: 'unpaid', createdAt: new Date(),
};
const PAID_BILL: Bill = { ...UNPAID_BILL, paymentStatus: 'paid', paymentRef: 'REF-1' };

function mockBillRepo(overrides: Partial<IBillRepository> = {}): IBillRepository {
  return {
    findById:          jest.fn().mockResolvedValue(UNPAID_BILL),
    findByAppointment: jest.fn().mockResolvedValue(null),   // no existing bill by default
    create:            jest.fn().mockImplementation(async (d) => ({ id: 'b-new', createdAt: new Date(), ...d })),
    markPaid:          jest.fn().mockResolvedValue(PAID_BILL),
    ...overrides,
  };
}

function mockPatientRepo(patient: Patient): IPatientRepository {
  return {
    findById:    jest.fn().mockResolvedValue(patient),
    findByPhone: jest.fn(),
    search:      jest.fn(),
    list:        jest.fn(),
    create:      jest.fn(),
    update:      jest.fn(),
  };
}

function svc(
  billRepo: IBillRepository,
  patient: Patient,
  gateway: PaymentGateway = new FakeGateway()
): BillingService {
  return new BillingService(billRepo, mockPatientRepo(patient), gateway);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('BillingService', () => {
  describe('createBillWithFee', () => {
    it('creates bill with no discount for regular patient', async () => {
      const repo = mockBillRepo();
      const s    = svc(repo, PATIENT_REGULAR);
      await s.createBillWithFee('a1', 'p1', 500);
      const created = (repo.create as jest.Mock).mock.calls[0][0];
      expect(created.amount).toBe(500);
      expect(created.discount).toBe(0);
    });

    it('applies 20% discount for senior patient', async () => {
      const repo = mockBillRepo();
      const s    = svc(repo, PATIENT_SENIOR);
      await s.createBillWithFee('a1', 'p2', 500);
      const created = (repo.create as jest.Mock).mock.calls[0][0];
      expect(created.discount).toBe(100); // 20% of 500
      expect(created.amount).toBe(400);
    });

    it('applies 50% discount for insured patient', async () => {
      const repo = mockBillRepo();
      const s    = svc(repo, PATIENT_INSURED);
      await s.createBillWithFee('a1', 'p3', 500);
      const created = (repo.create as jest.Mock).mock.calls[0][0];
      expect(created.discount).toBe(250);
      expect(created.amount).toBe(250);
    });

    it('throws NEGATIVE_FEE when fee < 0', async () => {
      const s = svc(mockBillRepo(), PATIENT_REGULAR);
      await expect(s.createBillWithFee('a1', 'p1', -1)).rejects.toThrow('NEGATIVE_FEE');
    });

    it('throws BILL_EXISTS when bill already created for appointment', async () => {
      const repo = mockBillRepo({ findByAppointment: jest.fn().mockResolvedValue(UNPAID_BILL) });
      const s    = svc(repo, PATIENT_REGULAR);
      await expect(s.createBillWithFee('a1', 'p1', 500)).rejects.toThrow('BILL_EXISTS');
    });

    it('throws PATIENT_NOT_FOUND when patient missing', async () => {
      const billRepo = mockBillRepo();
      const patRepo: IPatientRepository = {
        findById:    jest.fn().mockResolvedValue(null),
        findByPhone: jest.fn(), search: jest.fn(), list: jest.fn(),
        create: jest.fn(), update: jest.fn(),
      };
      const s = new BillingService(billRepo, patRepo, new FakeGateway());
      await expect(s.createBillWithFee('a1', 'p-ghost', 500)).rejects.toThrow('PATIENT_NOT_FOUND');
    });
  });

  describe('pay', () => {
    it('marks bill paid on gateway success', async () => {
      const repo = mockBillRepo();
      const s    = svc(repo, PATIENT_REGULAR);
      const result = await s.pay('b1', 500);
      expect(result.paymentStatus).toBe('paid');
      expect(repo.markPaid).toHaveBeenCalledTimes(1);
    });

    it('throws PAYMENT_FAILED when gateway declines', async () => {
      const failGateway: PaymentGateway = {
        charge: jest.fn().mockResolvedValue({ success: false, transactionId: '' }),
      };
      const s = svc(mockBillRepo(), PATIENT_REGULAR, failGateway);
      await expect(s.pay('b1', 500)).rejects.toThrow('PAYMENT_FAILED');
    });

    it('throws ALREADY_PAID when bill already paid', async () => {
      const repo = mockBillRepo({ findById: jest.fn().mockResolvedValue(PAID_BILL) });
      const s    = svc(repo, PATIENT_REGULAR);
      await expect(s.pay('b1', 500)).rejects.toThrow('ALREADY_PAID');
    });

    it('throws BILL_NOT_FOUND when bill does not exist', async () => {
      const repo = mockBillRepo({ findById: jest.fn().mockResolvedValue(null) });
      const s    = svc(repo, PATIENT_REGULAR);
      await expect(s.pay('ghost', 500)).rejects.toThrow('BILL_NOT_FOUND');
    });

    it('throws INVALID_AMOUNT when amount <= 0', async () => {
      const s = svc(mockBillRepo(), PATIENT_REGULAR);
      await expect(s.pay('b1', 0)).rejects.toThrow('INVALID_AMOUNT');
    });
  });
});
