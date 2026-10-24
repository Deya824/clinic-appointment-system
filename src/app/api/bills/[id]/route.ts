/**
 * POST /api/bills/[id]/pay — pay a bill through the configured gateway.
 * GET  /api/bills/[id]     — get a bill by ID.
 *
 * @swagger
 * /api/bills/{id}:
 *   get:
 *     tags: [Billing]
 *     summary: Get a bill by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Bill object
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Bill not found
 *
 * /api/bills/{id}/pay:
 *   post:
 *     tags: [Billing]
 *     summary: Pay a bill (uses FakeGateway by default)
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
 *             required: [amount]
 *             properties:
 *               amount: { type: number, minimum: 0.01 }
 *     responses:
 *       200:
 *         description: Payment successful, bill marked paid
 *       400:
 *         description: Invalid amount or already paid
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Bill not found
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
  const { billingService } = buildContainer();
  try {
    const bill = await billingService.getBill(id);
    return NextResponse.json(bill, { status: 200 });
  } catch (err) {
    const e = err as Error;
    if (e.message === 'BILL_NOT_FOUND') {
      return NextResponse.json({ error: 'Bill not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
