import request from 'supertest';
import app from '../../src/app';
import Room from '../../src/models/Room';
import Hotel from '../../src/models/Hotel';
import Reservation from '../../src/models/Reservation';
import jwt from 'jsonwebtoken';
import { createMockRoom, createMockHotel, createValidationError, createCastError, createDuplicateKeyError } from '../setup/testUtils';

// Mock dependencies
jest.mock('../../src/models/Room');
jest.mock('../../src/models/Hotel');
jest.mock('../../src/models/Reservation');
jest.mock('jsonwebtoken');
jest.mock('../../src/config/database', () => ({
  connectDB: jest.fn(),
}));

describe('Room Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /rooms', () => {
    it('should return all rooms for authenticated user', async () => {
      const mockRooms = [
        { ...createMockRoom(), toObject: () => createMockRoom(), _id: 'room123' },
        { ...createMockRoom({ _id: 'room456', room_number: '102' }), toObject: () => ({ ...createMockRoom(), _id: 'room456', room_number: '102' }), _id: 'room456' }
      ];
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });
      (Room.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockRooms)
      });

      const response = await request(app)
        .get('/rooms')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('should return 401 without JWT token', async () => {
      const response = await request(app).get('/rooms');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Missing JWT Token');
    });
  });

  describe('GET /rooms/search', () => {
    it('should return available rooms matching criteria', async () => {
      const mockRooms = [{
        ...createMockRoom(),
        _id: 'room123',
        room_number: '101',
        room_type: 'deluxe',
        price_per_night: 150,
        max_guests: '2',
        hotel_id: createMockHotel()
      }];

      (Room.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockRooms)
        })
      });
      (Reservation.find as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/rooms/search')
        .query({
          check_in_date: '2026-05-01',
          check_out_date: '2026-05-05',
          num_guests: 2
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('rooms');
    });

    it('should return 400 when missing required parameters', async () => {
      const response = await request(app)
        .get('/rooms/search')
        .query({ num_guests: 2 });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });

    it('should return 400 for invalid date range', async () => {
      const response = await request(app)
        .get('/rooms/search')
        .query({
          check_in_date: '2026-05-05',
          check_out_date: '2026-05-01', // Check-out before check-in
          num_guests: 2
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('check_out_date must be after check_in_date');
    });

    it('should return 400 when num_guests is invalid (NaN)', async () => {
      const response = await request(app)
        .get('/rooms/search')
        .query({
          check_in_date: '2026-05-01',
          check_out_date: '2026-05-05',
          num_guests: 'abc'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('num_guests must be a positive number');
    });

    it('should return 400 when num_guests is less than 1', async () => {
      const response = await request(app)
        .get('/rooms/search')
        .query({
          check_in_date: '2026-05-01',
          check_out_date: '2026-05-05',
          num_guests: 0
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('num_guests must be a positive number');
    });

    it('should return 400 when check_in_date format is invalid', async () => {
      const response = await request(app)
        .get('/rooms/search')
        .query({
          check_in_date: 'invalid-date',
          check_out_date: '2026-05-05',
          num_guests: 2
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('check_in_date is not a valid date');
    });

    it('should return 400 when check_out_date format is invalid', async () => {
      const response = await request(app)
        .get('/rooms/search')
        .query({
          check_in_date: '2026-05-01',
          check_out_date: 'invalid-date',
          num_guests: 2
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('check_out_date is not a valid date');
    });

    it('should return 400 when check_in_date is in the past', async () => {
      const response = await request(app)
        .get('/rooms/search')
        .query({
          check_in_date: '2020-01-01',
          check_out_date: '2020-01-05',
          num_guests: 2
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('check_in_date cannot be in the past');
    });

    it('should filter rooms by min_price correctly', async () => {
      const mockRooms = [{
        ...createMockRoom({ price_per_night: 200 }),
        _id: 'room123',
        hotel_id: createMockHotel()
      }];

      (Room.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockRooms)
        })
      });
      (Reservation.find as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/rooms/search')
        .query({
          check_in_date: '2026-05-01',
          check_out_date: '2026-05-05',
          num_guests: 2,
          min_price: 100
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rooms');
    });

    it('should filter rooms by max_price correctly', async () => {
      const mockRooms = [{
        ...createMockRoom({ price_per_night: 100 }),
        _id: 'room123',
        hotel_id: createMockHotel()
      }];

      (Room.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockRooms)
        })
      });
      (Reservation.find as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/rooms/search')
        .query({
          check_in_date: '2026-05-01',
          check_out_date: '2026-05-05',
          num_guests: 2,
          max_price: 200
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rooms');
    });

    it('should filter rooms by hotel_name (partial match)', async () => {
      const mockRooms = [{
        ...createMockRoom(),
        _id: 'room123',
        hotel_id: createMockHotel({ name: 'Grand Hotel' })
      }];

      (Room.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockRooms)
        })
      });
      (Reservation.find as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/rooms/search')
        .query({
          check_in_date: '2026-05-01',
          check_out_date: '2026-05-05',
          num_guests: 2,
          hotel_name: 'Grand'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rooms');
    });
  });

  describe('POST /rooms', () => {
    it('should create room with valid data as admin', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      const mockHotel = createMockHotel();
      const newRoom = {
        ...createMockRoom(),
        id: 'room123',
        toJSON: () => createMockRoom()
      };

      (Hotel.findById as jest.Mock).mockResolvedValue(mockHotel);
      (Room.findOne as jest.Mock).mockResolvedValue(null);
      (Room.create as jest.Mock).mockResolvedValue(newRoom);

      const response = await request(app)
        .post('/rooms')
        .set('Cookie', ['jwtToken=admin-token'])
        .send({
          room_number: '101',
          room_type: 'deluxe',
          floor: 1,
          price_per_night: 150,
          status: 'available',
          max_guests: 2,
          hotel_id: 'hotel123'
        });

      expect(response.status).toBe(201);
      expect(Room.create).toHaveBeenCalled();
    });

    it('should return 404 when hotel not found', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Hotel.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/rooms')
        .set('Cookie', ['jwtToken=admin-token'])
        .send({
          room_number: '101',
          hotel_id: 'invalid-hotel'
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Hotel not found');
    });

    it('should return 403 for non-admin user', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });

      const response = await request(app)
        .post('/rooms')
        .set('Cookie', ['jwtToken=user-token'])
        .send({
          room_number: '101',
          hotel_id: 'hotel123'
        });

      expect(response.status).toBe(403);
    });

    it('should return 400 when duplicate key error (code 11000) occurs', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Hotel.findById as jest.Mock).mockResolvedValue(createMockHotel());
      (Room.findOne as jest.Mock).mockResolvedValue(null);
      const duplicateError = createDuplicateKeyError('E11000 duplicate key error');
      (Room.create as jest.Mock).mockRejectedValue(duplicateError);

      const response = await request(app)
        .post('/rooms')
        .set('Cookie', ['jwtToken=admin-token'])
        .send({
          room_number: '101',
          room_type: 'deluxe',
          floor: 1,
          price_per_night: 150,
          status: 'available',
          max_guests: 2,
          hotel_id: 'hotel123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Room number already exists for this hotel');
    });
  });

  describe('PUT /rooms/:id', () => {
    it('should update room successfully as admin', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      const updatedRoom = {
        ...createMockRoom({ price_per_night: 200 }),
        id: 'room123',
        toJSON: () => ({ ...createMockRoom(), price_per_night: 200 })
      };

      (Room.findById as jest.Mock).mockResolvedValue(createMockRoom());
      (Room.findOne as jest.Mock).mockResolvedValue(null);
      (Room.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedRoom);

      const response = await request(app)
        .put('/rooms/room123')
        .set('Cookie', ['jwtToken=admin-token'])
        .send({ price_per_night: 200 });

      expect(response.status).toBe(200);
    });

    it('should return 404 for invalid room ID', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Room.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/rooms/invalid-id')
        .set('Cookie', ['jwtToken=admin-token'])
        .send({ price_per_night: 200 });

      expect(response.status).toBe(404);
    });

    it('should return 400 when duplicate key error occurs on update', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Room.findById as jest.Mock).mockResolvedValue(createMockRoom());
      (Room.findOne as jest.Mock).mockResolvedValue(null);
      const duplicateError = createDuplicateKeyError('E11000 duplicate key error');
      (Room.findByIdAndUpdate as jest.Mock).mockRejectedValue(duplicateError);

      const response = await request(app)
        .put('/rooms/room123')
        .set('Cookie', ['jwtToken=admin-token'])
        .send({ room_number: '102' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Room number already exists for this hotel');
    });

    it('should return 400 when ValidationError occurs', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Room.findById as jest.Mock).mockResolvedValue(createMockRoom());
      (Room.findOne as jest.Mock).mockResolvedValue(null);
      const validationError = createValidationError('Invalid price value');
      (Room.findByIdAndUpdate as jest.Mock).mockRejectedValue(validationError);

      const response = await request(app)
        .put('/rooms/room123')
        .set('Cookie', ['jwtToken=admin-token'])
        .send({ price_per_night: -100 });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid price value');
    });
  });

  describe('DELETE /rooms/:id', () => {
    it('should delete room successfully as admin', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      const deletedRoom = {
        ...createMockRoom(),
        id: 'room123',
        toJSON: () => createMockRoom()
      };
      (Room.findByIdAndDelete as jest.Mock).mockResolvedValue(deletedRoom);

      const response = await request(app)
        .delete('/rooms/room123')
        .set('Cookie', ['jwtToken=admin-token']);

      expect(response.status).toBe(200);
    });

    it('should return 404 for invalid room ID', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Room.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete('/rooms/invalid-id')
        .set('Cookie', ['jwtToken=admin-token']);

      expect(response.status).toBe(404);
    });

    it('should return 400 when CastError occurs', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      const castError = createCastError('Invalid ObjectId');
      (Room.findByIdAndDelete as jest.Mock).mockRejectedValue(castError);

      const response = await request(app)
        .delete('/rooms/invalid-format-id')
        .set('Cookie', ['jwtToken=admin-token']);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid room ID');
    });
  });
});
