/**
 * AppointmentService — book, cancel, reschedule appointments.
 * Business rules:
 *  - Cannot book in the past.
 *  - Start must be before end.
 *  - No double-booking for same doctor in overlapping time slot.
 *  - Cannot cancel an already-cancelled appointment.
 * Emits events via EventBus (Observer pattern).
 */

import type { IAppointmentRepository } from '@/repositories/interfaces';
import type { Appointment } from '@/types';
import type { CreateAppointmentInput, UpdateAppointmentInput } from '@/schemas';
import type { EventBus } from '@/patterns/events/EventBus';

export class AppointmentService {
  constructor(
    private appointments: IAppointmentRepository,
    private bus: EventBus
  ) {}

  async book(input: CreateAppointmentInput): Promise<Appointment> {
    const start = new Date(input.start);
    const end   = new Date(input.end);

    // Rule: start must be in the future
    if (start <= new Date()) {
      throw new Error('PAST_BOOKING');
    }

    // Rule: end must be after start
    if (end <= start) {
      throw new Error('INVALID_TIME_RANGE');
    }

    // Rule: no double-booking for this doctor
    const overlapping = await this.appointments.findOverlapping(
      input.doctorId, start, end
    );
    if (overlapping.length > 0) {
      throw new Error('DOUBLE_BOOKING');
    }

    const appt = await this.appointments.create({
      patientId: input.patientId,
      doctorId:  input.doctorId,
      start,
      end,
      status: 'booked',
    });

    // Notify subscribers (Observer pattern)
    this.bus.emit('appointment.booked', {
      appointmentId: appt.id,
      patientId:     appt.patientId,
      doctorId:      appt.doctorId,
      start:         appt.start,
    });

    return appt;
  }

  async cancel(id: string): Promise<Appointment> {
    const appt = await this.appointments.findById(id);
    if (!appt) throw new Error('NOT_FOUND');
    if (appt.status === 'cancelled') throw new Error('ALREADY_CANCELLED');

    const updated = await this.appointments.updateStatus(id, 'cancelled');

    this.bus.emit('appointment.cancelled', {
      appointmentId: updated.id,
      patientId:     updated.patientId,
      doctorId:      updated.doctorId,
      start:         updated.start,
    });

    return updated;
  }

  async reschedule(
  id: string,
  input: Pick<UpdateAppointmentInput, 'start' | 'end'>
): Promise<Appointment> {
    const appt = await this.appointments.findById(id);
    if (!appt) throw new Error('NOT_FOUND');
    if (appt.status === 'cancelled') throw new Error('ALREADY_CANCELLED');

    const start = input.start ? new Date(input.start) : appt.start;
    const end   = input.end   ? new Date(input.end)   : appt.end;

    if (start <= new Date()) throw new Error('PAST_BOOKING');
    if (end <= start)        throw new Error('INVALID_TIME_RANGE');

    const overlapping = await this.appointments.findOverlapping(
      appt.doctorId, start, end, id // exclude self
    );
    if (overlapping.length > 0) throw new Error('DOUBLE_BOOKING');

    return this.appointments.updateStatus(id, 'booked', start, end);
  }

  async todayByDoctor(doctorId: string): Promise<Appointment[]> {
    return this.appointments.findByDoctor(doctorId, new Date());
  }
}
