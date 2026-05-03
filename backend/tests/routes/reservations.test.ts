import request from 'supertest';
import app from '../../src/app';
import Reservation from '../../src/models/Reservation';
import Room from '../../src/models/Room';
import User from '../../src/models/User';
import jwt from 'jsonwebtoken';
import { createMockReservation, createMockRoom, createMockUser, createValidationError, createCastError, createJWTError, getFutureDate, getPastDate } from '../setup/testUtils';

// Mock dependencies
jest.mock('../../src/models/Reservation');
jest.mock('../../src/models/Room');
jest.mock('../../src/models/User');
jest.mock('../../src/models/Hotel');
jest.mock('jsonwebtoken');
jest.mock('../../src/config/database', () => ({
  connectDB: jest.fn(),
}));

describe('Reservation Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /reservations', () => {
    it('should return all reservations for authenticated user', async () => {
      const mockReservations = [
        { ...createMockReservation(), toObject: () => createMockReservation(), _id: 'res123', room_id: 'room123' },
        { ...createMockReservation({ _id: 'res456' }), toObject: () => ({ ...createMockReservation(), _id: 'res456' }), _id: 'res456', room_id: 'room123' }
      ];

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });
      (Reservation.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockReservations)
      });
      (Room.findById as jest.Mock).mockResolvedValue(createMockRoom());

      const response = await request(app)
        .get('/reservations')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 without JWT token', async () => {
      const response = await request(app).get('/reservations');

      expect(response.status).toBe(401);
    });

    it('should return 500 when database error occurs', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });
      (Reservation.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Database connection error'))
      });

      const response = await request(app)
        .get('/reservations')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error');
    });
  });

  describe('GET /reservations/my-reservations', () => {
    it('should return only current user reservations', async () => {
      const mockReservations = [
        { ...createMockReservation({ guest_id: 'user123' }), toObject: () => createMockReservation(), _id: 'res123', room_id: 'room123' }
      ];

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });
      (Reservation.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockReservations)
      });
      (Room.findById as jest.Mock).mockResolvedValue(createMockRoom());

      const response = await request(app)
        .get('/reservations/my-reservations')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 when JWT token is missing', async () => {
      const response = await request(app)
        .get('/reservations/my-reservations');

      expect(response.status).toBe(401);
    });

    it('should return 401 when JsonWebTokenError occurs', async () => {
      const jwtError = createJWTError('jwt malformed');
      (jwt.verify as jest.Mock).mockImplementation(() => { throw jwtError; });

      const response = await request(app)
        .get('/reservations/my-reservations')
        .set('Cookie', ['jwtToken=malformed-token']);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid JWT token');
    });
  });

  describe('POST /reservations', () => {
    it('should create reservation with valid data', async () => {
      const reservationData = createMockReservation();
      const newReservation = {
        ...reservationData,
        id: 'res123',
        toJSON: () => reservationData
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });
      (Room.findById as jest.Mock).mockResolvedValue({ ...createMockRoom(), id: 'room123' });
      (User.findById as jest.Mock).mockResolvedValue({ ...createMockUser(), id: 'user123' });

      // Ensure Reservation.create is properly mocked
      (Reservation.create as jest.Mock).mockClear();
      (Reservation.create as jest.Mock).mockResolvedValue(newReservation);

      console.log('Mocks set up:', {
        reservationCreateMocked: jest.isMockFunction(Reservation.create),
        roomFindByIdMocked: jest.isMockFunction(Room.findById),
        userFindByIdMocked: jest.isMockFunction(User.findById)
      });

      const response = await request(app)
        .post('/reservations')
        .set('Cookie', ['jwtToken=valid-token'])
        .send({
          guest_id: 'user123',
          room_id: 'room123',
          check_in_date: getFutureDate(1),
          check_out_date: getFutureDate(5),
          num_guests: 2
        });

      if (response.status !== 200) {
        console.log('Error response:', response.status, response.body, response.text);
      }
      expect(response.status).toBe(200);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/reservations')
        .send({
          room_id: 'room123',
          check_in_date: getFutureDate(1),
          check_out_date: getFutureDate(5)
        });

      expect(response.status).toBe(401);
    });

    it('should return 500 when unexpected error occurs', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });
      (Room.findById as jest.Mock).mockResolvedValue(createMockRoom());
      (User.findById as jest.Mock).mockResolvedValue(createMockUser());
      (Reservation.create as jest.Mock).mockRejectedValue(new Error('Unexpected database error'));

      const response = await request(app)
        .post('/reservations')
        .set('Cookie', ['jwtToken=valid-token'])
        .send({
          guest_id: 'user123',
          room_id: 'room123',
          check_in_date: getFutureDate(1),
          check_out_date: getFutureDate(5),
          num_guests: 2
        });

      // POST endpoint doesn't have try-catch, so error is handled by Express default handler
      expect(response.status).toBe(500);
    });
  });

  describe('PUT /reservations/:id', () => {
    it('should update reservation successfully', async () => {
      const reservationData = { ...createMockReservation(), num_guests: 3 };
      const updatedReservation = {
        ...reservationData,
        id: 'res123',
        toJSON: () => reservationData
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });
      (Room.findById as jest.Mock).mockResolvedValue({ ...createMockRoom(), id: 'room123' });
      (User.findById as jest.Mock).mockResolvedValue({ ...createMockUser(), id: 'user123' });
      (Reservation.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedReservation);

      const response = await request(app)
        .put('/reservations/res123')
        .set('Cookie', ['jwtToken=valid-token'])
        .send({
          guest_id: 'user123',
          room_id: 'room123',
          num_guests: 3
        });

      expect(response.status).toBe(200);
    });

    it('should return 404 for invalid reservation ID', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });
      (Room.findById as jest.Mock).mockResolvedValue(createMockRoom());
      (User.findById as jest.Mock).mockResolvedValue(createMockUser());
      (Reservation.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/reservations/invalid-id')
        .set('Cookie', ['jwtToken=valid-token'])
        .send({
          guest_id: 'user123',
          room_id: 'room123',
          num_guests: 3
        });

      expect(response.status).toBe(404);
    });

    it('should return 400 when ValidationError occurs', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });
      (Room.findById as jest.Mock).mockResolvedValue(createMockRoom());
      (User.findById as jest.Mock).mockResolvedValue(createMockUser());
      const validationError = createValidationError('Invalid number of guests');
      (Reservation.findByIdAndUpdate as jest.Mock).mockRejectedValue(validationError);

      const response = await request(app)
        .put('/reservations/res123')
        .set('Cookie', ['jwtToken=valid-token'])
        .send({
          guest_id: 'user123',
          room_id: 'room123',
          num_guests: -1
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid number of guests');
    });
  });

  describe('DELETE /reservations/:id', () => {
    it('should cancel reservation successfully', async () => {
      const reservationData = createMockReservation();
      const deletedReservation = {
        ...reservationData,
        id: 'res123',
        toJSON: () => reservationData
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });
      (Reservation.findByIdAndDelete as jest.Mock).mockResolvedValue(deletedReservation);

      const response = await request(app)
        .delete('/reservations/res123')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
    });

    it('should return 404 for invalid reservation ID', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });
      (Reservation.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete('/reservations/invalid-id')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(404);
    });

    it('should return 400 when CastError occurs', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });
      const castError = createCastError('Invalid ObjectId');
      (Reservation.findByIdAndDelete as jest.Mock).mockRejectedValue(castError);

      const response = await request(app)
        .delete('/reservations/invalid-format-id')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid reservation ID');
    });
  });

  // -------------------------------------------------------------------------
  // GET /reservations/my-reservations
  // -------------------------------------------------------------------------
  describe('GET /reservations/my-reservations – uncovered branches', () => {
    /**
     * Line 38: The route guards for a missing jwtToken cookie *after* the
     * authorizeRoles middleware already ran.  The existing test sends no cookie
     * at all (so authorizeRoles returns 401 first).  To reach line 38 we must
     * pass authorizeRoles but arrive without a jwtToken cookie, which can't
     * actually happen in normal flow — the same cookie is checked by both.
     *
     * In practice the easiest way to cover it is to make jwt.verify succeed
     * (so authorizeRoles passes) but send a request whose cookie header only
     * contains a different cookie, so req.cookies.jwtToken is undefined inside
     * the route handler.
     *
     * Because authorizeRoles reads req.cookies.jwtToken too, we need jwt.verify
     * to succeed on the first call (middleware) and not be called a second time
     * by the route.  The simplest approach: mock jwt.verify to succeed, then
     * send a cookie named differently.
     *
     * NOTE: if your authorizeRoles middleware does NOT check req.cookies.jwtToken
     * (e.g. it reads the Authorization header instead), adjust accordingly.
     */
    it('should return 500 when a generic error is thrown during my-reservations fetch (line 91)', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });
      (Reservation.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Unexpected DB failure')),
      });
 
      const response = await request(app)
        .get('/reservations/my-reservations')
        .set('Cookie', ['jwtToken=valid-token']);
 
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error');
    });
 
    it('should return null room and hotel when Room.findById returns null (lines 53, 60-77)', async () => {
      const mockReservation = {
        ...createMockReservation({ guest_id: 'user123' }),
        toObject: () => createMockReservation(),
        _id: 'res123',
        room_id: 'room-missing',
      };
 
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });
      (Reservation.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockReservation]),
      });
      // Room not found → hotel lookup should be skipped
      (Room.findById as jest.Mock).mockResolvedValue(null);
 
      const response = await request(app)
        .get('/reservations/my-reservations')
        .set('Cookie', ['jwtToken=valid-token']);
 
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0].room).toBeNull();
      expect(response.body[0].hotel).toBeNull();
    });
  });
 
  // -------------------------------------------------------------------------
  // PUT /reservations/:id
  // -------------------------------------------------------------------------
  describe('PUT /reservations/:id – uncovered branches', () => {
    it('should return 400 when room does not exist (line in PUT handler)', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });
      (Room.findById as jest.Mock).mockResolvedValue(null); // room not found
      (User.findById as jest.Mock).mockResolvedValue(createMockUser());
 
      const response = await request(app)
        .put('/reservations/res123')
        .set('Cookie', ['jwtToken=valid-token'])
        .send({
          guest_id: 'user123',
          room_id: 'nonexistent-room',
          num_guests: 2,
        });
 
      expect(response.status).toBe(400);
      expect(response.text).toContain('Room does not exist');
    });
 
    it('should return 400 when guest does not exist (line in PUT handler)', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });
      (Room.findById as jest.Mock).mockResolvedValue(createMockRoom());
      (User.findById as jest.Mock).mockResolvedValue(null); // guest not found
 
      const response = await request(app)
        .put('/reservations/res123')
        .set('Cookie', ['jwtToken=valid-token'])
        .send({
          guest_id: 'nonexistent-guest',
          room_id: 'room123',
          num_guests: 2,
        });
 
      expect(response.status).toBe(400);
      expect(response.text).toContain('Guest does not exist');
    });
 
    it('should return 500 when a generic (non-Validation) error is thrown (line 148)', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });
      (Room.findById as jest.Mock).mockResolvedValue(createMockRoom());
      (User.findById as jest.Mock).mockResolvedValue(createMockUser());
      (Reservation.findByIdAndUpdate as jest.Mock).mockRejectedValue(
        new Error('Generic DB error'),
      );
 
      const response = await request(app)
        .put('/reservations/res123')
        .set('Cookie', ['jwtToken=valid-token'])
        .send({
          guest_id: 'user123',
          room_id: 'room123',
          num_guests: 2,
        });
 
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error');
    });
  });
 
  // -------------------------------------------------------------------------
  // DELETE /reservations/:id
  // -------------------------------------------------------------------------
  describe('DELETE /reservations/:id – uncovered branches', () => {
    it('should return 500 when a generic (non-CastError) error is thrown (line 174)', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });
      (Reservation.findByIdAndDelete as jest.Mock).mockRejectedValue(
        new Error('Generic DB error'),
      );
 
      const response = await request(app)
        .delete('/reservations/res123')
        .set('Cookie', ['jwtToken=valid-token']);
 
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error');
    });
  });
 
  // -------------------------------------------------------------------------
  // GET /reservations – null room branch (line 38 analogue in GET /)
  // -------------------------------------------------------------------------
  describe('GET /reservations – null room branch', () => {
    it('should handle null room gracefully and return hotel_id as undefined', async () => {
      const mockReservation = {
        ...createMockReservation(),
        toObject: () => createMockReservation(),
        _id: 'res123',
        room_id: 'missing-room',
      };
 
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });
      (Reservation.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockReservation]),
      });
      (Room.findById as jest.Mock).mockResolvedValue(null);
 
      const response = await request(app)
        .get('/reservations')
        .set('Cookie', ['jwtToken=valid-token']);
 
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // hotel_id should be undefined / not present when room is null
      expect(response.body[0].hotel_id).toBeUndefined();
    });
  });
});
