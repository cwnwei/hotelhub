import request from 'supertest';
import app from '../../src/app';
import Hotel from '../../src/models/Hotel';
import jwt from 'jsonwebtoken';
import { createMockHotel, createValidationError, createCastError } from '../setup/testUtils';

// Mock dependencies
jest.mock('../../src/models/Hotel');
jest.mock('jsonwebtoken');
jest.mock('../../src/config/database', () => ({
  connectDB: jest.fn(),
}));

describe('Hotel Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /hotels', () => {
    it('should return all hotels for authenticated user', async () => {
      const mockHotels = [
        { ...createMockHotel(), toObject: () => createMockHotel(), _id: 'hotel123' },
        { ...createMockHotel({ _id: 'hotel456', name: 'Beach Resort' }), toObject: () => ({ ...createMockHotel(), _id: 'hotel456', name: 'Beach Resort' }), _id: 'hotel456' }
      ];

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });
      (Hotel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockHotels)
      });

      const response = await request(app)
        .get('/hotels')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 without JWT token', async () => {
      const response = await request(app).get('/hotels');

      expect(response.status).toBe(401);
    });

    it('should return 500 when database error occurs', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });
      (Hotel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Database connection error'))
      });

      const response = await request(app)
        .get('/hotels')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error');
    });
  });

  describe('GET /hotels/:id', () => {
    it('should return hotel by ID', async () => {
      const hotelData = createMockHotel();
      const mockHotel = {
        ...hotelData,
        toJSON: () => hotelData,
        id: 'hotel123'
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });
      (Hotel.findById as jest.Mock).mockResolvedValue(mockHotel);

      const response = await request(app)
        .get('/hotels/hotel123')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'hotel123');
    });

    it('should return 404 for invalid hotel ID', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });
      (Hotel.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/hotels/invalid-id')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(404);
    });

    it('should return 400 when CastError occurs', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });
      const castError = createCastError('Invalid ObjectId');
      (Hotel.findById as jest.Mock).mockRejectedValue(castError);

      const response = await request(app)
        .get('/hotels/invalid-format-id')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid hotel ID');
    });

    it('should return 500 when generic error occurs', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });
      const genericError = new Error('Database connection lost');
      (Hotel.findById as jest.Mock).mockRejectedValue(genericError);

      const response = await request(app)
        .get('/hotels/hotel123')
        .set('Cookie', ['jwtToken=valid-token']);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error');
    });
  });

  describe('POST /hotels (admin only)', () => {
    it('should create hotel as admin', async () => {
      const hotelData = createMockHotel();
      const newHotel = {
        ...hotelData,
        id: 'hotel123',
        toJSON: () => hotelData
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Hotel.findOne as jest.Mock).mockResolvedValue(null); // No existing hotel
      (Hotel.create as jest.Mock).mockResolvedValue(newHotel);

      const response = await request(app)
        .post('/hotels')
        .set('Cookie', ['jwtToken=admin-token'])
        .send({
          name: 'Grand Hotel',
          address: '123 Main St',
          city: 'New York',
          country: 'USA'
        });

      expect(response.status).toBe(201);
    });

    it('should return 403 for non-admin user', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });

      const response = await request(app)
        .post('/hotels')
        .set('Cookie', ['jwtToken=user-token'])
        .send({
          name: 'Grand Hotel',
          address: '123 Main St'
        });

      expect(response.status).toBe(403);
    });

    it('should return 400 when ValidationError occurs', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Hotel.findOne as jest.Mock).mockResolvedValue(null);
      const validationError = createValidationError('Name is required');
      (Hotel.create as jest.Mock).mockRejectedValue(validationError);

      const response = await request(app)
        .post('/hotels')
        .set('Cookie', ['jwtToken=admin-token'])
        .send({
          address: '123 Main St'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Name is required');
    });

    it('should return 400 when hotel with same name and address exists', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Hotel.findOne as jest.Mock).mockResolvedValue(createMockHotel());

      const response = await request(app)
        .post('/hotels')
        .set('Cookie', ['jwtToken=admin-token'])
        .send({
          name: 'Grand Hotel',
          address: '123 Main St',
          city: 'New York',
          country: 'USA'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Hotel with this name and address already exists');
    });

    it('should return 500 when generic error occurs', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Hotel.findOne as jest.Mock).mockResolvedValue(null);
      const genericError = new Error('Database connection lost');
      (Hotel.create as jest.Mock).mockRejectedValue(genericError);

      const response = await request(app)
        .post('/hotels')
        .set('Cookie', ['jwtToken=admin-token'])
        .send({
          name: 'Grand Hotel',
          address: '123 Main St',
          city: 'New York',
          country: 'USA'
        });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error');
    });
  });

  describe('PUT /hotels/:id (admin only)', () => {
    it('should update hotel as admin', async () => {
      const hotelData = { ...createMockHotel(), star_rating: 5.0 };
      const updatedHotel = {
        ...hotelData,
        id: 'hotel123',
        toJSON: () => hotelData
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Hotel.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedHotel);

      const response = await request(app)
        .put('/hotels/hotel123')
        .set('Cookie', ['jwtToken=admin-token'])
        .send({ star_rating: 5.0 });

      expect(response.status).toBe(200);
    });

    it('should return 404 for invalid hotel ID', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Hotel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/hotels/invalid-id')
        .set('Cookie', ['jwtToken=admin-token'])
        .send({ star_rating: 5.0 });

      expect(response.status).toBe(404);
    });

    it('should return 400 when ValidationError occurs', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      const validationError = createValidationError('Invalid star rating');
      (Hotel.findByIdAndUpdate as jest.Mock).mockRejectedValue(validationError);

      const response = await request(app)
        .put('/hotels/hotel123')
        .set('Cookie', ['jwtToken=admin-token'])
        .send({ star_rating: 10 });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid star rating');
    });

    it('should return 500 when generic error occurs', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      const genericError = new Error('Database connection lost');
      (Hotel.findByIdAndUpdate as jest.Mock).mockRejectedValue(genericError);

      const response = await request(app)
        .put('/hotels/hotel123')
        .set('Cookie', ['jwtToken=admin-token'])
        .send({ star_rating: 5 });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error');
    });
  });

  describe('DELETE /hotels/:id (admin only)', () => {
    it('should delete hotel as admin', async () => {
      const hotelData = createMockHotel();
      const deletedHotel = {
        ...hotelData,
        id: 'hotel123',
        toJSON: () => hotelData
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Hotel.findByIdAndDelete as jest.Mock).mockResolvedValue(deletedHotel);

      const response = await request(app)
        .delete('/hotels/hotel123')
        .set('Cookie', ['jwtToken=admin-token']);

      expect(response.status).toBe(200);
    });

    it('should return 404 for invalid hotel ID', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Hotel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete('/hotels/invalid-id')
        .set('Cookie', ['jwtToken=admin-token']);

      expect(response.status).toBe(404);
    });

    it('should return 400 when CastError occurs', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      const castError = createCastError('Invalid ObjectId');
      (Hotel.findByIdAndDelete as jest.Mock).mockRejectedValue(castError);

      const response = await request(app)
        .delete('/hotels/invalid-format-id')
        .set('Cookie', ['jwtToken=admin-token']);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid hotel ID');
    });

    it('should return 500 when database error occurs', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (Hotel.findByIdAndDelete as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/hotels/hotel123')
        .set('Cookie', ['jwtToken=admin-token']);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error');
    });
  });
});
