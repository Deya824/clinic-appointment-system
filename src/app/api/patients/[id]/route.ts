/**
 * GET    /api/patients/[id] — get one patient by id.
 * PATCH  /api/patients/[id] — edit patient fields. 409 if phone taken.
 *
 * @swagger
 * /api/patients/{id}:
 *   get:
 *     tags: [Patients]
 *     summary: Get a patient by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Patient object
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Not found
 *   patch:
 *     tags: [Patients]
 *     summary: Edit patient details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:        { type: string }
 *               phone:       { type: string }
 *               dob:         { type: string }
 *               patientType: { type: string, enum: [regular, senior, insured] }
 *     responses:
 *       200:
 *         description: Updated patient
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Not found
 *       409:
 *         description: Phone already in use
 */

import { NextRequest, NextResponse } from 'next/server';
import { UpdatePatientSchema } from '@/schemas';
import { buildContainer } from '@/lib/container';
import { requireRole } from '@/app/api/_helpers/requireRole';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, ['admin', 'receptionist', 'doctor']);
  } catch (err) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  const { id } = await params;
  const { patientService } = buildContainer();
  try {
    const patient = await patientService.getById(id);
    return NextResponse.json(patient, { status: 200 });
  } catch (err) {
    const e = err as Error;
    if (e.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Patient not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, ['admin', 'receptionist']);
  } catch (err) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = UpdatePatientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { patientService } = buildContainer();
  try {
    const updated = await patientService.update(id, parsed.data);
    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    const e = err as Error;
    if (e.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Patient not found.' }, { status: 404 });
    }
    if (e.message === 'DUPLICATE_PHONE') {
      return NextResponse.json({ error: 'Phone already in use.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
