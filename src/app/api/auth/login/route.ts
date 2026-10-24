/**
 * POST /api/auth/login
 *
 * Body: { email, password }
 * On success: signs a JWT and stores it in an httpOnly cookie (8 h TTL).
 *
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and receive an httpOnly JWT cookie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful; JWT set in httpOnly cookie
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */

import { NextRequest, NextResponse } from 'next/server';
import { LoginSchema } from '@/schemas';
import { buildContainer } from '@/lib/container';
import { COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { authService } = buildContainer();
  try {
    const token = await authService.login(parsed.data.email, parsed.data.password);

    const res = NextResponse.json({ message: 'Login successful.' }, { status: 200 });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours in seconds
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }
}
