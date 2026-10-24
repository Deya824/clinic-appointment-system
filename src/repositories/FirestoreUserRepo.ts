/**
 * FirestoreUserRepository — only layer allowed to touch firebase-admin/firestore.
 * Implements IUserRepository so AuthService never imports Firestore directly.
 */

import { Firestore, Timestamp } from 'firebase-admin/firestore';
import type { IUserRepository } from './interfaces';
import type { User } from '@/types';

const COL = 'users';

/** Map a Firestore doc snapshot → User domain type */
function toUser(id: string, data: FirebaseFirestore.DocumentData): User {
  return {
    id,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    role: data.role,
    createdAt: (data.createdAt as Timestamp).toDate(),
  };
}

export class FirestoreUserRepo implements IUserRepository {
  constructor(private db: Firestore) {}

  async findByEmail(email: string): Promise<User | null> {
    const snap = await this.db
      .collection(COL)
      .where('email', '==', email)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return toUser(doc.id, doc.data());
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.db.collection(COL).doc(id).get();
    if (!doc.exists) return null;
    return toUser(doc.id, doc.data()!);
  }

  async create(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const ref = this.db.collection(COL).doc();
    const createdAt = Timestamp.now();
    await ref.set({ ...data, createdAt });
    return { id: ref.id, ...data, createdAt: createdAt.toDate() };
  }
}
