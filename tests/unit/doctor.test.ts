/**
 * Unit tests for DoctorService (previously 0% coverage).
 * Mocks IDoctorRepository and IScheduleRepository — no Firestore.
 */

import { DoctorService } from '@/services/DoctorService';
import type { IDoctorRepository, IScheduleRepository } from '@/repositories/interfaces';
import type { Doctor, Schedule } from '@/types';

const mockDoctor: Doctor = {
  id: 'd1', userId: 'u1', name: 'Dr Smith',
  specialisation: 'GP', consultationFee: 600,
};

const mockSchedule: Schedule = {
  id: 's1', doctorId: 'd1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00',
};

function makeDoctorRepo(doctor: Doctor | null = mockDoctor): IDoctorRepository {
  return {
    findById: jest.fn().mockResolvedValue(doctor),
    list:     jest.fn().mockResolvedValue([mockDoctor]),
    create:   jest.fn().mockResolvedValue(mockDoctor),
    update:   jest.fn().mockResolvedValue(mockDoctor),
  };
}

function makeScheduleRepo(): IScheduleRepository {
  return {
    findByDoctor: jest.fn().mockResolvedValue([mockSchedule]),
    create:       jest.fn().mockResolvedValue(mockSchedule),
  };
}

describe('DoctorService', () => {
  describe('list()', () => {
    it('returns all doctors', async () => {
      const svc = new DoctorService(makeDoctorRepo(), makeScheduleRepo());
      const result = await svc.list();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Dr Smith');
    });
  });

  describe('getById()', () => {
    it('returns the doctor when found', async () => {
      const svc = new DoctorService(makeDoctorRepo(mockDoctor), makeScheduleRepo());
      const d = await svc.getById('d1');
      expect(d.id).toBe('d1');
    });

    it('throws NOT_FOUND when doctor does not exist', async () => {
      const svc = new DoctorService(makeDoctorRepo(null), makeScheduleRepo());
      await expect(svc.getById('x')).rejects.toThrow('NOT_FOUND');
    });
  });

  describe('create()', () => {
    it('creates a doctor with a valid fee', async () => {
      const svc = new DoctorService(makeDoctorRepo(), makeScheduleRepo());
      const d = await svc.create({ userId: 'u1', name: 'Dr Smith', specialisation: 'GP', consultationFee: 600 });
      expect(d.consultationFee).toBe(600);
    });

    it('throws NEGATIVE_FEE for negative consultation fee', async () => {
      const svc = new DoctorService(makeDoctorRepo(), makeScheduleRepo());
      await expect(
        svc.create({ userId: 'u1', name: 'Dr X', specialisation: 'GP', consultationFee: -1 })
      ).rejects.toThrow('NEGATIVE_FEE');
    });
  });

  describe('getSchedule()', () => {
    it('returns schedule slots for a doctor', async () => {
      const svc = new DoctorService(makeDoctorRepo(), makeScheduleRepo());
      const slots = await svc.getSchedule('d1');
      expect(slots).toHaveLength(1);
      expect(slots[0].startTime).toBe('09:00');
    });
  });

  describe('addSchedule()', () => {
    it('creates a schedule slot when times are valid', async () => {
      const svc = new DoctorService(makeDoctorRepo(), makeScheduleRepo());
      const slot = await svc.addSchedule({ doctorId: 'd1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00' });
      expect(slot.id).toBe('s1');
    });

    it('throws INVALID_SCHEDULE_TIME when startTime >= endTime', async () => {
      const svc = new DoctorService(makeDoctorRepo(), makeScheduleRepo());
      await expect(
        svc.addSchedule({ doctorId: 'd1', dayOfWeek: 1, startTime: '17:00', endTime: '09:00' })
      ).rejects.toThrow('INVALID_SCHEDULE_TIME');
    });

    it('throws INVALID_SCHEDULE_TIME when times are equal', async () => {
      const svc = new DoctorService(makeDoctorRepo(), makeScheduleRepo());
      await expect(
        svc.addSchedule({ doctorId: 'd1', dayOfWeek: 1, startTime: '09:00', endTime: '09:00' })
      ).rejects.toThrow('INVALID_SCHEDULE_TIME');
    });
  });
});
