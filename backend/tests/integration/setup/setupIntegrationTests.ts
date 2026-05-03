/**
 * Setup file for integration tests.
 * Configures Jest timeout for long-running integration tests.
 */
import { TEST_CONSTANTS } from '../../setup/testConstants';

// Set environment variables for integration tests using constants
process.env.ACCESS_TOKEN_SECRET = TEST_CONSTANTS.ACCESS_TOKEN_SECRET;
process.env.REFRESH_TOKEN_SECRET = TEST_CONSTANTS.REFRESH_TOKEN_SECRET;
process.env.NODE_ENV = TEST_CONSTANTS.NODE_ENV;

// Set timeout to 30 seconds for integration tests (database operations can be slow)
jest.setTimeout(30000);
