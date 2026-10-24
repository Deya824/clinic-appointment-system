/**
 * DoctorService — manage doctors and schedules.
 */

import type { IDoctorRepository, IScheduleRepository } from '@/repositories/interfaces';
import type { Doctor, Schedule } from '@/types';
import type { CreateDoctorInput } from '@/schemas';
import { z } from 'zod';
import { CreateScheduleSchema } from '@/schemas';

type CreateScheduleInput = z.infer<typeof CreateScheduleSchema>;

export class DoctorService {
  constructor(
    private doctors:   IDoctorRepository,
    private schedules: IScheduleRepository
  ) {}

  async list(): Promise<Doctor[]> {
    return this.doctors.list();
  }

  async getById(id: string): Promise<Doctor> {
    const d = await this.doctors.findById(id);
    if (!d) throw new Error('NOT_FOUND');
    return d;
  }

  async create(input: CreateDoctorInput): Promise<Doctor> {
    if (input.consultationFee < 0) throw new Error('NEGATIVE_FEE');
    return this.doctors.create(input);
  }

  async getSchedule(doctorId: string): Promise<Schedule[]> {
    return this.schedules.findByDoctor(doctorId);
  }

  async addSchedule(input: CreateScheduleInput): Promise<Schedule> {
    if (input.startTime >= input.endTime) throw new Error('INVALID_SCHEDULE_TIME');
    return this.schedules.create(input);
  }
}
