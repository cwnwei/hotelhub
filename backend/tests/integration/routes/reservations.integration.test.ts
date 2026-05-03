/**
 * Integration tests for reservation routes.
 * Tests GET /reservations, GET /reservations/my-reservations, POST /reservations,
 * PUT /reservations/:id, DELETE /reservations/:id.
 */
import request from 'supertest';
import app from '../../../src/app';
import Reservation from '../../../src/models/Reservation';
import { setupTestDB, clearTestDB, teardownTestDB } from '../setup/db';
import { createReservation, createRoom, createUser, createHotel } from '../setup/fixtures';
import { createAuthenticatedUser, createAdmin } from '../setup/helpers';

const VALID_TEST_PASSWORD = 'password123';
const VALID_GUEST_ID = '507f1f77bcf86cd799439011';
const VALID_ROOM_ID = '507f1f77bcf86cd799439012';
const NON_EXISTENT_RESERVATION_ID = '507f1f77bcf86cd799439013';
const CHECK_IN_DATE = '2026-06-10';
const CHECK_OUT_DATE = '2026-06-15';
const NUM_GUESTS = 2;
const TOTAL_AMOUNT = 500;
const RESERVATION_STATUS = 'confirmed';

describe('Reservation Routes Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('GET /reservations', () => {
    it('should return all reservations for authenticated user', async () => {
      const { cookies } = await createAuthenticatedUser('user');
      const hotel = await createHotel();
      const room1 = await createRoom({ hotel_id: hotel._id });
      const room2 = await createRoom({ hotel_id: hotel._id });
      const user = await createUser();

      const reservation1 = await createReservation({
        guest_id: user._id,
        room_id: room1._id,
        check_in_date: '2026-07-01',
        check_out_date: '2026-07-05',
      });
      const reservation2 = await createReservation({
        guest_id: user._id,
        room_id: room2._id,
        check_in_date: '2026-08-01',
        check_out_date: '2026-08-05',
      });

      const response = await request(app)
        .get('/reservations')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);

      // Verify reservations are returned with id and hotel_id fields
      const reservationIds = response.body.map((r: any) => r.id);
      expect(reservationIds).toContain(reservation1._id.toString());
      expect(reservationIds).toContain(reservation2._id.toString());

      // Verify hotel_id is enriched
      response.body.forEach((r: any) => {
        expect(r).toHaveProperty('hotel_id');
        expect(r.hotel_id.toString()).toBe(hotel._id.toString());
      });
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/reservations');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /reservations/my-reservations', () => {
    it('should return only current user\'s reservations', async () => {
      const hotel = await createHotel();
      const room1 = await createRoom({ hotel_id: hotel._id });
      const room2 = await createRoom({ hotel_id: hotel._id });

      // Create first user with their reservation
      const { user: user1, cookies: cookies1 } = await createAuthenticatedUser('user');
      const reservation1 = await createReservation({
        guest_id: user1._id,
        room_id: room1._id,
        check_in_date: '2026-07-01',
        check_out_date: '2026-07-05',
      });

      // Create second user with their reservation
      const user2 = await createUser();
      await createReservation({
        guest_id: user2._id,
        room_id: room2._id,
        check_in_date: '2026-08-01',
        check_out_date: '2026-08-05',
      });

      const response = await request(app)
        .get('/reservations/my-reservations')
        .set('Cookie', cookies1);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(reservation1._id.toString());
      expect(response.body[0].guest_id).toBe(user1._id.toString());

      // Verify enriched data (room and hotel)
      expect(response.body[0]).toHaveProperty('room');
      expect(response.body[0]).toHaveProperty('hotel');
      expect(response.body[0].room.room_number).toBe(room1.room_number);
      expect(response.body[0].hotel.name).toBe(hotel.name);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/reservations/my-reservations');

      expect(response.status).toBe(401);
    });
  });

  // Note: All reservation endpoints allow both 'admin' and 'user' roles (authorizeRoles('admin', 'user')),
  // so no 403 Forbidden tests are needed. Both user types have full CRUD access to reservations.
  describe('POST /reservations', () => {
    it('should create reservation with valid data', async () => {
      const { cookies } = await createAuthenticatedUser('user');
      const hotel = await createHotel();
      const room = await createRoom({ hotel_id: hotel._id });
      const user = await createUser();

      const newReservation = {
        guest_id: user._id.toString(),
        room_id: room._id.toString(),
        check_in_date: CHECK_IN_DATE,
        check_out_date: CHECK_OUT_DATE,
        num_guests: NUM_GUESTS,
        total_amount: TOTAL_AMOUNT,
        status: RESERVATION_STATUS,
      };

      const response = await request(app)
        .post('/reservations')
        .set('Cookie', cookies)
        .send(newReservation);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.guest_id).toBe(user._id.toString());
      expect(response.body.room_id).toBe(room._id.toString());
      expect(response.body.check_in_date).toBe(CHECK_IN_DATE);
      expect(response.body.check_out_date).toBe(CHECK_OUT_DATE);
      expect(response.body.num_guests).toBe(NUM_GUESTS);

      // Verify reservation is in database
      const dbReservation = await Reservation.findById(response.body.id);
      expect(dbReservation).toBeTruthy();
      expect(dbReservation!.guest_id).toBe(user._id.toString());
      expect(dbReservation!.room_id).toBe(room._id.toString());
    });

    it('should return 400 when room does not exist', async () => {
      const { cookies } = await createAuthenticatedUser('user');
      const user = await createUser();

      const newReservation = {
        guest_id: user._id.toString(),
        room_id: VALID_ROOM_ID, // Non-existent room
        check_in_date: CHECK_IN_DATE,
        check_out_date: CHECK_OUT_DATE,
        num_guests: NUM_GUESTS,
        total_amount: TOTAL_AMOUNT,
        status: RESERVATION_STATUS,
      };

      const response = await request(app)
        .post('/reservations')
        .set('Cookie', cookies)
        .send(newReservation);

      expect(response.status).toBe(400);
      // Note: API returns plain string instead of { message: "..." } object
      expect(response.text).toContain('Room does not exist');
    });

    it('should return 400 when guest does not exist', async () => {
      const { cookies } = await createAuthenticatedUser('user');
      const hotel = await createHotel();
      const room = await createRoom({ hotel_id: hotel._id });

      const newReservation = {
        guest_id: VALID_GUEST_ID, // Non-existent guest
        room_id: room._id.toString(),
        check_in_date: CHECK_IN_DATE,
        check_out_date: CHECK_OUT_DATE,
        num_guests: NUM_GUESTS,
        total_amount: TOTAL_AMOUNT,
        status: RESERVATION_STATUS,
      };

      const response = await request(app)
        .post('/reservations')
        .set('Cookie', cookies)
        .send(newReservation);

      expect(response.status).toBe(400);
      // Note: API returns plain string instead of { message: "..." } object
      expect(response.text).toContain('Guest does not exist');
    });

    it('should return 401 for unauthenticated request', async () => {
      const hotel = await createHotel();
      const room = await createRoom({ hotel_id: hotel._id });
      const user = await createUser();

      const newReservation = {
        guest_id: user._id.toString(),
        room_id: room._id.toString(),
        check_in_date: CHECK_IN_DATE,
        check_out_date: CHECK_OUT_DATE,
        num_guests: NUM_GUESTS,
        total_amount: TOTAL_AMOUNT,
        status: RESERVATION_STATUS,
      };

      const response = await request(app)
        .post('/reservations')
        .send(newReservation);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /reservations/:id', () => {
    it('should update reservation with valid data', async () => {
      const { cookies } = await createAuthenticatedUser('user');
      const hotel = await createHotel();
      const room = await createRoom({ hotel_id: hotel._id });
      const user = await createUser();
      const reservation = await createReservation({
        guest_id: user._id,
        room_id: room._id,
        num_guests: 2,
        status: 'pending',
      });

      const updates = {
        guest_id: user._id.toString(),
        room_id: room._id.toString(),
        num_guests: 3,
        status: 'confirmed',
        total_amount: 600,
      };

      const response = await request(app)
        .put(`/reservations/${reservation._id}`)
        .set('Cookie', cookies)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.num_guests).toBe(3);
      expect(response.body.status).toBe('confirmed');
      expect(response.body.total_amount).toBe(600);

      // Verify update in database
      const dbReservation = await Reservation.findById(reservation._id);
      expect(dbReservation!.num_guests).toBe(3);
      expect(dbReservation!.status).toBe('confirmed');
      expect(dbReservation!.total_amount).toBe(600);
    });

    it('should return 404 for non-existent reservation', async () => {
      const { cookies } = await createAuthenticatedUser('user');
      const hotel = await createHotel();
      const room = await createRoom({ hotel_id: hotel._id });
      const user = await createUser();

      const updates = {
        guest_id: user._id.toString(),
        room_id: room._id.toString(),
        num_guests: 3,
        status: 'confirmed',
      };

      const response = await request(app)
        .put(`/reservations/${NON_EXISTENT_RESERVATION_ID}`)
        .set('Cookie', cookies)
        .send(updates);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('reservation not found');
    });

    it('should return 401 for unauthenticated request', async () => {
      const hotel = await createHotel();
      const room = await createRoom({ hotel_id: hotel._id });
      const user = await createUser();
      const reservation = await createReservation({
        guest_id: user._id,
        room_id: room._id,
      });

      const updates = {
        guest_id: user._id.toString(),
        room_id: room._id.toString(),
        status: 'confirmed',
      };

      const response = await request(app)
        .put(`/reservations/${reservation._id}`)
        .send(updates);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /reservations/:id', () => {
    it('should delete reservation', async () => {
      const { cookies } = await createAuthenticatedUser('user');
      const hotel = await createHotel();
      const room = await createRoom({ hotel_id: hotel._id });
      const user = await createUser();
      const reservation = await createReservation({
        guest_id: user._id,
        room_id: room._id,
      });

      const response = await request(app)
        .delete(`/reservations/${reservation._id}`)
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(reservation._id.toString());

      // Verify deletion in database
      const dbReservation = await Reservation.findById(reservation._id);
      expect(dbReservation).toBeNull();
    });

    it('should return 404 for non-existent reservation', async () => {
      const { cookies } = await createAuthenticatedUser('user');

      const response = await request(app)
        .delete(`/reservations/${NON_EXISTENT_RESERVATION_ID}`)
        .set('Cookie', cookies);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('reservation not found');
    });

    it('should return 401 for unauthenticated request', async () => {
      const hotel = await createHotel();
      const room = await createRoom({ hotel_id: hotel._id });
      const user = await createUser();
      const reservation = await createReservation({
        guest_id: user._id,
        room_id: room._id,
      });

      const response = await request(app)
        .delete(`/reservations/${reservation._id}`);

      expect(response.status).toBe(401);
    });
  });
});
