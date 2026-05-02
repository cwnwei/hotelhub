/**
 * Test constants for all Jest tests
 * These replace environment variables in test environment
 */

export const TEST_CONSTANTS = {
  ACCESS_TOKEN_SECRET: 'test-access-secret-key-12345',
  REFRESH_TOKEN_SECRET: 'test-refresh-secret-key-12345',
  NODE_ENV: 'test',
  MONGODB_URI: 'mongodb://localhost:27017/hotelhub-test',
  PORT: 3001,
} as const;
