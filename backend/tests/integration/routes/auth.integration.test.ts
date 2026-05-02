/**
 * Integration tests for authentication routes.
 * Tests /auth/register, /auth/login, /auth/logout, and /auth/refresh endpoints.
 */
import request from 'supertest';
import app from '../../../src/app';
import User from '../../../src/models/User';
import { setupTestDB, clearTestDB, teardownTestDB } from '../setup/db';
import { createUser } from '../setup/fixtures';
import bcrypt from 'bcryptjs';

const VALID_TEST_PASSWORD = 'password123';

describe('Auth Routes Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('POST /auth/register', () => {
    it('should register user and save to database with hashed password', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@test.com',
          phone: '1234567890',
          password: VALID_TEST_PASSWORD,
          role: 'user',
        });

      expect(response.status).toBe(200);
      expect(response.text).toContain('User created successfully');

      const user = await User.findOne({ email: 'john@test.com' });
      expect(user).toBeTruthy();
      expect(user!.full_name).toBe('John Doe');
      expect(user!.password).not.toBe(VALID_TEST_PASSWORD);
      expect(user!.role).toBe('user');

      // Verify password is properly hashed
      const isPasswordHashed = await bcrypt.compare(VALID_TEST_PASSWORD, user!.password);
      expect(isPasswordHashed).toBe(true);
    });

    it('should return 400 when registering with duplicate email', async () => {
      // Create user first
      await createUser({ email: 'existing@test.com' });

      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Another User',
          email: 'existing@test.com',
          phone: '9876543210',
          password: 'password456',
          role: 'user',
        });

      expect(response.status).toBe(400);
      expect(response.text).toContain('User already exists');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          // Missing required fields
          email: 'incomplete@test.com',
        });

      // Mongoose will throw validation error, which should result in 400 or 422
      expect(response.status).toBe(400);
      expect(response.text).toBeTruthy();
    });
  });

  describe('POST /auth/login', () => {
    it('should login with correct credentials and return tokens in cookies', async () => {
      // Create user with known password (fixture hashes the default password)
      await createUser({
        email: 'login@test.com',
        role: 'user',
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@test.com',
          password: VALID_TEST_PASSWORD,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', 'login@test.com');
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('refreshToken');

      // Check cookies are set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies)).toBe(true);

      const cookiesArray = cookies as unknown as string[];
      expect(cookiesArray.length).toBeGreaterThan(0);

      const jwtCookie = cookiesArray.find((c: string) => c.startsWith('jwtToken='));
      const refreshCookie = cookiesArray.find((c: string) => c.startsWith('refreshToken='));

      expect(jwtCookie).toBeDefined();
      expect(refreshCookie).toBeDefined();

      // Verify refresh token was saved to database
      const user = await User.findOne({ email: 'login@test.com' });
      expect(user!.refreshToken).toBeTruthy();
      expect(user!.refreshToken).not.toBe('');
    });

    it('should return 404 when user does not exist', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: VALID_TEST_PASSWORD,
        });

      expect(response.status).toBe(404);
      expect(response.text).toContain('User not found');
    });

    it('should return 403 when password is incorrect', async () => {
      // Create user with default password (fixture hashes it)
      await createUser({
        email: 'test@test.com',
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@test.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(403);
      expect(response.text).toContain('Invalid password');
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear refresh token from database', async () => {
      // Create user with default password (fixture hashes it)
      const user = await createUser({
        email: 'logout@test.com',
      });

      // Login to get refresh token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'logout@test.com',
          password: VALID_TEST_PASSWORD,
        });

      const cookies = loginResponse.headers['set-cookie'] as unknown as string[];

      // Verify refresh token is in database
      const userBeforeLogout = await User.findById(user._id);
      expect(userBeforeLogout!.refreshToken).toBeTruthy();

      // Logout with cookies
      const logoutResponse = await request(app)
        .post('/auth/logout')
        .set('Cookie', cookies);

      expect(logoutResponse.status).toBe(200);

      // Verify refresh token is cleared from database
      const userAfterLogout = await User.findById(user._id);
      expect(userAfterLogout!.refreshToken).toBe('');

      // Verify cookies are cleared
      const logoutCookies = logoutResponse.headers['set-cookie'] as unknown as string[];
      expect(logoutCookies).toBeDefined();
    });

    it('should return 200 even without refresh token', async () => {
      const response = await request(app)
        .post('/auth/logout');

      expect(response.status).toBe(200);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // Create user with default password (fixture hashes it)
      await createUser({
        email: 'refresh@test.com',
      });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'refresh@test.com',
          password: VALID_TEST_PASSWORD,
        });

      const cookies = loginResponse.headers['set-cookie'] as unknown as string[];

      // Extract refresh token cookie
      const refreshTokenCookie = cookies.find((c: string) => c.startsWith('refreshToken='));
      expect(refreshTokenCookie).toBeDefined();

      // Call refresh endpoint
      const refreshResponse = await request(app)
        .post('/auth/refresh')
        .set('Cookie', [refreshTokenCookie!]);

      expect(refreshResponse.status).toBe(200);

      // Verify new JWT cookie is set
      const newCookies = refreshResponse.headers['set-cookie'] as unknown as string[];
      expect(newCookies).toBeDefined();

      const newJwtCookie = newCookies.find((c: string) => c.startsWith('jwtToken='));
      expect(newJwtCookie).toBeDefined();
    });

    it('should return 401 when refresh token is missing', async () => {
      const response = await request(app)
        .post('/auth/refresh');

      expect(response.status).toBe(401);
      expect(response.text).toContain('No refresh token sent');
    });

    it('should return 404 when user not found', async () => {
      // Create a user, get a refresh token, then delete the user (fixture hashes default password)
      const user = await createUser({
        email: 'deleteme@test.com',
      });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'deleteme@test.com',
          password: VALID_TEST_PASSWORD,
        });

      const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
      const refreshTokenCookie = cookies.find((c: string) => c.startsWith('refreshToken='));

      // Delete the user
      await User.findByIdAndDelete(user._id);

      // Try to refresh with deleted user's token
      const refreshResponse = await request(app)
        .post('/auth/refresh')
        .set('Cookie', [refreshTokenCookie!]);

      expect(refreshResponse.status).toBe(404);
      expect(refreshResponse.text).toContain('User not found');
    });
  });
});
