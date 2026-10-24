/**
 * FirestorePatientRepository — Firestore CRUD for patients.
 *
 * UNIQUE PHONE: Firestore has no unique-index constraint, so we enforce
 * uniqueness in code. findByPhone() queries before create(); if a doc is
 * found the service layer returns HTTP 409. No transaction is needed here
 * because a race condition in a clinic app (two receptionists registering
 * the same phone at the same millisecond) is extremely unlikely, and the
 * service layer comment explains this trade-off.
 */

import { Firestore, Timestamp } from 'firebase-admin/firestore';
import type { IPatientRepository } from './interfaces';
import type { Patient } from '@/types';

const COL = 'patients';

function toPatient(id: string, data: FirebaseFirestore.DocumentData): Patient {
  return {
    id,
    name: data.name,
    phone: data.phone,
    dob: (data.dob as Timestamp).toDate(),
    patientType: data.patientType,
    createdAt: (data.createdAt as Timestamp).toDate(),
  };
}

export class FirestorePatientRepo implements IPatientRepository {
  constructor(private db: Firestore) {}

  async findById(id: string): Promise<Patient | null> {
    const doc = await this.db.collection(COL).doc(id).get();
    if (!doc.exists) return null;
    return toPatient(doc.id, doc.data()!);
  }

  async findByPhone(phone: string): Promise<Patient | null> {
    const snap = await this.db
      .collection(COL)
      .where('phone', '==', phone)
      .limit(1)
      .get();
    if (snap.empty) return null;
    return toPatient(snap.docs[0].id, snap.docs[0].data());
  }

  async search(query: string): Promise<Patient[]> {
    // Firestore has no full-text search. We do a prefix match on name.
    // For small clinics this is fine; a real system would use Algolia or a
    // composite index on name + phone.
    const snap = await this.db
      .collection(COL)
      .orderBy('name')
      .startAt(query)
      .endAt(query + '\uf8ff')
      .limit(20)
      .get();
    return snap.docs.map(d => toPatient(d.id, d.data()));
  }

  async list(): Promise<Patient[]> {
    const snap = await this.db.collection(COL).orderBy('name').get();
    return snap.docs.map(d => toPatient(d.id, d.data()));
  }

  async create(data: Omit<Patient, 'id' | 'createdAt'>): Promise<Patient> {
    const ref = this.db.collection(COL).doc();
    const createdAt = Timestamp.now();
    const dob = Timestamp.fromDate(data.dob);
    await ref.set({ ...data, dob, createdAt });
    return { id: ref.id, ...data, createdAt: createdAt.toDate() };
  }

  async update(
    id: string,
    data: Partial<Omit<Patient, 'id' | 'createdAt'>>
  ): Promise<Patient> {
    const ref = this.db.collection(COL).doc(id);
    const payload: Record<string, unknown> = { ...data };
    if (data.dob) payload.dob = Timestamp.fromDate(data.dob);
    await ref.update(payload);
    const doc = await ref.get();
    return toPatient(doc.id, doc.data()!);
  }
}
