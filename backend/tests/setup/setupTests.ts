// Global test setup runs before all tests
import { TEST_CONSTANTS } from './testConstants';

// Suppress console output during tests (optional)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

// Set test environment variables using constants
process.env.ACCESS_TOKEN_SECRET = TEST_CONSTANTS.ACCESS_TOKEN_SECRET;
process.env.REFRESH_TOKEN_SECRET = TEST_CONSTANTS.REFRESH_TOKEN_SECRET;
process.env.NODE_ENV = TEST_CONSTANTS.NODE_ENV;

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
