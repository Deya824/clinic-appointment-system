/**
 * POST /api/bills — create a bill for an appointment.
 *   Body: { appointmentId, patientId, doctorId }
 *   Route fetches the consultation fee from DoctorService, then calls BillingService.
 *
 * @swagger
 * /api/bills:
 *   post:
 *     tags: [Billing]
 *     summary: Create a bill for an appointment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [appointmentId, patientId, doctorId]
 *             properties:
 *               appointmentId: { type: string }
 *               patientId:     { type: string }
 *               doctorId:      { type: string }
 *     responses:
 *       201:
 *         description: Bill created
 *       400:
 *         description: Validation error or fee is negative
 *       401:
 *         description: Not authenticated
 *       409:
 *         description: Bill already exists for this appointment
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { buildContainer } from '@/lib/container';
import { requireRole } from '@/app/api/_helpers/requireRole';

const CreateBillSchema = z.object({
  appointmentId: z.string().min(1),
  patientId:     z.string().min(1),
  doctorId:      z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, ['admin', 'receptionist']);
  } catch (err) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateBillSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { billingService, doctorService } = buildContainer();
  try {
    // Fetch consultation fee from doctor record (Route delegates to services, not DB)
    const doctor = await doctorService.getById(parsed.data.doctorId);
    const bill   = await billingService.createBillWithFee(
      parsed.data.appointmentId,
      parsed.data.patientId,
      doctor.consultationFee
    );
    return NextResponse.json(bill, { status: 201 });
  } catch (err) {
    const e = err as Error;
    if (e.message === 'BILL_EXISTS') {
      return NextResponse.json({ error: 'Bill already exists for this appointment.' }, { status: 409 });
    }
    if (e.message === 'PATIENT_NOT_FOUND' || e.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Patient or doctor not found.' }, { status: 404 });
    }
    console.error('[bills POST]', e);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
