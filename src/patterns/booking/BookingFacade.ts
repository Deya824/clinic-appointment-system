/**
 * PATTERN: Facade
 * WHY: Booking an appointment and generating its bill involves two services
 *      (AppointmentService + BillingService). The route handler would need to
 *      coordinate both, know about error handling for both, and know about
 *      fees. BookingFacade hides all that complexity behind one method.
 *      The route calls facade.bookAndBill() — that's all it knows.
 */

import type { AppointmentService } from '@/services/AppointmentService';
import type { BillingService } from '@/services/BillingService';
import type { DoctorService } from '@/services/DoctorService';
import type { Appointment, Bill } from '@/types';
import type { CreateAppointmentInput } from '@/schemas';

export interface BookingResult {
  appointment: Appointment;
  bill: Bill;
}

export class BookingFacade {
  constructor(
    private apptService:    AppointmentService,
    private billingService: BillingService,
    private doctorService:  DoctorService
  ) {}

  /** Single entry point: books an appointment AND creates its bill. */
  async bookAndBill(input: CreateAppointmentInput): Promise<BookingResult> {
    // 1. Book the appointment (validates time, checks double-booking)
    const appointment = await this.apptService.book(input);

    // 2. Get doctor fee for billing
    const doctor = await this.doctorService.getById(input.doctorId);

    // 3. Create bill with discount applied by Strategy pattern
    const bill = await this.billingService.createBillWithFee(
      appointment.id,
      input.patientId,
      doctor.consultationFee
    );

    return { appointment, bill };
  }
}
