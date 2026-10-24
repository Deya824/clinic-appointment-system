/**
 * POST /api/patients — register a new patient.
 * Only admin and receptionist can register patients.
 *
 * @swagger
 * /api/patients:
 *   post:
 *     tags: [Patients]
 *     summary: Register a new patient
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, dob]
 *             properties:
 *               name:        { type: string }
 *               phone:       { type: string }
 *               dob:         { type: string, format: date }
 *               patientType: { type: string, enum: [regular, senior, insured] }
 *     responses:
 *       201:
 *         description: Patient created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       409:
 *         description: Phone number already in use
 *   get:
 *     tags: [Patients]
 *     summary: List all patients or search by name/phone
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search query (name or phone)
 *     responses:
 *       200:
 *         description: Array of patients
 *       401:
 *         description: Not authenticated
 */

import { NextRequest, NextResponse } from 'next/server';
import { CreatePatientSchema } from '@/schemas';
import { buildContainer } from '@/lib/container';
import { requireRole } from '@/app/api/_helpers/requireRole';

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, ['admin', 'receptionist']);
  } catch (err) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  const body = await req.json().catch(() => null);
  const parsed = CreatePatientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { patientService } = buildContainer();
  try {
    const patient = await patientService.register(parsed.data);
    return NextResponse.json(patient, { status: 201 });
  } catch (err) {
    const e = err as Error;
    if (e.message === 'DUPLICATE_PHONE') {
      return NextResponse.json({ error: 'Phone number already in use.' }, { status: 409 });
    }
    console.error('[patients POST]', e);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['admin', 'receptionist', 'doctor']);
  } catch (err) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  const q = req.nextUrl.searchParams.get('q') ?? '';
  const { patientService } = buildContainer();
  const patients = await patientService.search(q);
  return NextResponse.json(patients, { status: 200 });
}
