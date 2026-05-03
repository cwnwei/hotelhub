/**
 * Integration tests for room routes.
 * Tests GET /rooms, GET /rooms/search, POST /rooms, PUT /rooms/:id, DELETE /rooms/:id.
 */
import request from 'supertest';
import app from '../../../src/app';
import Room from '../../../src/models/Room';
import { setupTestDB, clearTestDB, teardownTestDB } from '../setup/db';
import { createRoom, createHotel, createReservation } from '../setup/fixtures';
import { createAuthenticatedUser, createAdmin } from '../setup/helpers';

const VALID_TEST_PASSWORD = 'password123';

describe('Room Routes Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('GET /rooms', () => {
    it('should return all rooms for authenticated user', async () => {
      const { cookies } = await createAuthenticatedUser('user');
      const hotel = await createHotel();
      const room1 = await createRoom({ hotel_id: hotel._id, room_number: '101' });
      const room2 = await createRoom({ hotel_id: hotel._id, room_number: '102' });

      const response = await request(app)
        .get('/rooms')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);

      // Verify rooms are returned with id field
      const roomIds = response.body.map((r: any) => r.id);
      expect(roomIds).toContain(room1._id.toString());
      expect(roomIds).toContain(room2._id.toString());
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/rooms');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /rooms/search', () => {
    it('should search available rooms with required parameters', async () => {
      const hotel = await createHotel({ name: 'Grand Plaza Hotel' });
      const room = await createRoom({
        hotel_id: hotel._id,
        room_number: '201',
        room_type: 'deluxe',
        max_guests: '4',
        price_per_night: 150,
      });

      const response = await request(app)
        .get('/rooms/search')
        .query({
          check_in_date: '2026-07-01',
          check_out_date: '2026-07-05',
          num_guests: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('rooms');
      expect(Array.isArray(response.body.rooms)).toBe(true);
      expect(response.body.rooms.length).toBeGreaterThan(0);

      // Verify room is in results
      const foundRoom = response.body.rooms.find((r: any) => r.room_number === '201');
      expect(foundRoom).toBeDefined();
      expect(foundRoom.room_type).toBe('deluxe');
      expect(foundRoom.hotel).toBeDefined();
      expect(foundRoom.hotel.name).toBe('Grand Plaza Hotel');
    });

    it('should filter by max_guests capacity', async () => {
      const hotel = await createHotel();
      const smallRoom = await createRoom({
        hotel_id: hotel._id,
        room_number: '301',
        max_guests: '2',
      });
      const largeRoom = await createRoom({
        hotel_id: hotel._id,
        room_number: '302',
        max_guests: '6',
      });

      const response = await request(app)
        .get('/rooms/search')
        .query({
          check_in_date: '2026-08-01',
          check_out_date: '2026-08-05',
          num_guests: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.rooms.length).toBe(1);
      expect(response.body.rooms[0].room_number).toBe('302');
      expect(response.body.rooms[0].max_guests).toBe('6');
    });

    it('should return empty array when no rooms match criteria', async () => {
      const hotel = await createHotel();
      const room = await createRoom({
        hotel_id: hotel._id,
        room_number: '401',
        max_guests: '2',
      });

      // Search for room that requires more guests than available
      const response = await request(app)
        .get('/rooms/search')
        .query({
          check_in_date: '2026-09-01',
          check_out_date: '2026-09-05',
          num_guests: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body.rooms).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should exclude rooms with overlapping reservations', async () => {
      const hotel = await createHotel();
      const room = await createRoom({
        hotel_id: hotel._id,
        room_number: '501',
      });

      // Create a reservation for this room
      await createReservation({
        room_id: room._id,
        check_in_date: '2026-10-01',
        check_out_date: '2026-10-05',
        status: 'confirmed',
      });

      // Search for overlapping dates
      const response = await request(app)
        .get('/rooms/search')
        .query({
          check_in_date: '2026-10-03',
          check_out_date: '2026-10-07',
          num_guests: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body.rooms).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });

  describe('POST /rooms (admin only)', () => {
    it('should create room when admin authenticated', async () => {
      const { cookies } = await createAdmin();
      const hotel = await createHotel();

      const newRoom = {
        hotel_id: hotel._id.toString(),
        room_number: '601',
        room_type: 'suite',
        floor: 6,
        price_per_night: 250,
        max_guests: '4',
        amenities: ['WiFi', 'TV', 'Mini Bar'],
        status: 'available',
        image_url: 'https://example.com/room.jpg',
      };

      const response = await request(app)
        .post('/rooms')
        .set('Cookie', cookies)
        .send(newRoom);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.room_number).toBe('601');
      expect(response.body.room_type).toBe('suite');
      expect(response.body.price_per_night).toBe(250);

      // Verify room is in database
      const dbRoom = await Room.findById(response.body.id);
      expect(dbRoom).toBeTruthy();
      expect(dbRoom!.room_number).toBe('601');
      expect(dbRoom!.hotel_id.toString()).toBe(hotel._id.toString());
    });

    it('should return 403 for non-admin user', async () => {
      const { cookies } = await createAuthenticatedUser('user');
      const hotel = await createHotel();

      const newRoom = {
        hotel_id: hotel._id.toString(),
        room_number: '602',
        room_type: 'standard',
        floor: 6,
        price_per_night: 100,
        max_guests: '2',
        status: 'available',
      };

      const response = await request(app)
        .post('/rooms')
        .set('Cookie', cookies)
        .send(newRoom);

      expect(response.status).toBe(403);
    });

    it('should return 401 for unauthenticated request', async () => {
      const hotel = await createHotel();

      const newRoom = {
        hotel_id: hotel._id.toString(),
        room_number: '603',
        room_type: 'standard',
        floor: 6,
        price_per_night: 100,
        max_guests: '2',
        status: 'available',
      };

      const response = await request(app)
        .post('/rooms')
        .send(newRoom);

      expect(response.status).toBe(401);
    });

    it('should return 404 when hotel does not exist', async () => {
      const { cookies } = await createAdmin();

      const newRoom = {
        hotel_id: '507f1f77bcf86cd799439011', // Non-existent hotel ID
        room_number: '604',
        room_type: 'standard',
        floor: 6,
        price_per_night: 100,
        max_guests: '2',
        status: 'available',
      };

      const response = await request(app)
        .post('/rooms')
        .set('Cookie', cookies)
        .send(newRoom);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Hotel not found');
    });

    it('should return 400 when room number already exists for hotel', async () => {
      const { cookies } = await createAdmin();
      const hotel = await createHotel();
      await createRoom({ hotel_id: hotel._id, room_number: '605' });

      const duplicateRoom = {
        hotel_id: hotel._id.toString(),
        room_number: '605', // Duplicate
        room_type: 'standard',
        floor: 6,
        price_per_night: 100,
        max_guests: '2',
        status: 'available',
      };

      const response = await request(app)
        .post('/rooms')
        .set('Cookie', cookies)
        .send(duplicateRoom);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Room number already exists');
    });
  });

  describe('PUT /rooms/:id (admin only)', () => {
    it('should update room when admin authenticated', async () => {
      const { cookies } = await createAdmin();
      const hotel = await createHotel();
      const room = await createRoom({
        hotel_id: hotel._id,
        room_number: '701',
        price_per_night: 100,
        status: 'available',
      });

      const updates = {
        price_per_night: 150,
        status: 'cleaning',
        amenities: ['WiFi', 'TV', 'Mini Bar', 'Safe'],
      };

      const response = await request(app)
        .put(`/rooms/${room._id}`)
        .set('Cookie', cookies)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.price_per_night).toBe(150);
      expect(response.body.status).toBe('cleaning');
      expect(response.body.amenities).toContain('Safe');

      // Verify update in database
      const dbRoom = await Room.findById(room._id);
      expect(dbRoom!.price_per_night).toBe(150);
      expect(dbRoom!.status).toBe('cleaning');
    });

    it('should return 404 for non-existent room', async () => {
      const { cookies } = await createAdmin();

      const response = await request(app)
        .put('/rooms/507f1f77bcf86cd799439011')
        .set('Cookie', cookies)
        .send({ price_per_night: 200 });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Room not found');
    });

    it('should return 403 for non-admin user', async () => {
      const { cookies } = await createAuthenticatedUser('user');
      const hotel = await createHotel();
      const room = await createRoom({ hotel_id: hotel._id, room_number: '702' });

      const response = await request(app)
        .put(`/rooms/${room._id}`)
        .set('Cookie', cookies)
        .send({ price_per_night: 200 });

      expect(response.status).toBe(403);
    });

    it('should return 401 for unauthenticated request', async () => {
      const hotel = await createHotel();
      const room = await createRoom({ hotel_id: hotel._id, room_number: '703' });

      const response = await request(app)
        .put(`/rooms/${room._id}`)
        .send({ price_per_night: 200 });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /rooms/:id (admin only)', () => {
    it('should delete room when admin authenticated', async () => {
      const { cookies } = await createAdmin();
      const hotel = await createHotel();
      const room = await createRoom({
        hotel_id: hotel._id,
        room_number: '801',
      });

      const response = await request(app)
        .delete(`/rooms/${room._id}`)
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.room_number).toBe('801');

      // Verify deletion in database
      const dbRoom = await Room.findById(room._id);
      expect(dbRoom).toBeNull();
    });

    it('should return 404 for non-existent room', async () => {
      const { cookies } = await createAdmin();

      const response = await request(app)
        .delete('/rooms/507f1f77bcf86cd799439011')
        .set('Cookie', cookies);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Room not found');
    });

    it('should return 403 for non-admin user', async () => {
      const { cookies } = await createAuthenticatedUser('user');
      const hotel = await createHotel();
      const room = await createRoom({ hotel_id: hotel._id, room_number: '802' });

      const response = await request(app)
        .delete(`/rooms/${room._id}`)
        .set('Cookie', cookies);

      expect(response.status).toBe(403);
    });

    it('should return 401 for unauthenticated request', async () => {
      const hotel = await createHotel();
      const room = await createRoom({ hotel_id: hotel._id, room_number: '803' });

      const response = await request(app)
        .delete(`/rooms/${room._id}`);

      expect(response.status).toBe(401);
    });
  });
});
