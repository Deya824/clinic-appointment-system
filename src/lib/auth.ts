/**
 * JWT helpers using the 'jose' library.
 * jose works in Node.js Edge and Node.js runtimes (unlike jsonwebtoken).
 * Tokens are stored in httpOnly cookies so JavaScript cannot read them.
 */

import { SignJWT, jwtVerify } from 'jose';

export interface JwtPayload {
  sub: string;   // user ID
  role: 'admin' | 'doctor' | 'receptionist';
  iat?: number;
  exp?: number;
}

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-in-production!!'
);

const COOKIE_NAME = 'clinic_token';
const EXPIRES_IN = '8h';

/** Sign a JWT and return the token string. */
export async function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(secret);
}

/** Verify a JWT string; throws if invalid or expired. */
export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secret);
  return {
    sub: payload.sub as string,
    role: payload['role'] as JwtPayload['role'],
    iat: payload.iat,
    exp: payload.exp,
  };
}

export { COOKIE_NAME };
