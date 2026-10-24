/**
 * FirestoreBillRepository — Firestore CRUD for bills.
 */

import { Firestore, Timestamp } from 'firebase-admin/firestore';
import type { IBillRepository } from './interfaces';
import type { Bill } from '@/types';

const COL = 'bills';

function toBill(id: string, data: FirebaseFirestore.DocumentData): Bill {
  return {
    id,
    appointmentId: data.appointmentId,
    patientId: data.patientId,
    amount: data.amount,
    discount: data.discount,
    paymentStatus: data.paymentStatus,
    paymentRef: data.paymentRef,
    createdAt: (data.createdAt as Timestamp).toDate(),
  };
}

export class FirestoreBillRepo implements IBillRepository {
  constructor(private db: Firestore) {}

  async findById(id: string): Promise<Bill | null> {
    const doc = await this.db.collection(COL).doc(id).get();
    if (!doc.exists) return null;
    return toBill(doc.id, doc.data()!);
  }

  async findByAppointment(appointmentId: string): Promise<Bill | null> {
    const snap = await this.db
      .collection(COL)
      .where('appointmentId', '==', appointmentId)
      .limit(1)
      .get();
    if (snap.empty) return null;
    return toBill(snap.docs[0].id, snap.docs[0].data());
  }

  async create(data: Omit<Bill, 'id' | 'createdAt'>): Promise<Bill> {
    const ref = this.db.collection(COL).doc();
    const createdAt = Timestamp.now();
    await ref.set({ ...data, createdAt });
    return { id: ref.id, ...data, createdAt: createdAt.toDate() };
  }

  async markPaid(id: string, paymentRef: string): Promise<Bill> {
    const ref = this.db.collection(COL).doc(id);
    await ref.update({ paymentStatus: 'paid', paymentRef });
    const doc = await ref.get();
    return toBill(doc.id, doc.data()!);
  }
}
