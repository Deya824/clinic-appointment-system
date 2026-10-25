/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/e2e'],
  testMatch: ['<rootDir>/tests/e2e/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // No coverage for E2E (they test the running server, not source directly)
  collectCoverage: false,
  // Allow longer timeouts for browser automation
  testTimeout: 60000,
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
  transformIgnorePatterns: ['/node_modules/(?!(jose)/)'],
};

module.exports = config;
