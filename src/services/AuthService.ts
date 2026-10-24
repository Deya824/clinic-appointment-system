/**
 * AuthService — handles login (hash compare) and user creation.
 * Receives IUserRepository through constructor so unit tests can inject mocks.
 * No Firestore imports here — only the interface.
 */

import bcrypt from 'bcryptjs';
import { signToken, verifyToken, type JwtPayload } from '@/lib/auth';
import type { IUserRepository } from '@/repositories/interfaces';
import type { User } from '@/types';

export class AuthService {
  constructor(private users: IUserRepository) {}

  /** Verify credentials; returns a signed JWT on success. */
  async login(email: string, password: string): Promise<string> {
    const user = await this.users.findByEmail(email);
    if (!user) throw new Error('INVALID_CREDENTIALS');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new Error('INVALID_CREDENTIALS');

    return signToken({ sub: user.id, role: user.role });
  }

  /** Validate a token and return its payload. */
  async me(token: string): Promise<JwtPayload> {
    return verifyToken(token);
  }

  /** Create a user with a bcrypt-hashed password (cost factor 12). */
  async createUser(
    data: Omit<User, 'id' | 'createdAt' | 'passwordHash'> & { password: string }
  ): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, 12);
    return this.users.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
    });
  }
}
