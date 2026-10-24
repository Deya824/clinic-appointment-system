/**
 * POST /api/appointments — book an appointment.
 * GET  /api/appointments  — list today's appointments for a doctor (query: doctorId).
 *
 * @swagger
 * /api/appointments:
 *   post:
 *     tags: [Appointments]
 *     summary: Book a new appointment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId, doctorId, start, end]
 *             properties:
 *               patientId: { type: string }
 *               doctorId:  { type: string }
 *               start:     { type: string, format: date-time }
 *               end:       { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Appointment booked
 *       400:
 *         description: Validation error, past time, or invalid time range
 *       401:
 *         description: Not authenticated
 *       409:
 *         description: Doctor is already booked for that time slot
 *   get:
 *     tags: [Appointments]
 *     summary: Get today's appointments for a doctor
 *     parameters:
 *       - in: query
 *         name: doctorId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Array of today's appointments
 *       400:
 *         description: Missing doctorId
 *       401:
 *         description: Not authenticated
 */

import { NextRequest, NextResponse } from 'next/server';
import { CreateAppointmentSchema } from '@/schemas';
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
  const parsed = CreateAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { apptService } = buildContainer();
  try {
    const appt = await apptService.book(parsed.data);
    return NextResponse.json(appt, { status: 201 });
  } catch (err) {
    const e = err as Error;
    if (e.message === 'DOUBLE_BOOKING') {
      return NextResponse.json({ error: 'Doctor already has an appointment in that time slot.' }, { status: 409 });
    }
    if (e.message === 'PAST_BOOKING' || e.message === 'INVALID_TIME_RANGE') {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error('[appointments POST]', e);
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

  const doctorId = req.nextUrl.searchParams.get('doctorId');
  if (!doctorId) {
    return NextResponse.json({ error: 'Missing doctorId query parameter.' }, { status: 400 });
  }

  const { apptService } = buildContainer();
  const appts = await apptService.todayByDoctor(doctorId);
  return NextResponse.json(appts, { status: 200 });
}
