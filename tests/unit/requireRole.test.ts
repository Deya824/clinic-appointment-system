/**
 * TDD — failing tests written BEFORE requireRole() exists.
 * requireRole(roles) reads the clinic_token cookie from a NextRequest,
 * verifies it, checks the role, and returns the payload or throws.
 */

// We mock 'src/lib/auth' so no real JWT is created in unit tests.
// The helper under test: src/app/api/_helpers/requireRole.ts

jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
  COOKIE_NAME: 'clinic_token',
}));

import { verifyToken } from '@/lib/auth';
import { requireRole } from '@/app/api/_helpers/requireRole';

const mockVerify = verifyToken as jest.MockedFunction<typeof verifyToken>;

// Helper: build a minimal mock NextRequest with a cookie
function makeRequest(cookie?: string) {
  return {
    cookies: {
      get: (name: string) =>
        cookie !== undefined && name === 'clinic_token'
          ? { value: cookie }
          : undefined,
    },
  } as Parameters<typeof requireRole>[0];
}

describe('requireRole()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the JWT payload when the role is allowed', async () => {
    mockVerify.mockResolvedValue({ sub: 'u1', role: 'admin' });
    const req = makeRequest('valid.token.here');
    const payload = await requireRole(req, ['admin']);
    expect(payload.sub).toBe('u1');
    expect(payload.role).toBe('admin');
  });

  it('throws 401 when no cookie is present', async () => {
    const req = makeRequest(); // no cookie
    await expect(requireRole(req, ['admin'])).rejects.toMatchObject({
      status: 401,
    });
  });

  it('throws 401 when verifyToken rejects (expired / invalid)', async () => {
    mockVerify.mockRejectedValue(new Error('token expired'));
    const req = makeRequest('bad.token');
    await expect(requireRole(req, ['admin'])).rejects.toMatchObject({
      status: 401,
    });
  });

  it('throws 403 when role is not in the allowed list', async () => {
    mockVerify.mockResolvedValue({ sub: 'u2', role: 'receptionist' });
    const req = makeRequest('valid.token');
    await expect(requireRole(req, ['admin', 'doctor'])).rejects.toMatchObject({
      status: 403,
    });
  });

  it('allows any role in the list (multi-role check)', async () => {
    mockVerify.mockResolvedValue({ sub: 'u3', role: 'doctor' });
    const req = makeRequest('valid.token');
    const payload = await requireRole(req, ['admin', 'doctor']);
    expect(payload.role).toBe('doctor');
  });
});
