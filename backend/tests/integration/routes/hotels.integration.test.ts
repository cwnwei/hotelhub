/**
 * Integration tests for hotel routes.
 * Tests GET /hotels, GET /hotels/:id, POST /hotels (admin), PUT /hotels/:id (admin), DELETE /hotels/:id (admin).
 * Note: Invalid MongoDB ObjectId format tests (e.g., GET /hotels/invalid-id) are intentionally not included
 * for consistency with other route integration tests (Tasks 5 and 6).
 */
import request from 'supertest';
import app from '../../../src/app';
import Hotel from '../../../src/models/Hotel';
import { setupTestDB, clearTestDB, teardownTestDB } from '../setup/db';
import { createHotel } from '../setup/fixtures';
import { createAuthenticatedUser, createAdmin } from '../setup/helpers';

const VALID_TEST_PASSWORD = 'password123';
// Valid MongoDB ObjectId format but doesn't exist in test database
const NON_EXISTENT_HOTEL_ID = '507f1f77bcf86cd799439011';

describe('Hotel Routes Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('GET /hotels', () => {
    it('should return all hotels for authenticated user', async () => {
      const { cookies } = await createAuthenticatedUser('user');
      const hotel1 = await createHotel({ name: 'Grand Plaza Hotel', city: 'New York' });
      const hotel2 = await createHotel({ name: 'Beach Resort', city: 'Miami' });

      const response = await request(app)
        .get('/hotels')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);

      // Verify hotels are returned with id field
      const hotelIds = response.body.map((h) => h.id);
      expect(hotelIds).toContain(hotel1._id.toString());
      expect(hotelIds).toContain(hotel2._id.toString());
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/hotels');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /hotels/:id', () => {
    it('should return hotel by id for authenticated user', async () => {
      const { cookies } = await createAuthenticatedUser('user');
      const hotel = await createHotel({
        name: 'Mountain Lodge',
        city: 'Denver',
        star_rating: 4,
      });

      const response = await request(app)
        .get(`/hotels/${hotel._id}`)
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(hotel._id.toString());
      expect(response.body.name).toBe('Mountain Lodge');
      expect(response.body.city).toBe('Denver');
      expect(response.body.star_rating).toBe(4);
    });

    it('should return 404 for non-existent hotel', async () => {
      const { cookies } = await createAuthenticatedUser('user');

      const response = await request(app)
        .get(`/hotels/${NON_EXISTENT_HOTEL_ID}`)
        .set('Cookie', cookies);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Hotel not found');
    });

    it('should return 401 for unauthenticated request', async () => {
      const hotel = await createHotel();

      const response = await request(app)
        .get(`/hotels/${hotel._id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /hotels (admin only)', () => {
    it('should create hotel when admin authenticated', async () => {
      const { cookies } = await createAdmin();

      const newHotel = {
        name: 'Luxury Resort & Spa',
        address: '123 Sunset Boulevard',
        city: 'Los Angeles',
        country: 'USA',
        phone: '+1-310-555-0100',
        email: 'info@luxuryresort.com',
        star_rating: 5,
        image_url: 'https://example.com/luxury-resort.jpg',
        description: 'A luxurious beachfront resort with world-class amenities',
      };

      const response = await request(app)
        .post('/hotels')
        .set('Cookie', cookies)
        .send(newHotel);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Luxury Resort & Spa');
      expect(response.body.city).toBe('Los Angeles');
      expect(response.body.star_rating).toBe(5);
      expect(response.body.email).toBe('info@luxuryresort.com');

      // Verify hotel is in database
      const dbHotel = await Hotel.findById(response.body.id);
      expect(dbHotel).toBeTruthy();
      expect(dbHotel.name).toBe('Luxury Resort & Spa');
      expect(dbHotel.address).toBe('123 Sunset Boulevard');
    });

    it('should return 400 when hotel with same name and address already exists', async () => {
      const { cookies } = await createAdmin();
      await createHotel({
        name: 'Duplicate Hotel',
        address: '456 Main Street',
      });

      const duplicateHotel = {
        name: 'Duplicate Hotel',
        address: '456 Main Street',
        city: 'Chicago',
        country: 'USA',
        phone: '+1-312-555-0200',
        email: 'info@duplicate.com',
        star_rating: 3,
      };

      const response = await request(app)
        .post('/hotels')
        .set('Cookie', cookies)
        .send(duplicateHotel);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Hotel with this name and address already exists');
    });

    it('should return 403 for non-admin user', async () => {
      const { cookies } = await createAuthenticatedUser('user');

      const newHotel = {
        name: 'City Center Hotel',
        address: '789 Downtown Avenue',
        city: 'Boston',
        country: 'USA',
        phone: '+1-617-555-0300',
        email: 'info@citycenter.com',
        star_rating: 4,
      };

      const response = await request(app)
        .post('/hotels')
        .set('Cookie', cookies)
        .send(newHotel);

      expect(response.status).toBe(403);
    });

    it('should return 401 for unauthenticated request', async () => {
      const newHotel = {
        name: 'Unauthorized Hotel',
        address: '999 Test Street',
        city: 'Seattle',
        country: 'USA',
        phone: '+1-206-555-0400',
        email: 'info@unauthorized.com',
        star_rating: 3,
      };

      const response = await request(app)
        .post('/hotels')
        .send(newHotel);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /hotels/:id (admin only)', () => {
    it('should update hotel when admin authenticated', async () => {
      const { cookies } = await createAdmin();
      const hotel = await createHotel({
        name: 'Old Hotel Name',
        city: 'Portland',
        star_rating: 3,
        phone: '+1-503-555-0100',
      });

      const updates = {
        name: 'Renovated Grand Hotel',
        star_rating: 4,
        phone: '+1-503-555-0999',
        description: 'Recently renovated with modern amenities',
      };

      const response = await request(app)
        .put(`/hotels/${hotel._id}`)
        .set('Cookie', cookies)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Renovated Grand Hotel');
      expect(response.body.star_rating).toBe(4);
      expect(response.body.phone).toBe('+1-503-555-0999');
      expect(response.body.description).toBe('Recently renovated with modern amenities');

      // Verify update in database
      const dbHotel = await Hotel.findById(hotel._id);
      expect(dbHotel.name).toBe('Renovated Grand Hotel');
      expect(dbHotel.star_rating).toBe(4);
      expect(dbHotel.phone).toBe('+1-503-555-0999');
    });

    it('should return 404 for non-existent hotel', async () => {
      const { cookies } = await createAdmin();

      const updates = {
        name: 'Updated Name',
        star_rating: 5,
      };

      const response = await request(app)
        .put(`/hotels/${NON_EXISTENT_HOTEL_ID}`)
        .set('Cookie', cookies)
        .send(updates);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Hotel not found');
    });

    it('should return 403 for non-admin user', async () => {
      const { cookies } = await createAuthenticatedUser('user');
      const hotel = await createHotel({ name: 'Forbidden Update Hotel' });

      const updates = {
        name: 'Hacker Hotel',
        star_rating: 5,
      };

      const response = await request(app)
        .put(`/hotels/${hotel._id}`)
        .set('Cookie', cookies)
        .send(updates);

      expect(response.status).toBe(403);
    });

    it('should return 401 for unauthenticated request', async () => {
      const hotel = await createHotel({ name: 'Unauthorized Update Hotel' });

      const updates = {
        name: 'Changed Name',
        star_rating: 5,
      };

      const response = await request(app)
        .put(`/hotels/${hotel._id}`)
        .send(updates);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /hotels/:id (admin only)', () => {
    it('should delete hotel when admin authenticated', async () => {
      const { cookies } = await createAdmin();
      const hotel = await createHotel({ name: 'Hotel To Delete' });

      const response = await request(app)
        .delete(`/hotels/${hotel._id}`)
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(hotel._id.toString());
      expect(response.body.name).toBe('Hotel To Delete');

      // Verify deletion in database
      const dbHotel = await Hotel.findById(hotel._id);
      expect(dbHotel).toBeNull();
    });

    it('should return 404 for non-existent hotel', async () => {
      const { cookies } = await createAdmin();

      const response = await request(app)
        .delete(`/hotels/${NON_EXISTENT_HOTEL_ID}`)
        .set('Cookie', cookies);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Hotel not found');
    });

    it('should return 403 for non-admin user', async () => {
      const { cookies } = await createAuthenticatedUser('user');
      const hotel = await createHotel({ name: 'Forbidden Delete Hotel' });

      const response = await request(app)
        .delete(`/hotels/${hotel._id}`)
        .set('Cookie', cookies);

      expect(response.status).toBe(403);
    });

    it('should return 401 for unauthenticated request', async () => {
      const hotel = await createHotel({ name: 'Unauthorized Delete Hotel' });

      const response = await request(app)
        .delete(`/hotels/${hotel._id}`);

      expect(response.status).toBe(401);
    });
  });
});
