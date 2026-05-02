import request from 'supertest';
import app from '../../../src/app';
import { createUser } from './fixtures';
import { generateAccessToken, generateRefreshToken } from '../../../src/utils/generateToken';

/**
 * Performs a real login via supertest against the /auth/login endpoint.
 * @param email - User email
 * @param password - User password
 * @returns Object containing cookies and user data from the response
 */
export const loginUser = async (email: string, password: string) => {
  const response = await request(app)
    .post('/auth/login')
    .send({ email, password });
  return {
    cookies: response.headers['set-cookie'],
    user: response.body,
  };
};

/**
 * Creates a user with generated access and refresh tokens.
 * @param role - User role ('user' or 'admin'), defaults to 'user'
 * @returns Object containing user document, tokens, and formatted cookies
 */
export const createAuthenticatedUser = async (role = 'user'): Promise<any> => {
  const user = await createUser({ role });
  const token = generateAccessToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString());
  return {
    user,
    token,
    refreshToken,
    cookies: [`jwtToken=${token}`, `refreshToken=${refreshToken}`],
  };
};

/**
 * Convenience function to create an authenticated admin user.
 * @returns Object containing admin user document, tokens, and formatted cookies
 */
export const createAdmin = async (): Promise<any> => {
  return await createAuthenticatedUser('admin');
};

/**
 * Extracts cookies from a supertest response object.
 * @param response - Supertest response object
 * @returns Array of cookie strings, or empty array if no cookies present
 */
export const extractCookies = (response: any) => {
  const cookies = response.headers['set-cookie'] as string[];
  return cookies || [];
};
