/**
 * GET /api/auth/me
 *
 * Reads the JWT cookie and returns the current user's id and role.
 * Uses requireRole() — any authenticated user may call this.
 *
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the current authenticated user info
 *     responses:
 *       200:
 *         description: Current user payload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sub:  { type: string }
 *                 role: { type: string }
 *       401:
 *         description: Not authenticated
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/app/api/_helpers/requireRole';

export async function GET(req: NextRequest) {
  try {
    const payload = await requireRole(req, ['admin', 'doctor', 'receptionist']);
    return NextResponse.json({ sub: payload.sub, role: payload.role }, { status: 200 });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? 'Unauthorized' }, { status: e.status ?? 500 });
  }
}
