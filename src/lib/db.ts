/**
 * PATTERN: Singleton
 * WHY: firebase-admin must be initialised exactly once per Node.js process.
 *      In Next.js dev mode the module is hot-reloaded, which would create a
 *      new app instance on every reload and crash with "app already exists".
 *      We check getApps().length before calling initializeApp() so the second
 *      call is a no-op — the same Firestore instance is returned every time.
 */

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let db: Firestore;

export function getDb(): Firestore {
  if (db) return db; // already initialised — return cached instance

  if (!getApps().length) {
    // First call: initialise the Admin SDK with service account credentials
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // .env stores "\n" as a literal string; replace with real newlines
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }

  db = getFirestore();
  return db;
}
