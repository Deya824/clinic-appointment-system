/**
 * POST /api/bills/[id]/pay — pay a specific bill.
 *
 * @swagger
 * /api/bills/{id}/pay:
 *   post:
 *     tags: [Billing]
 *     summary: Pay a bill using the default gateway (FakeGateway)
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
 *         description: Payment successful
 *       400:
 *         description: Invalid amount, already paid, or payment failed
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Bill not found
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { buildContainer } from '@/lib/container';
import { requireRole } from '@/app/api/_helpers/requireRole';

const PaySchema = z.object({
  amount: z.number().positive(),
});

export async function POST(
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
  const parsed = PaySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { billingService } = buildContainer();
  try {
    const bill = await billingService.pay(id, parsed.data.amount);
    return NextResponse.json(bill, { status: 200 });
  } catch (err) {
    const e = err as Error;
    if (e.message === 'BILL_NOT_FOUND') {
      return NextResponse.json({ error: 'Bill not found.' }, { status: 404 });
    }
    if (e.message === 'ALREADY_PAID') {
      return NextResponse.json({ error: 'Bill is already paid.' }, { status: 400 });
    }
    if (e.message === 'PAYMENT_FAILED' || e.message === 'INVALID_AMOUNT') {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error('[bills pay]', e);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
