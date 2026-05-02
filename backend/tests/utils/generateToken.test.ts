import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken, UserPayload } from '../../src/utils/generateToken';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

describe('Token Generation Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should generate access token with userId and role', () => {
      const mockToken = 'mock-access-token-123';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const token = generateAccessToken('user123', 'customer');

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user123', role: 'customer' },
        'test-access-secret',
        { expiresIn: '10m' }
      );
      expect(token).toBe(mockToken);
    });

    it('should generate different tokens for different users', () => {
      const mockToken1 = 'token-user1';
      const mockToken2 = 'token-user2';
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce(mockToken1)
        .mockReturnValueOnce(mockToken2);

      const token1 = generateAccessToken('user1', 'customer');
      const token2 = generateAccessToken('user2', 'admin');

      expect(token1).not.toBe(token2);
      expect(jwt.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token with userId only', () => {
      const mockToken = 'mock-refresh-token-456';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const token = generateRefreshToken('user123');

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user123' },
        'test-refresh-secret',
        { expiresIn: '7d' }
      );
      expect(token).toBe(mockToken);
    });

    it('should generate refresh token without role claim', () => {
      (jwt.sign as jest.Mock).mockReturnValue('refresh-token');

      generateRefreshToken('user456');

      const signCallArgs = (jwt.sign as jest.Mock).mock.calls[0][0];
      expect(signCallArgs).not.toHaveProperty('role');
      expect(signCallArgs).toHaveProperty('userId');
    });
  });
});
