/**
 * FirestoreAppointmentRepository.
 *
 * OVERLAP CHECK STRATEGY:
 * Firestore cannot express "A.start < B.end AND A.end > B.start" as a single
 * compound query (it would need two inequality filters on different fields,
 * which Firestore forbids). Instead we:
 *   1. Query: doctorId == X AND status == "booked" AND start < newEnd
 *      (gets all appointments that START before our slot ends)
 *   2. Filter in code: keep only those where end > newStart
 *      (ensures they also END after our slot starts)
 * This is the standard approach for interval-overlap in Firestore and is safe
 * for a clinic's expected data volume (< thousands of appointments per doctor).
 */

import { Firestore, Timestamp } from 'firebase-admin/firestore';
import type { IAppointmentRepository } from './interfaces';
import type { Appointment, AppointmentStatus } from '@/types';

const COL = 'appointments';

function toAppointment(id: string, data: FirebaseFirestore.DocumentData): Appointment {
  return {
    id,
    patientId: data.patientId,
    doctorId: data.doctorId,
    start: (data.start as Timestamp).toDate(),
    end: (data.end as Timestamp).toDate(),
    status: data.status,
    createdAt: (data.createdAt as Timestamp).toDate(),
  };
}

export class FirestoreAppointmentRepo implements IAppointmentRepository {
  constructor(private db: Firestore) {}

  async findById(id: string): Promise<Appointment | null> {
    const doc = await this.db.collection(COL).doc(id).get();
    if (!doc.exists) return null;
    return toAppointment(doc.id, doc.data()!);
  }

  async findOverlapping(
    doctorId: string,
    start: Date,
    end: Date,
    excludeId?: string
  ): Promise<Appointment[]> {
    // Step 1: query — only one inequality field (start) allowed in Firestore
    const snap = await this.db
      .collection(COL)
      .where('doctorId', '==', doctorId)
      .where('status', '==', 'booked')
      .where('start', '<', Timestamp.fromDate(end))
      .get();

    // Step 2: in-code filter for the second interval condition
    return snap.docs
      .map(d => toAppointment(d.id, d.data()))
      .filter(a => a.id !== excludeId && a.end > start);
  }

  async findByDoctor(doctorId: string, date: Date): Promise<Appointment[]> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const snap = await this.db
      .collection(COL)
      .where('doctorId', '==', doctorId)
      .where('start', '>=', Timestamp.fromDate(dayStart))
      .where('start', '<=', Timestamp.fromDate(dayEnd))
      .orderBy('start')
      .get();

    return snap.docs.map(d => toAppointment(d.id, d.data()));
  }

  async create(data: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> {
    const ref = this.db.collection(COL).doc();
    const createdAt = Timestamp.now();
    await ref.set({
      ...data,
      start: Timestamp.fromDate(data.start),
      end: Timestamp.fromDate(data.end),
      createdAt,
    });
    return { id: ref.id, ...data, createdAt: createdAt.toDate() };
  }

  async updateStatus(
    id: string,
    status: AppointmentStatus,
    start?: Date,
    end?: Date
  ): Promise<Appointment> {
    const ref = this.db.collection(COL).doc(id);
    const update: Record<string, unknown> = { status };
    if (start) update.start = Timestamp.fromDate(start);
    if (end) update.end = Timestamp.fromDate(end);
    await ref.update(update);
    const doc = await ref.get();
    return toAppointment(doc.id, doc.data()!);
  }
}
