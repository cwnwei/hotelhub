/**
 * Integration tests for authentication middleware.
 * Tests JWT token validation in real requests using the RBAC middleware.
 */
import request from 'supertest';
import app from '../../../src/app';
import { setupTestDB, clearTestDB, teardownTestDB } from '../setup/db';
import { createUser } from '../setup/fixtures';
import { createAuthenticatedUser } from '../setup/helpers';
import jwt from 'jsonwebtoken';

const VALID_TEST_PASSWORD = 'password123';
const WRONG_SECRET_KEY = 'WRONG_SECRET_KEY_12345';

describe('Auth Middleware Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('JWT Token Validation', () => {
    it('should allow access with valid JWT token', async () => {
      // Create authenticated user
      const { user, cookies } = await createAuthenticatedUser('user');

      const response = await request(app)
        .get('/reservations/my-reservations')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject expired tokens', async () => {
      // Create user
      const user = await createUser({ role: 'user' });

      // Create an expired token using jwt.sign directly with expiresIn in the past
      const expiredToken = jwt.sign(
        { userId: user._id.toString(), role: user.role },
        process.env.ACCESS_TOKEN_SECRET!,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/reservations/my-reservations')
        .set('Cookie', [`jwtToken=${expiredToken}`]);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid JWT token');
    });

    it('should reject malformed tokens', async () => {
      // Use a completely malformed token (not even valid JWT structure)
      const malformedToken = 'this.is.not.a.valid.jwt';

      const response = await request(app)
        .get('/reservations/my-reservations')
        .set('Cookie', [`jwtToken=${malformedToken}`]);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid JWT token');
    });

    it('should reject requests without token', async () => {
      const response = await request(app)
        .get('/reservations/my-reservations');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing JWT Token');
    });

    it('should reject token with invalid signature', async () => {
      // Create user
      const user = await createUser({ role: 'user' });

      // Create token with wrong secret
      const tokenWithInvalidSignature = jwt.sign(
        { userId: user._id.toString(), role: user.role },
        WRONG_SECRET_KEY,
        { expiresIn: '10m' }
      );

      const response = await request(app)
        .get('/reservations/my-reservations')
        .set('Cookie', [`jwtToken=${tokenWithInvalidSignature}`]);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid JWT token');
    });
  });
});
