import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authorizeRoles } from '../../src/middleware/rbac';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

describe('RBAC Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      cookies: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      sendStatus: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('authorizeRoles', () => {
    it('should call next() when user has required role', () => {
      mockRequest.cookies = { jwtToken: 'valid-token' };
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'admin' });

      const middleware = authorizeRoles('admin');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-access-secret');
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should call next() when user has one of multiple allowed roles', () => {
      mockRequest.cookies = { jwtToken: 'valid-token' };
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'customer' });

      const middleware = authorizeRoles('admin', 'customer');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockResponse.sendStatus).not.toHaveBeenCalled();
    });

    it('should return 403 when user lacks required role', () => {
      mockRequest.cookies = { jwtToken: 'valid-token' };
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'customer' });

      const middleware = authorizeRoles('admin');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Insufficient permissions' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when JWT token is missing', () => {
      mockRequest.cookies = {};

      const middleware = authorizeRoles('admin');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Missing JWT Token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid JWT token', () => {
      mockRequest.cookies = { jwtToken: 'invalid-token' };
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const middleware = authorizeRoles('admin');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid JWT token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle array of roles correctly', () => {
      mockRequest.cookies = { jwtToken: 'valid-token' };
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123', role: 'manager' });

      const middleware = authorizeRoles('admin', 'manager', 'staff');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
