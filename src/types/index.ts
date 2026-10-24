/**
 * Domain types for the Clinic system.
 * These are plain TypeScript interfaces — no Mongoose, no Firestore imports.
 * Repositories map Firestore documents → these types.
 */

export type UserRole = 'admin' | 'doctor' | 'receptionist';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;           // unique — 409 if duplicate
  dob: Date;
  patientType: 'regular' | 'senior' | 'insured';
  createdAt: Date;
}

export interface Doctor {
  id: string;
  userId: string;          // links to User (role = doctor)
  name: string;
  specialisation: string;
  consultationFee: number; // BDT, must be >= 0
}

export interface Schedule {
  id: string;
  doctorId: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday
  startTime: string;   // "HH:MM" 24-hour
  endTime: string;     // "HH:MM" 24-hour
}

export type AppointmentStatus = 'booked' | 'cancelled' | 'completed';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  start: Date;
  end: Date;
  status: AppointmentStatus;
  createdAt: Date;
}

export type PaymentStatus = 'unpaid' | 'paid';

export interface Bill {
  id: string;
  appointmentId: string;
  patientId: string;
  amount: number;          // consultation fee after discount
  discount: number;        // amount deducted (not percentage)
  paymentStatus: PaymentStatus;
  paymentRef?: string;     // gateway transaction ID
  createdAt: Date;
}
