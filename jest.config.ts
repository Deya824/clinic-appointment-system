/**
 * Jest configuration for Next.js + TypeScript + Firestore.
 * ts-jest transforms TypeScript; moduleNameMapper matches tsconfig "@/*" -> "src/*".
 */
import type { Config } from 'jest';

const config: Config = {
  // ts-jest handles TypeScript compilation
  preset: 'ts-jest',

  // Node environment for API/service/repository unit tests
  testEnvironment: 'node',

  // Mirror tsconfig paths so "@/lib/db" resolves to "src/lib/db" in tests
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Load global test setup (e.g. env vars for tests)
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Coverage only for business logic: services and design patterns
  collectCoverageFrom: [
    'src/services/**/*.ts',
    'src/patterns/**/*.ts',
    '!src/**/*.d.ts',
  ],

  // Project requirement: 80% line, 70% branch coverage
  coverageThreshold: {
    global: {
      lines: 80,
      branches: 70,
    },
  },

  // Only run files in tests/unit (not e2e, those need a browser)
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.ts',
  ],

  // FIX: "jose" is a modern ES module, so Jest must convert it too
  transformIgnorePatterns: ['/node_modules/(?!(jose)/)'],

  // FIX: also convert .js files (needed for jose)
  transform: {
    '^.+\\.(ts|tsx|js)$': ['ts-jest', {
      tsconfig: {
        allowJs: true,
        moduleResolution: 'node',
        module: 'commonjs',
        esModuleInterop: true,
      },
    }],
  },
};

export default config;
