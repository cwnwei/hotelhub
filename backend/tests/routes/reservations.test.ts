import request from 'supertest';
import app from '../../src/app';
import Reservation from '../../src/models/Reservation';
import Room from '../../src/models/Room';
import User from '../../src/models/User';
import jwt from 'jsonwebtoken';
import { createMockReservation, createMockRoom, createMockUser, createValidationError, createCastError, createJWTError } from '../setup/testUtils';

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
          check_in_date: '2026-05-01',
          check_out_date: '2026-05-05',
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
          check_in_date: '2026-05-01',
          check_out_date: '2026-05-05'
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
          check_in_date: '2026-05-01',
          check_out_date: '2026-05-05',
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
});
