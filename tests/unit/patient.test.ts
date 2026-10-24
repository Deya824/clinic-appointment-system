/**
 * Unit tests for PatientService.
 * Mocks IPatientRepository — no Firestore.
 * Tests: register, duplicate phone (409), update, search.
 */

import { PatientService } from '@/services/PatientService';
import type { IPatientRepository } from '@/repositories/interfaces';
import type { Patient } from '@/types';

const BASE: Patient = {
  id: 'p1',
  name: 'Alice',
  phone: '01711000001',
  dob: new Date('1990-01-01'),
  patientType: 'regular',
  createdAt: new Date(),
};

function mockRepo(overrides: Partial<IPatientRepository> = {}): IPatientRepository {
  return {
    findById:    jest.fn().mockResolvedValue(BASE),
    findByPhone: jest.fn().mockResolvedValue(null),    // no duplicate by default
    search:      jest.fn().mockResolvedValue([BASE]),
    list:        jest.fn().mockResolvedValue([BASE]),
    create:      jest.fn().mockResolvedValue(BASE),
    update:      jest.fn().mockResolvedValue({ ...BASE, name: 'Updated' }),
    ...overrides,
  };
}

describe('PatientService', () => {
  describe('register', () => {
    it('creates a patient when phone is unique', async () => {
      const repo = mockRepo();
      const svc  = new PatientService(repo);
      const p = await svc.register({
        name: 'Alice', phone: '01711000001',
        dob: '1990-01-01', patientType: 'regular',
      });
      expect(repo.create).toHaveBeenCalledTimes(1);
      expect(p.id).toBe('p1');
    });

    it('throws DUPLICATE_PHONE when phone already exists', async () => {
      const repo = mockRepo({ findByPhone: jest.fn().mockResolvedValue(BASE) });
      const svc  = new PatientService(repo);
      await expect(svc.register({
        name: 'Bob', phone: '01711000001',
        dob: '2000-01-01', patientType: 'regular',
      })).rejects.toThrow('DUPLICATE_PHONE');
    });
  });

  describe('getById', () => {
    it('returns patient when found', async () => {
      const svc = new PatientService(mockRepo());
      const p = await svc.getById('p1');
      expect(p.name).toBe('Alice');
    });

    it('throws NOT_FOUND when patient does not exist', async () => {
      const repo = mockRepo({ findById: jest.fn().mockResolvedValue(null) });
      const svc  = new PatientService(repo);
      await expect(svc.getById('unknown')).rejects.toThrow('NOT_FOUND');
    });
  });

  describe('update', () => {
    it('throws DUPLICATE_PHONE when updated phone is taken by another patient', async () => {
      const other: Patient = { ...BASE, id: 'p2', phone: '01711000002' };
      const repo = mockRepo({
        findByPhone: jest.fn().mockResolvedValue(other), // phone taken
      });
      const svc = new PatientService(repo);
      await expect(svc.update('p1', { phone: '01711000002' })).rejects.toThrow('DUPLICATE_PHONE');
    });

    it('allows update when phone belongs to same patient', async () => {
      // findByPhone returns the same patient — phone is "taken" by self, OK
      const repo = mockRepo({
        findByPhone: jest.fn().mockResolvedValue(BASE), // same id
      });
      const svc = new PatientService(repo);
      // Same phone as BASE — should NOT throw because ids match
      await expect(svc.update('p1', { phone: BASE.phone })).resolves.toBeDefined();
    });
  });

  describe('search', () => {
    it('calls repo.search with trimmed query', async () => {
      const repo = mockRepo();
      const svc  = new PatientService(repo);
      await svc.search('  Alice  ');
      expect(repo.search).toHaveBeenCalledWith('Alice');
    });

    it('calls repo.list when query is blank', async () => {
      const repo = mockRepo();
      const svc  = new PatientService(repo);
      await svc.search('   ');
      expect(repo.list).toHaveBeenCalled();
      expect(repo.search).not.toHaveBeenCalled();
    });
  });
});
