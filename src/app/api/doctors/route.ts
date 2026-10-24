/**
 * POST /api/doctors — create a doctor. Admin only.
 * GET  /api/doctors — list all doctors.
 *
 * @swagger
 * /api/doctors:
 *   post:
 *     tags: [Doctors]
 *     summary: Create a new doctor (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, name, specialisation, consultationFee]
 *             properties:
 *               userId:          { type: string }
 *               name:            { type: string }
 *               specialisation:  { type: string }
 *               consultationFee: { type: number }
 *     responses:
 *       201:
 *         description: Doctor created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *   get:
 *     tags: [Doctors]
 *     summary: List all doctors
 *     responses:
 *       200:
 *         description: Array of doctors
 *       401:
 *         description: Not authenticated
 */

import { NextRequest, NextResponse } from 'next/server';
import { CreateDoctorSchema } from '@/schemas';
import { buildContainer } from '@/lib/container';
import { requireRole } from '@/app/api/_helpers/requireRole';

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, ['admin']);
  } catch (err) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateDoctorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { doctorService } = buildContainer();
  try {
    const doctor = await doctorService.create(parsed.data);
    return NextResponse.json(doctor, { status: 201 });
  } catch (err) {
    const e = err as Error;
    if (e.message === 'NEGATIVE_FEE') {
      return NextResponse.json({ error: 'Consultation fee cannot be negative.' }, { status: 400 });
    }
    console.error('[doctors POST]', e);
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

  const { doctorService } = buildContainer();
  const doctors = await doctorService.list();
  return NextResponse.json(doctors, { status: 200 });
}
