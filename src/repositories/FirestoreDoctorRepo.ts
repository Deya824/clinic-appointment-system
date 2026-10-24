/**
 * FirestoreDoctorRepository — Firestore CRUD for doctors and schedules.
 */

import { Firestore } from 'firebase-admin/firestore';
import type { IDoctorRepository, IScheduleRepository } from './interfaces';
import type { Doctor, Schedule } from '@/types';

const DOCTORS_COL = 'doctors';
const SCHEDULES_COL = 'schedules';

function toDoctor(id: string, data: FirebaseFirestore.DocumentData): Doctor {
  return {
    id,
    userId: data.userId,
    name: data.name,
    specialisation: data.specialisation,
    consultationFee: data.consultationFee,
  };
}

function toSchedule(id: string, data: FirebaseFirestore.DocumentData): Schedule {
  return {
    id,
    doctorId: data.doctorId,
    dayOfWeek: data.dayOfWeek,
    startTime: data.startTime,
    endTime: data.endTime,
  };
}

export class FirestoreDoctorRepo implements IDoctorRepository {
  constructor(private db: Firestore) {}

  async findById(id: string): Promise<Doctor | null> {
    const doc = await this.db.collection(DOCTORS_COL).doc(id).get();
    if (!doc.exists) return null;
    return toDoctor(doc.id, doc.data()!);
  }

  async list(): Promise<Doctor[]> {
    const snap = await this.db.collection(DOCTORS_COL).orderBy('name').get();
    return snap.docs.map(d => toDoctor(d.id, d.data()));
  }

  async create(data: Omit<Doctor, 'id'>): Promise<Doctor> {
    const ref = this.db.collection(DOCTORS_COL).doc();
    await ref.set(data);
    return { id: ref.id, ...data };
  }

  async update(id: string, data: Partial<Omit<Doctor, 'id'>>): Promise<Doctor> {
    const ref = this.db.collection(DOCTORS_COL).doc(id);
    await ref.update(data as Record<string, unknown>);
    const doc = await ref.get();
    return toDoctor(doc.id, doc.data()!);
  }
}

export class FirestoreScheduleRepo implements IScheduleRepository {
  constructor(private db: Firestore) {}

  async findByDoctor(doctorId: string): Promise<Schedule[]> {
    const snap = await this.db
      .collection(SCHEDULES_COL)
      .where('doctorId', '==', doctorId)
      .get();
    return snap.docs.map(d => toSchedule(d.id, d.data()));
  }

  async create(data: Omit<Schedule, 'id'>): Promise<Schedule> {
    const ref = this.db.collection(SCHEDULES_COL).doc();
    await ref.set(data);
    return { id: ref.id, ...data };
  }
}
