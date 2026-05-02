/**
 * Integration tests for guest routes.
 * Tests GET /guests, PUT /guests/:id, DELETE /guests/:id (all admin only).
 * Note: Guest routes use the User model, filtering for users with role='user'.
 */
import request from 'supertest';
import app from '../../../src/app';
import User from '../../../src/models/User';
import { setupTestDB, clearTestDB, teardownTestDB } from '../setup/db';
import { createUser } from '../setup/fixtures';
import { createAuthenticatedUser, createAdmin } from '../setup/helpers';

const VALID_TEST_PASSWORD = 'password123';
// Valid MongoDB ObjectId format but doesn't exist in test database
const NON_EXISTENT_GUEST_ID = '507f1f77bcf86cd799439011';

describe('Guest Routes Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('GET /guests (admin only)', () => {
    it('should return all guests (users with role=user) for admin', async () => {
      const { cookies } = await createAdmin();

      // Create guest users (role='user')
      const guest1 = await createUser({
        full_name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        role: 'user',
      });
      const guest2 = await createUser({
        full_name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '0987654321',
        role: 'user',
      });

      // Create an admin user - should NOT be included in guests list
      await createUser({
        full_name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
      });

      const response = await request(app)
        .get('/guests')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // Should only return the 2 guest users, not the admin
      expect(response.body.length).toBe(2);

      // Verify guests are returned with correct fields
      const guestIds = response.body.map((g: any) => g.id);
      expect(guestIds).toContain(guest1._id.toString());
      expect(guestIds).toContain(guest2._id.toString());

      // Verify response includes expected fields
      response.body.forEach((guest: any) => {
        expect(guest).toHaveProperty('id');
        expect(guest).toHaveProperty('full_name');
        expect(guest).toHaveProperty('email');
        expect(guest).toHaveProperty('phone');
        // Should not include password or role in response
        expect(guest).not.toHaveProperty('password');
      });
    });

    it('should return 403 for non-admin user', async () => {
      const { cookies } = await createAuthenticatedUser('user');

      const response = await request(app)
        .get('/guests')
        .set('Cookie', cookies);

      expect(response.status).toBe(403);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/guests');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /guests/:id (admin only)', () => {
    it('should update guest (user) when admin authenticated', async () => {
      const { cookies } = await createAdmin();
      const guest = await createUser({
        full_name: 'Original Name',
        email: 'original@example.com',
        phone: '1111111111',
        role: 'user',
      });

      const updates = {
        full_name: 'Updated Name',
        phone: '2222222222',
      };

      const response = await request(app)
        .put(`/guests/${guest._id}`)
        .set('Cookie', cookies)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(guest._id.toString());
      expect(response.body.full_name).toBe('Updated Name');
      expect(response.body.phone).toBe('2222222222');
      expect(response.body.email).toBe('original@example.com');

      // Verify update in database
      const dbUser = await User.findById(guest._id);
      expect(dbUser).toBeTruthy();
      expect(dbUser!.full_name).toBe('Updated Name');
      expect(dbUser!.phone).toBe('2222222222');
      expect(dbUser!.email).toBe('original@example.com');
    });

    it('should return 404 for non-existent guest', async () => {
      const { cookies } = await createAdmin();

      const updates = {
        full_name: 'Updated Name',
        phone: '3333333333',
      };

      const response = await request(app)
        .put(`/guests/${NON_EXISTENT_GUEST_ID}`)
        .set('Cookie', cookies)
        .send(updates);

      expect(response.status).toBe(404);
      // Note: Guest API uses lowercase 'guest not found' (unlike Hotels/Rooms which use capitals)
      expect(response.body.message).toContain('guest not found');
    });

    it('should return 403 for non-admin user', async () => {
      const { cookies } = await createAuthenticatedUser('user');
      const guest = await createUser({
        full_name: 'Test Guest',
        role: 'user',
      });

      const updates = {
        full_name: 'Hacker Name',
      };

      const response = await request(app)
        .put(`/guests/${guest._id}`)
        .set('Cookie', cookies)
        .send(updates);

      expect(response.status).toBe(403);
    });

    it('should return 401 for unauthenticated request', async () => {
      const guest = await createUser({
        full_name: 'Test Guest',
        role: 'user',
      });

      const updates = {
        full_name: 'Unauthorized Update',
      };

      const response = await request(app)
        .put(`/guests/${guest._id}`)
        .send(updates);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /guests/:id (admin only)', () => {
    it('should delete guest (user) when admin authenticated', async () => {
      const { cookies } = await createAdmin();
      const guest = await createUser({
        full_name: 'Guest To Delete',
        email: 'delete@example.com',
        phone: '4444444444',
        role: 'user',
      });

      const response = await request(app)
        .delete(`/guests/${guest._id}`)
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(guest._id.toString());
      expect(response.body.full_name).toBe('Guest To Delete');
      expect(response.body.email).toBe('delete@example.com');
      expect(response.body.phone).toBe('4444444444');

      // Verify deletion in database
      const dbUser = await User.findById(guest._id);
      expect(dbUser).toBeNull();
    });

    it('should return 404 for non-existent guest', async () => {
      const { cookies } = await createAdmin();

      const response = await request(app)
        .delete(`/guests/${NON_EXISTENT_GUEST_ID}`)
        .set('Cookie', cookies);

      expect(response.status).toBe(404);
      // Note: Guest API uses lowercase 'guest not found' (unlike Hotels/Rooms which use capitals)
      expect(response.body.message).toContain('guest not found');
    });

    it('should return 403 for non-admin user', async () => {
      const { cookies } = await createAuthenticatedUser('user');
      const guest = await createUser({
        full_name: 'Forbidden Delete Guest',
        role: 'user',
      });

      const response = await request(app)
        .delete(`/guests/${guest._id}`)
        .set('Cookie', cookies);

      expect(response.status).toBe(403);
    });

    it('should return 401 for unauthenticated request', async () => {
      const guest = await createUser({
        full_name: 'Unauthorized Delete Guest',
        role: 'user',
      });

      const response = await request(app)
        .delete(`/guests/${guest._id}`);

      expect(response.status).toBe(401);
    });
  });
});
