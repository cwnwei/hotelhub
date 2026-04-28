import request from 'supertest';
import app from '../../src/app';
import User from '../../src/models/User';
import jwt from 'jsonwebtoken';
import { createMockUser, createValidationError, createCastError } from '../setup/testUtils';

// Mock dependencies
jest.mock('../../src/models/User');
jest.mock('jsonwebtoken');
jest.mock('../../src/config/database', () => ({
  connectDB: jest.fn(),
}));

describe('User Routes (Admin Only)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /guests', () => {
    it('should return all guests for admin', async () => {
      const mockUsers = [
        { ...createMockUser(), toObject: () => createMockUser(), _id: 'guest123' },
        { ...createMockUser({ _id: 'guest456', full_name: 'Bob Johnson' }), toObject: () => ({ ...createMockUser(), _id: 'guest456', full_name: 'Bob Johnson' }), _id: 'guest456' }
      ];

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (User.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockUsers)
      });

      const response = await request(app)
        .get('/guests')
        .set('Cookie', ['jwtToken=admin-token']);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 403 for non-admin user', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'user' });

      const response = await request(app)
        .get('/guests')
        .set('Cookie', ['jwtToken=user-token']);

      expect(response.status).toBe(403);
    });

    it('should return 500 when database error occurs', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (User.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Database connection error'))
      });

      const response = await request(app)
        .get('/guests')
        .set('Cookie', ['jwtToken=admin-token']);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error');
    });
  });

  describe('PUT /guests/:id', () => {
    it('should update guest as admin', async () => {
      const updatedUser = {
        ...createMockUser({ phone: '9999999999' }),
        id: 'guest123',
        toObject: () => ({ ...createMockUser(), phone: '9999999999' })
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/guests/guest123')
        .set('Cookie', ['jwtToken=admin-token'])
        .send({ phone: '9999999999' });

      expect(response.status).toBe(200);
    });

    it('should return 404 for invalid guest ID', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/guests/invalid-id')
        .set('Cookie', ['jwtToken=admin-token'])
        .send({ phone: '9999999999' });

      expect(response.status).toBe(404);
    });

    it('should return 400 when ValidationError occurs', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      const validationError = createValidationError('Email is required');
      (User.findByIdAndUpdate as jest.Mock).mockRejectedValue(validationError);

      const response = await request(app)
        .put('/guests/guest123')
        .set('Cookie', ['jwtToken=admin-token'])
        .send({ email: '' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Email is required');
    });

    it('should return 500 when generic error occurs', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      const genericError = new Error('Database connection lost');
      (User.findByIdAndUpdate as jest.Mock).mockRejectedValue(genericError);

      const response = await request(app)
        .put('/guests/guest123')
        .set('Cookie', ['jwtToken=admin-token'])
        .send({ phone: '9999999999' });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error');
    });
  });

  describe('DELETE /guests/:id', () => {
    it('should delete guest as admin', async () => {
      const deletedUser = {
        ...createMockUser(),
        id: 'guest123',
        toObject: () => createMockUser()
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (User.findByIdAndDelete as jest.Mock).mockResolvedValue(deletedUser);

      const response = await request(app)
        .delete('/guests/guest123')
        .set('Cookie', ['jwtToken=admin-token']);

      expect(response.status).toBe(200);
    });

    it('should return 404 for invalid guest ID', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      (User.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete('/guests/invalid-id')
        .set('Cookie', ['jwtToken=admin-token']);

      expect(response.status).toBe(404);
    });

    it('should return 400 when CastError occurs', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      const castError = createCastError('Invalid ObjectId');
      (User.findByIdAndDelete as jest.Mock).mockRejectedValue(castError);

      const response = await request(app)
        .delete('/guests/invalid-format-id')
        .set('Cookie', ['jwtToken=admin-token']);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid guest ID');
    });

    it('should return 500 when generic error occurs', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'admin123', role: 'admin' });
      const genericError = new Error('Database connection lost');
      (User.findByIdAndDelete as jest.Mock).mockRejectedValue(genericError);

      const response = await request(app)
        .delete('/guests/guest123')
        .set('Cookie', ['jwtToken=admin-token']);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error');
    });
  });
});
