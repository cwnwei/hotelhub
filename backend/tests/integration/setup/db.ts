/**
 * Database lifecycle manager for integration tests.
 * Manages MongoDB memory server setup, state cleanup, and teardown.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer | null = null;

/**
 * Initializes in-memory MongoDB instance and connects mongoose.
 * Call this in beforeAll() hook. Safe to call multiple times (idempotent).
 */
export const setupTestDB = async () => {
  try {
    if (mongoServer) {
      console.warn('MongoDB memory server already running');
      return;
    }

    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log('Integration test database connected');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
};

/**
 * Removes all documents from all collections.
 * Call this in afterEach() hook to ensure test isolation.
 */
export const clearTestDB = async () => {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error('Failed to clear test database:', error);
    throw error;
  }
};

/**
 * Safely disconnects mongoose and stops the MongoDB memory server.
 * Call this in afterAll() hook.
 */
export const teardownTestDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    if (mongoServer) {
      await mongoServer.stop();
      mongoServer = null; // Reset for potential future setup
    }

    console.log('Integration test database closed');
  } catch (error) {
    console.error('Failed to teardown test database:', error);
    throw error;
  }
};
