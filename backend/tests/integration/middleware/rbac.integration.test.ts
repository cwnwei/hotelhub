/**
 * Integration tests for RBAC (Role-Based Access Control) middleware.
 * Tests role enforcement and validates that authorization is based on JWT claims.
 */
import request from 'supertest';
import app from '../../../src/app';
import { setupTestDB, clearTestDB, teardownTestDB } from '../setup/db';
import { createAuthenticatedUser, createAdmin } from '../setup/helpers';
import { createHotel } from '../setup/fixtures';
import User from '../../../src/models/User';

/**
 * Helper function to create room data for testing.
 * Reduces duplication across multiple tests.
 */
function createRoomData(hotelId: string, overrides: Record<string, any> = {}) {
  return {
    room_number: '101',
    room_type: 'deluxe',
    floor: 1,
    price_per_night: 150,
    max_guests: '2',
    amenities: ['WiFi', 'TV', 'Mini Bar'],
    status: 'available',
    hotel_id: hotelId,
    ...overrides
  };
}

describe('RBAC Middleware Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('Admin Role Authorization', () => {
    it('should allow admin to access admin-only endpoints (POST /rooms)', async () => {
      // Create admin user with valid credentials
      const { cookies } = await createAdmin();

      // Create a hotel to associate with the room
      const hotel = await createHotel();

      // Attempt to create a room (admin-only endpoint)
      const roomData = createRoomData(hotel._id.toString());

      const response = await request(app)
        .post('/rooms')
        .set('Cookie', cookies)
        .send(roomData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.room_number).toBe('101');
      expect(response.body.hotel_id).toBe(hotel._id.toString());
    });
  });

  describe('User Role Authorization', () => {
    it('should deny user access to admin-only endpoints (POST /rooms)', async () => {
      // Create regular user with valid credentials
      const { cookies } = await createAuthenticatedUser('user');

      // Create a hotel to associate with the room
      const hotel = await createHotel();

      // Attempt to create a room (admin-only endpoint)
      const roomData = createRoomData(hotel._id.toString(), {
        room_number: '102',
        room_type: 'standard',
        floor: 2,
        price_per_night: 100,
        amenities: ['WiFi', 'TV']
      });

      const response = await request(app)
        .post('/rooms')
        .set('Cookie', cookies)
        .send(roomData);

      expect(response.status).toBe(403);
      expect(response.body.message).toBeDefined();
    });

    it('should allow user to access user-level endpoints (GET /reservations/my-reservations)', async () => {
      // Create regular user with valid credentials
      const { cookies } = await createAuthenticatedUser('user');

      // Access user-level endpoint
      const response = await request(app)
        .get('/reservations/my-reservations')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Security: Role Validation from Token', () => {
    it('should validate role from JWT token, not database (security test)', async () => {
      // Create user with 'user' role and get their token
      const { user, token, refreshToken } = await createAuthenticatedUser('user');

      // CRITICAL SECURITY TEST: Modify user's role in database to 'admin'
      // This simulates a database manipulation attack
      await User.findByIdAndUpdate(user._id, { role: 'admin' });

      // Verify the database was updated
      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.role).toBe('admin');

      // Create a hotel for the room creation test
      const hotel = await createHotel();

      // Attempt to create a room with the original token (which still says 'user')
      const roomData = createRoomData(hotel._id.toString(), {
        room_number: '103',
        room_type: 'suite',
        floor: 3,
        price_per_night: 200,
        max_guests: '4',
        amenities: ['WiFi', 'TV', 'Jacuzzi']
      });

      const cookies = [`jwtToken=${token}`, `refreshToken=${refreshToken}`];

      const response = await request(app)
        .post('/rooms')
        .set('Cookie', cookies)
        .send(roomData);

      // Should be denied because the JWT token still contains 'user' role
      // This proves authorization is based on JWT claims, not database state
      expect(response.status).toBe(403);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('Unauthenticated Access', () => {
    // Note: This test verifies authentication middleware as a prerequisite to RBAC.
    // RBAC cannot function without authentication, so testing auth is part of the RBAC test suite.
    it('should deny unauthenticated access to protected endpoints', async () => {
      // Attempt to access protected endpoint without token
      const response = await request(app)
        .get('/reservations/my-reservations');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing JWT Token');
    });
  });
});
