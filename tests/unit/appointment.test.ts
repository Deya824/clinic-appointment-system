/**
 * Unit tests for AppointmentService.
 * Mocks IAppointmentRepository + EventBus.
 * Tests: double-booking, invalid time range, past booking,
 *        cancel (found / not-found / already-cancelled), reschedule.
 */

import { AppointmentService } from '@/services/AppointmentService';
import { EventBus }           from '@/patterns/events/EventBus';
import type { IAppointmentRepository } from '@/repositories/interfaces';
import type { Appointment } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const FUTURE_START = new Date(Date.now() + 2 * 60 * 60 * 1000); // +2h
const FUTURE_END   = new Date(Date.now() + 3 * 60 * 60 * 1000); // +3h

const BOOKED_APPT: Appointment = {
  id: 'a1',
  patientId: 'p1',
  doctorId:  'd1',
  start: FUTURE_START,
  end:   FUTURE_END,
  status: 'booked',
  createdAt: new Date(),
};

const CANCELLED_APPT: Appointment = { ...BOOKED_APPT, status: 'cancelled' };

function mockRepo(overrides: Partial<IAppointmentRepository> = {}): IAppointmentRepository {
  return {
    findById:        jest.fn().mockResolvedValue(BOOKED_APPT),
    findOverlapping: jest.fn().mockResolvedValue([]),   // no conflicts by default
    findByDoctor:    jest.fn().mockResolvedValue([BOOKED_APPT]),
    create:          jest.fn().mockResolvedValue(BOOKED_APPT),
    updateStatus:    jest.fn().mockResolvedValue(CANCELLED_APPT),
    ...overrides,
  };
}

function validInput() {
  return {
    patientId: 'p1',
    doctorId:  'd1',
    start: FUTURE_START.toISOString(),
    end:   FUTURE_END.toISOString(),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AppointmentService', () => {
  let bus: EventBus;

  beforeEach(() => { bus = new EventBus(); });

  describe('book', () => {
    it('creates appointment and emits appointment.booked', async () => {
      const repo = mockRepo();
      const svc  = new AppointmentService(repo, bus);
      const spy  = jest.fn();
      bus.on('appointment.booked', spy);

      const appt = await svc.book(validInput());
      expect(repo.create).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].appointmentId).toBe('a1');
      expect(appt.status).toBe('booked');
    });

    it('throws PAST_BOOKING when start is in the past', async () => {
      const svc = new AppointmentService(mockRepo(), bus);
      const past = new Date(Date.now() - 60_000).toISOString();
      await expect(svc.book({ ...validInput(), start: past })).rejects.toThrow('PAST_BOOKING');
    });

    it('throws INVALID_TIME_RANGE when end <= start', async () => {
      const svc = new AppointmentService(mockRepo(), bus);
      await expect(svc.book({
        ...validInput(),
        end: FUTURE_START.toISOString(), // same as start
      })).rejects.toThrow('INVALID_TIME_RANGE');
    });

    it('throws DOUBLE_BOOKING when overlapping appointment exists', async () => {
      const repo = mockRepo({ findOverlapping: jest.fn().mockResolvedValue([BOOKED_APPT]) });
      const svc  = new AppointmentService(repo, bus);
      await expect(svc.book(validInput())).rejects.toThrow('DOUBLE_BOOKING');
    });
  });

  describe('cancel', () => {
    it('cancels a booked appointment and emits appointment.cancelled', async () => {
      const repo = mockRepo();
      const svc  = new AppointmentService(repo, bus);
      const spy  = jest.fn();
      bus.on('appointment.cancelled', spy);

      await svc.cancel('a1');
      expect(repo.updateStatus).toHaveBeenCalledWith('a1', 'cancelled');
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('throws NOT_FOUND when appointment does not exist', async () => {
      const repo = mockRepo({ findById: jest.fn().mockResolvedValue(null) });
      const svc  = new AppointmentService(repo, bus);
      await expect(svc.cancel('unknown')).rejects.toThrow('NOT_FOUND');
    });

    it('throws ALREADY_CANCELLED when appointment is already cancelled', async () => {
      const repo = mockRepo({ findById: jest.fn().mockResolvedValue(CANCELLED_APPT) });
      const svc  = new AppointmentService(repo, bus);
      await expect(svc.cancel('a1')).rejects.toThrow('ALREADY_CANCELLED');
    });
  });

  describe('reschedule', () => {
    it('reschedules to new future time', async () => {
      const newStart = new Date(Date.now() + 5 * 3600_000).toISOString();
      const newEnd   = new Date(Date.now() + 6 * 3600_000).toISOString();
      const repo = mockRepo();
      const svc  = new AppointmentService(repo, bus);
      await svc.reschedule('a1', { start: newStart, end: newEnd });
      expect(repo.updateStatus).toHaveBeenCalledWith('a1', 'booked',
        expect.any(Date), expect.any(Date));
    });

    it('throws ALREADY_CANCELLED on cancelled appointment', async () => {
      const repo = mockRepo({ findById: jest.fn().mockResolvedValue(CANCELLED_APPT) });
      const svc  = new AppointmentService(repo, bus);
      await expect(svc.reschedule('a1', {})).rejects.toThrow('ALREADY_CANCELLED');
    });
  });
});
