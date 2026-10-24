/**
 * POST /api/doctors/[id]/schedule — add a schedule slot for a doctor.
 * GET  /api/doctors/[id]/schedule — list schedule slots for a doctor.
 *
 * @swagger
 * /api/doctors/{id}/schedule:
 *   post:
 *     tags: [Doctors]
 *     summary: Add a weekly schedule slot for a doctor (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dayOfWeek, startTime, endTime]
 *             properties:
 *               dayOfWeek:  { type: integer, minimum: 0, maximum: 6 }
 *               startTime:  { type: string, example: "09:00" }
 *               endTime:    { type: string, example: "17:00" }
 *     responses:
 *       201:
 *         description: Schedule slot created
 *       400:
 *         description: Validation error or invalid time range
 *       401:
 *         description: Not authenticated
 *   get:
 *     tags: [Doctors]
 *     summary: Get schedule slots for a doctor
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Array of schedule slots
 *       401:
 *         description: Not authenticated
 */

import { NextRequest, NextResponse } from 'next/server';
import { CreateScheduleSchema } from '@/schemas';
import { buildContainer } from '@/lib/container';
import { requireRole } from '@/app/api/_helpers/requireRole';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, ['admin']);
  } catch (err) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  // Inject doctorId from path so caller doesn't need to repeat it
  const parsed = CreateScheduleSchema.safeParse({ ...body, doctorId: id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { doctorService } = buildContainer();
  try {
    const slot = await doctorService.addSchedule(parsed.data);
    return NextResponse.json(slot, { status: 201 });
  } catch (err) {
    const e = err as Error;
    if (e.message === 'INVALID_SCHEDULE_TIME') {
      return NextResponse.json({ error: 'startTime must be before endTime.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

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
  const slots = await doctorService.getSchedule(id);
  return NextResponse.json(slots, { status: 200 });
}
