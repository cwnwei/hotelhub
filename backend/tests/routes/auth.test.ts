import request from 'supertest';
import app from '../../src/app';
import User from '../../src/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken } from '../../src/utils/generateToken';
import { createMockUser } from '../setup/testUtils';

// Mock dependencies
jest.mock('../../src/models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../src/utils/generateToken');
jest.mock('../../src/config/database', () => ({
  connectDB: jest.fn(),
}));

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue(createMockUser());
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');

      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890',
          password: 'password123',
          role: 'customer',
        });

      expect(response.status).toBe(200);
      expect(response.text).toContain('User created successfully');
      expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(User.create).toHaveBeenCalledWith({
        full_name: 'John Doe',
        phone: '1234567890',
        email: 'john@example.com',
        password: 'hashedPassword123',
        role: 'customer',
      });
    });

    it('should return 400 when user already exists', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(createMockUser());

      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890',
          password: 'password123',
          role: 'customer',
        });

      expect(response.status).toBe(400);
      expect(response.text).toContain('User already exists');
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = createMockUser();
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (generateAccessToken as jest.Mock).mockReturnValue('access-token-123');
      (generateRefreshToken as jest.Mock).mockReturnValue('refresh-token-456');

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'john@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', 'john@example.com');
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('refreshToken');
      expect(response.headers['set-cookie']).toBeDefined();
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword123');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should return 404 when user does not exist', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(404);
      expect(response.text).toContain('User not found');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return 403 for incorrect password', async () => {
      const mockUser = createMockUser();
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'john@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(403);
      expect(response.text).toContain('Invalid password');
      expect(generateAccessToken).not.toHaveBeenCalled();
    });

    it('should set both jwtToken and refreshToken cookies', async () => {
      const mockUser = createMockUser();
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'john@example.com',
          password: 'password123',
        });

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.includes('jwtToken'))).toBe(true);
      expect(cookies.some((cookie: string) => cookie.includes('refreshToken'))).toBe(true);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout and clear cookies', async () => {
      const mockUser = createMockUser({ refreshToken: 'refresh-token-123' });
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/logout')
        .set('Cookie', ['refreshToken=refresh-token-123']);

      expect(response.status).toBe(200);
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockUser.refreshToken).toBe('');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 200 even without refresh token', async () => {
      const response = await request(app)
        .post('/auth/logout');

      expect(response.status).toBe(200);
      expect(User.findOne).not.toHaveBeenCalled();
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const mockUser = createMockUser({ refreshToken: 'valid-refresh-token', id: 'user123' });
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123' });
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (generateAccessToken as jest.Mock).mockReturnValue('new-access-token');

      const response = await request(app)
        .post('/auth/refresh')
        .set('Cookie', ['refreshToken=valid-refresh-token']);

      expect(response.status).toBe(200);
      expect(jwt.verify).toHaveBeenCalledWith('valid-refresh-token', 'test-refresh-secret');
      expect(generateAccessToken).toHaveBeenCalledWith('user123', 'customer');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 when refresh token is missing', async () => {
      const response = await request(app)
        .post('/auth/refresh');

      expect(response.status).toBe(401);
      expect(response.text).toContain('No refresh token sent');
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    it('should return 404 when user not found', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123' });
      (User.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/refresh')
        .set('Cookie', ['refreshToken=valid-token']);

      expect(response.status).toBe(404);
      expect(response.text).toContain('User not found');
    });

    it('should return 401 for invalid refresh token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post('/auth/refresh')
        .set('Cookie', ['refreshToken=invalid-token']);

      expect(response.status).toBe(401);
      expect(response.text).toContain('Invalid refresh token');
    });

    it('should return 401 when user has no refresh token stored', async () => {
      const mockUser = createMockUser({ refreshToken: '' });
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123' });
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/refresh')
        .set('Cookie', ['refreshToken=some-token']);

      expect(response.status).toBe(401);
      expect(response.text).toContain('No refresh token, please login again');
    });
  });
});
