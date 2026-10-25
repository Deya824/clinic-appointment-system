/**
 * Seed script — creates 1 admin, 1 doctor, 1 patient in Firestore.
 * Run with: npm run seed
 *
 * Credentials from env vars (never hardcoded):
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 *   SEED_ADMIN_EMAIL     (default: admin@clinic.com)
 *   SEED_ADMIN_PASSWORD  (default: Admin1234!)
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { getDb } from '../src/lib/db';

const adminEmail = process.env.SEED_ADMIN_EMAIL    ?? 'admin@clinic.com';
const adminPass  = process.env.SEED_ADMIN_PASSWORD ?? 'Admin1234!';

async function seed() {
  const db = getDb();

  // ── Admin user ─────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(adminPass, 12);
  const userRef = db.collection('users').doc();
  await userRef.set({
    id:           userRef.id,
    name:         'Admin User',
    email:        adminEmail,
    passwordHash,
    role:         'admin',
    createdAt:    new Date(),
  });
  console.log(`Admin created  → id: ${userRef.id}  email: ${adminEmail}`);

  // ── Doctor user (system user record) ──────────────────────────────────────
  const docUserRef = db.collection('users').doc();
  const docPassHash = await bcrypt.hash('Doctor1234!', 12);
  await docUserRef.set({
    id:           docUserRef.id,
    name:         'Dr Karim',
    email:        'karim@clinic.com',
    passwordHash: docPassHash,
    role:         'doctor',
    createdAt:    new Date(),
  });

  // ── Doctor profile ─────────────────────────────────────────────────────────
  const doctorRef = db.collection('doctors').doc();
  await doctorRef.set({
    id:              doctorRef.id,
    userId:          docUserRef.id,
    name:            'Dr Karim',
    specialisation:  'General Physician',
    consultationFee: 500,
  });
  console.log(`Doctor created → id: ${doctorRef.id}  fee: 500 BDT`);

  // ── Patient ────────────────────────────────────────────────────────────────
  const patientRef = db.collection('patients').doc();
  await patientRef.set({
    id:          patientRef.id,
    name:        'Rahim Mia',
    phone:       '+8801700000001',
    dob:         new Date('1990-01-01'),
    patientType: 'regular',
    createdAt:   new Date(),
  });
  console.log(`Patient created→ id: ${patientRef.id}  phone: +8801700000001`);

  console.log('\n✅  Seed complete. Copy the doctor and patient ids above for E2E tests:');
  console.log(`  E2E_DOCTOR_ID=${doctorRef.id}`);
  console.log(`  E2E_PATIENT_ID=${patientRef.id}`);

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
