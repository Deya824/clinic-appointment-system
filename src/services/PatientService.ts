/**
 * PatientService — register, search, edit patients.
 * Enforces unique-phone rule: if phone already exists, throws DUPLICATE_PHONE.
 * The route handler catches this and returns HTTP 409.
 */

import type { IPatientRepository } from '@/repositories/interfaces';
import type { Patient } from '@/types';
import type { CreatePatientInput, UpdatePatientInput } from '@/schemas';

export class PatientService {
  constructor(private patients: IPatientRepository) {}

  async register(input: CreatePatientInput): Promise<Patient> {
    // Enforce unique phone — Firestore has no DB-level unique constraint
    const existing = await this.patients.findByPhone(input.phone);
    if (existing) throw new Error('DUPLICATE_PHONE');

    return this.patients.create({
      name: input.name,
      phone: input.phone,
      dob: new Date(input.dob),
      patientType: input.patientType ?? 'regular',
    });
  }

  async search(query: string): Promise<Patient[]> {
    if (!query.trim()) return this.patients.list();
    return this.patients.search(query.trim());
  }

  async getById(id: string): Promise<Patient> {
    const p = await this.patients.findById(id);
    if (!p) throw new Error('NOT_FOUND');
    return p;
  }

  async update(id: string, input: UpdatePatientInput): Promise<Patient> {
    const existing = await this.patients.findById(id);
    if (!existing) throw new Error('NOT_FOUND');

    // If phone is being changed, check new phone is not already taken
    if (input.phone && input.phone !== existing.phone) {
      const conflict = await this.patients.findByPhone(input.phone);
      if (conflict) throw new Error('DUPLICATE_PHONE');
    }

    const data: Partial<Omit<Patient, 'id' | 'createdAt'>> = {};
    if (input.name) data.name = input.name;
    if (input.phone) data.phone = input.phone;
    if (input.dob) data.dob = new Date(input.dob);
    if (input.patientType) data.patientType = input.patientType;

    return this.patients.update(id, data);
  }

  async list(): Promise<Patient[]> {
    return this.patients.list();
  }
}
