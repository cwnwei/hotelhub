/**
 * Setup file for integration tests.
 * Configures Jest timeout for long-running integration tests.
 */

// Set timeout to 30 seconds for integration tests (database operations can be slow)
jest.setTimeout(30000);
