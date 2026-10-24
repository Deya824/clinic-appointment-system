/**
 * Unit tests for AuthService.
 * Mocks IUserRepository — no real Firestore, no real bcrypt calls for speed.
 * Tests: hash/verify round-trip, invalid credentials, token sign/verify.
 */

import { AuthService } from '@/services/AuthService';
import type { IUserRepository } from '@/repositories/interfaces';
import type { User } from '@/types';
import bcrypt from 'bcryptjs';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function makeHashedUser(plain: string): Promise<User> {
  return {
    id: 'u1',
    name: 'Admin User',
    email: 'admin@clinic.com',
    passwordHash: await bcrypt.hash(plain, 10),
    role: 'admin',
    createdAt: new Date(),
  };
}

function mockRepo(user: User | null): IUserRepository {
  return {
    findByEmail: jest.fn().mockResolvedValue(user),
    findById:    jest.fn().mockResolvedValue(user),
    create:      jest.fn().mockImplementation(async (data) => ({
      id: 'u-new',
      ...data,
      createdAt: new Date(),
    })),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  describe('login', () => {
    it('returns a JWT token when credentials are correct', async () => {
      const user = await makeHashedUser('password123');
      const svc  = new AuthService(mockRepo(user));

      const token = await svc.login('admin@clinic.com', 'password123');
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('throws INVALID_CREDENTIALS when user not found', async () => {
      const svc = new AuthService(mockRepo(null));
      await expect(svc.login('x@x.com', 'pass')).rejects.toThrow('INVALID_CREDENTIALS');
    });

    it('throws INVALID_CREDENTIALS when password is wrong', async () => {
      const user = await makeHashedUser('correct-pass');
      const svc  = new AuthService(mockRepo(user));
      await expect(svc.login('admin@clinic.com', 'wrong-pass')).rejects.toThrow('INVALID_CREDENTIALS');
    });
  });

  describe('me (token round-trip)', () => {
    it('verifyToken returns the same sub and role that were signed', async () => {
      const user = await makeHashedUser('pass');
      const svc  = new AuthService(mockRepo(user));
      const token = await svc.login('admin@clinic.com', 'pass');
      const payload = await svc.me(token);
      expect(payload.sub).toBe('u1');
      expect(payload.role).toBe('admin');
    });

    it('throws when token is invalid', async () => {
      const svc = new AuthService(mockRepo(null));
      await expect(svc.me('not.a.token')).rejects.toThrow();
    });
  });

  describe('createUser', () => {
    it('stores a bcrypt hash, not the plain password', async () => {
      const createMock = jest.fn().mockImplementation(async (data) => ({
        id: 'u2', ...data, createdAt: new Date(),
      }));
      const repo: IUserRepository = {
        findByEmail: jest.fn(),
        findById:    jest.fn(),
        create:      createMock,
      };
      const svc = new AuthService(repo);
      await svc.createUser({ name: 'Doc', email: 'd@c.com', password: 'secret', role: 'doctor' });

      const stored = createMock.mock.calls[0][0];
      expect(stored.passwordHash).not.toBe('secret');
      const ok = await bcrypt.compare('secret', stored.passwordHash);
      expect(ok).toBe(true);
    });
  });
});
