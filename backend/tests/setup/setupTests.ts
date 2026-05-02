// Global test setup runs before all tests

// Suppress console output during tests (optional)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

// Set test environment variables
process.env.ACCESS_TOKEN_SECRET = 'test-access-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
