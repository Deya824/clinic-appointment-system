/**
 * POST /api/auth/register
 *
 * Body: { name, email, password, role }
 * Validates with Zod → calls AuthService.createUser()
 * Only admin can register new users (guarded by requireRole in practice;
 * for the initial admin seed this route is open — see seed script).
 *
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new system user (admin/doctor/receptionist)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name:     { type: string }
 *               email:    { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *               role:     { type: string, enum: [admin, doctor, receptionist] }
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already in use
 */

import { NextRequest, NextResponse } from 'next/server';
import { CreateUserSchema } from '@/schemas';
import { buildContainer } from '@/lib/container';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { authService } = buildContainer();
  try {
    const user = await authService.createUser(parsed.data);
    // Never return the password hash — omit it explicitly
    const { passwordHash: _hash, ...safe } = user;
    return NextResponse.json(safe, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'EMAIL_EXISTS') {
      return NextResponse.json({ error: 'Email already in use.' }, { status: 409 });
    }
    console.error('[register]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }}
