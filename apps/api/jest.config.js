/**
 * Unit tests for the NestJS API.
 *
 * Deliberately database-free: they pin the input contracts (class-validator
 * DTOs) that guard the HTTP boundary. Anything requiring Prisma is exercised
 * by the live smoke test instead — see README › Testing.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: __dirname,
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts'],
};