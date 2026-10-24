/**
 * BillingService — create bills and process payments.
 * Uses DiscountStrategy (Strategy pattern) to compute discounts.
 * Uses PaymentGateway (Adapter pattern) for payment processing.
 */

import type { IBillRepository, IPatientRepository } from '@/repositories/interfaces';
import type { Bill } from '@/types';
import type { PaymentGateway } from '@/patterns/payments/PaymentGateway';
import { getDiscount } from '@/patterns/billing/DiscountStrategy';

export class BillingService {
  constructor(
    private bills:    IBillRepository,
    private patients: IPatientRepository,
    private gateway:  PaymentGateway
  ) {}

  /**
   * Create a bill for an appointment with an explicit fee.
   * The fee comes from the doctor record (fetched by BookingFacade or the route).
   * Applies the correct discount strategy based on patient type.
   */
  async createBillWithFee(
    appointmentId: string,
    patientId: string,
    fee: number
  ): Promise<Bill> {
    if (fee < 0) throw new Error('NEGATIVE_FEE');

    const existing = await this.bills.findByAppointment(appointmentId);
    if (existing) throw new Error('BILL_EXISTS');

    const patient = await this.patients.findById(patientId);
    if (!patient) throw new Error('PATIENT_NOT_FOUND');

    // Strategy pattern: pick discount based on patient type
    const strategy = getDiscount(patient.patientType);
    const discount  = strategy.calculate(fee);
    const amount    = fee - discount;

    return this.bills.create({
      appointmentId,
      patientId,
      amount,
      discount,
      paymentStatus: 'unpaid',
    });
  }

  /** Process a payment through the gateway; mark bill paid on success. */
  async pay(billId: string, amount: number): Promise<Bill> {
    const bill = await this.bills.findById(billId);
    if (!bill) throw new Error('BILL_NOT_FOUND');
    if (bill.paymentStatus === 'paid') throw new Error('ALREADY_PAID');
    if (amount <= 0) throw new Error('INVALID_AMOUNT');

    const result = await this.gateway.charge(amount, billId);
    if (!result.success) throw new Error('PAYMENT_FAILED');

    return this.bills.markPaid(billId, result.transactionId);
  }

  async getBill(billId: string): Promise<Bill> {
    const bill = await this.bills.findById(billId);
    if (!bill) throw new Error('BILL_NOT_FOUND');
    return bill;
  }
}
