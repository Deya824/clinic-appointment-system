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
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],

  // Collect coverage only from our source, not boilerplate
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
    '!src/app/page.tsx',
    '!src/app/**/page.tsx',
    '!src/app/api-docs/**',
  ],

  // Project requirement: 80% line, 70% branch coverage
  coverageThreshold: {
    global: {
      lines: 80,
      branches: 70,
    },
  },

  // Only run files in tests/unit (not e2e — those need a browser)
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.ts',
  ],

  // ts-jest config: use bundler module resolution to match tsconfig
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        moduleResolution: 'node',  // ts-jest works best with node resolver
        module: 'commonjs',
      },
    }],
  },
};

export default config;
