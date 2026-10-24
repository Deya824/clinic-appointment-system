/**
 * GET /api/doctors/[id] — get one doctor.
 *
 * @swagger
 * /api/doctors/{id}:
 *   get:
 *     tags: [Doctors]
 *     summary: Get a doctor by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Doctor object
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Not found
 */

import { NextRequest, NextResponse } from 'next/server';
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
  const { doctorService } = buildContainer();
  try {
    const doctor = await doctorService.getById(id);
    return NextResponse.json(doctor, { status: 200 });
  } catch (err) {
    const e = err as Error;
    if (e.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Doctor not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
