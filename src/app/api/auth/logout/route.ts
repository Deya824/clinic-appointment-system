/**
 * POST /api/auth/logout
 *
 * Clears the httpOnly JWT cookie.
 * No body required — just being authenticated counts.
 *
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout — clears the JWT cookie
 *     responses:
 *       200:
 *         description: Logged out successfully
 */

import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  const res = NextResponse.json({ message: 'Logged out.' }, { status: 200 });
  // Delete the cookie by setting maxAge to 0
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
