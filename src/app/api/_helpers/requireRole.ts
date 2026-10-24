/**
 * requireRole — Route helper (NOT middleware).
 *
 * Reads the httpOnly JWT cookie from any NextRequest-like object, verifies
 * it with verifyToken(), and checks that the caller's role is in the
 * allowed list.
 *
 * Throws a plain object { status, message } so route handlers can catch it
 * and return the right HTTP status without importing NextResponse here.
 * This makes the function easy to unit-test without a real HTTP server.
 */

import { verifyToken, COOKIE_NAME, type JwtPayload } from '@/lib/auth';

interface RouteError {
  status: number;
  message: string;
}

/**
 * @param req  - Any object exposing `cookies.get(name)` (NextRequest).
 * @param roles - Allowed roles; throws 403 if caller's role is not listed.
 * @returns Decoded JWT payload ({ sub, role }).
 */
export async function requireRole(
  req: { cookies: { get(name: string): { value: string } | undefined } },
  roles: JwtPayload['role'][]
): Promise<JwtPayload> {
  // 1. Extract the token from the httpOnly cookie.
  const cookie = req.cookies.get(COOKIE_NAME);
  if (!cookie) {
    throw { status: 401, message: 'No authentication token found.' } satisfies RouteError;
  }

  // 2. Verify the JWT (throws if expired or tampered).
  let payload: JwtPayload;
  try {
    payload = await verifyToken(cookie.value);
  } catch {
    throw { status: 401, message: 'Invalid or expired token.' } satisfies RouteError;
  }

  // 3. Role check.
  if (!roles.includes(payload.role)) {
    throw { status: 403, message: `Role '${payload.role}' is not allowed.` } satisfies RouteError;
  }

  return payload;
}
