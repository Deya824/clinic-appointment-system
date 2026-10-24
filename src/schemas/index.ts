/**
 * Zod validation schemas for HTTP request bodies.
 * Routes use these to validate incoming JSON before passing to services.
 * Keeping validation separate from types lets us reuse schemas for docs too.
 */

import { z } from 'zod';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// ── User / Registration ───────────────────────────────────────────────────────
export const CreateUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'doctor', 'receptionist']),
});

// ── Patient ───────────────────────────────────────────────────────────────────
export const CreatePatientSchema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number'),
  dob: z.string().datetime({ offset: true }).or(z.string().date()),
  patientType: z.enum(['regular', 'senior', 'insured']).default('regular'),
});

export const UpdatePatientSchema = CreatePatientSchema.partial();

// ── Doctor ────────────────────────────────────────────────────────────────────
export const CreateDoctorSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(2),
  specialisation: z.string().min(2),
  consultationFee: z.number().nonnegative('Fee cannot be negative'),
});

// ── Schedule ──────────────────────────────────────────────────────────────────
export const CreateScheduleSchema = z.object({
  doctorId: z.string().min(1),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM'),
});

// ── Appointment ───────────────────────────────────────────────────────────────
export const CreateAppointmentSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  start: z.string().datetime({ offset: true }),
  end: z.string().datetime({ offset: true }),
});

export const UpdateAppointmentSchema = z.object({
  status: z.enum(['cancelled', 'completed']),
  start: z.string().datetime({ offset: true }).optional(),
  end: z.string().datetime({ offset: true }).optional(),
});

// ── Billing ───────────────────────────────────────────────────────────────────
export const CreateBillSchema = z.object({
  appointmentId: z.string().min(1),
  patientId: z.string().min(1),
});

export const PayBillSchema = z.object({
  billId: z.string().min(1),
  method: z.enum(['bkash', 'fake']).default('fake'),
  amount: z.number().positive(),
});

// Inferred TypeScript types from schemas (DRY)
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreatePatientInput = z.infer<typeof CreatePatientSchema>;
export type UpdatePatientInput = z.infer<typeof UpdatePatientSchema>;
export type CreateDoctorInput = z.infer<typeof CreateDoctorSchema>;
export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof UpdateAppointmentSchema>;
export type PayBillInput = z.infer<typeof PayBillSchema>;
