/**
 * Repository interfaces — the contract every Firestore repo must satisfy.
 * Services depend on these interfaces, not on concrete classes.
 * This makes unit-testing easy: just pass a mock that implements the interface.
 */

import type {
  User, Patient, Doctor, Schedule, Appointment, Bill, AppointmentStatus,
} from '@/types';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: Omit<User, 'id' | 'createdAt'>): Promise<User>;
}

export interface IPatientRepository {
  findById(id: string): Promise<Patient | null>;
  findByPhone(phone: string): Promise<Patient | null>;
  search(query: string): Promise<Patient[]>; // name or phone prefix
  create(data: Omit<Patient, 'id' | 'createdAt'>): Promise<Patient>;
  update(id: string, data: Partial<Omit<Patient, 'id' | 'createdAt'>>): Promise<Patient>;
  list(): Promise<Patient[]>;
}

export interface IDoctorRepository {
  findById(id: string): Promise<Doctor | null>;
  list(): Promise<Doctor[]>;
  create(data: Omit<Doctor, 'id'>): Promise<Doctor>;
  update(id: string, data: Partial<Omit<Doctor, 'id'>>): Promise<Doctor>;
}

export interface IScheduleRepository {
  findByDoctor(doctorId: string): Promise<Schedule[]>;
  create(data: Omit<Schedule, 'id'>): Promise<Schedule>;
}

export interface IAppointmentRepository {
  findById(id: string): Promise<Appointment | null>;
  findOverlapping(doctorId: string, start: Date, end: Date, excludeId?: string): Promise<Appointment[]>;
  findByDoctor(doctorId: string, date: Date): Promise<Appointment[]>;
  create(data: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment>;
  updateStatus(id: string, status: AppointmentStatus, start?: Date, end?: Date): Promise<Appointment>;
}

export interface IBillRepository {
  findById(id: string): Promise<Bill | null>;
  findByAppointment(appointmentId: string): Promise<Bill | null>;
  create(data: Omit<Bill, 'id' | 'createdAt'>): Promise<Bill>;
  markPaid(id: string, paymentRef: string): Promise<Bill>;
}
