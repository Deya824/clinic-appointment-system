/**
 * PATCH /api/appointments/[id] — cancel or reschedule an appointment.
 *
 * @swagger
 * /api/appointments/{id}:
 *   patch:
 *     tags: [Appointments]
 *     summary: Cancel or reschedule an appointment
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
 *             required: [action]
 *             properties:
 *               action: { type: string, enum: [cancel, reschedule] }
 *               start:  { type: string, format: date-time }
 *               end:    { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Updated appointment
 *       400:
 *         description: Validation error, past time, or already cancelled
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Appointment not found
 *       409:
 *         description: Double-booking conflict
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { buildContainer } from '@/lib/container';
import { requireRole } from '@/app/api/_helpers/requireRole';

const PatchSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('cancel') }),
  z.object({
    action: z.literal('reschedule'),
    start:  z.string().datetime({ offset: true }),
    end:    z.string().datetime({ offset: true }),
  }),
]);

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
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { apptService } = buildContainer();
  try {
    let result;
    if (parsed.data.action === 'cancel') {
      result = await apptService.cancel(id);
    } else {
      result = await apptService.reschedule(id, {
        start: parsed.data.start,
        end:   parsed.data.end,
      });
    }
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const e = err as Error;
    if (e.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });
    }
    if (e.message === 'DOUBLE_BOOKING') {
      return NextResponse.json({ error: 'Time slot conflict.' }, { status: 409 });
    }
    if (
      e.message === 'ALREADY_CANCELLED' ||
      e.message === 'PAST_BOOKING' ||
      e.message === 'INVALID_TIME_RANGE'
    ) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error('[appointments PATCH]', e);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
