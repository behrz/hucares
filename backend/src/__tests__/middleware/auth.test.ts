import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { testUtils, testDb } from '../setup';
import { authenticateToken, optionalAuth } from '../../middleware/auth';

describe('Auth Middleware', () => {
  const validToken = testUtils.generateTestToken({
    userId: 'test-user-id',
    username: 'testuser',
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Set test JWT secret
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  });

  describe('authenticateToken', () => {
    test('should authenticate valid token successfully', async () => {
      // Create test user
      const user = await testUtils.createTestUser({
        username: 'testuser',
      });

      const token = testUtils.generateTestToken({
        userId: user?.id || 'test-id',
        username: 'testuser',
      });

      const req = testUtils.mockRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      await authenticateToken(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user?.username).toBe('testuser');
      expect(next).toHaveBeenCalledWith();
    });

    test('should reject missing authorization header', async () => {
      const req = testUtils.mockRequest({
        headers: {},
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access token is required',
        })
      );
    });

    test('should reject malformed authorization header', async () => {
      const req = testUtils.mockRequest({
        headers: {
          authorization: 'InvalidFormat token',
        },
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access token is required',
        })
      );
    });

    test('should reject invalid token', async () => {
      const req = testUtils.mockRequest({
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid token',
        })
      );
    });

    test('should reject expired token', async () => {
      // Create expired token
      const expiredToken = jwt.sign(
        { userId: 'test-id', username: 'testuser' },
        'test-jwt-secret-key-for-testing-only',
        {
          expiresIn: '-1h', // Expired 1 hour ago
          issuer: 'hucares-api',
          audience: 'hucares-app',
        }
      );

      const req = testUtils.mockRequest({
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token has expired',
        })
      );
    });

    test('should reject token for non-existent user', async () => {
      const token = testUtils.generateTestToken({
        userId: 'non-existent-user-id',
        username: 'nonexistent',
      });

      const req = testUtils.mockRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found or inactive',
        })
      );
    });

    test('should reject token for inactive user', async () => {
      // Create inactive user
      const user = await testUtils.createTestUser({
        username: 'inactiveuser',
      });

      // Deactivate user
      await testDb?.user.update({
        where: { id: user?.id },
        data: { isActive: false },
      });

      const token = testUtils.generateTestToken({
        userId: user?.id || 'test-id',
        username: 'inactiveuser',
      });

      const req = testUtils.mockRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found or inactive',
        })
      );
    });

    test('should handle token with wrong issuer', async () => {
      // Create token with wrong issuer
      const wrongIssuerToken = jwt.sign(
        { userId: 'test-id', username: 'testuser' },
        'test-jwt-secret-key-for-testing-only',
        {
          expiresIn: '1h',
          issuer: 'wrong-issuer',
          audience: 'hucares-app',
        }
      );

      const req = testUtils.mockRequest({
        headers: {
          authorization: `Bearer ${wrongIssuerToken}`,
        },
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid token',
        })
      );
    });

    test('should handle token with wrong audience', async () => {
      // Create token with wrong audience
      const wrongAudienceToken = jwt.sign(
        { userId: 'test-id', username: 'testuser' },
        'test-jwt-secret-key-for-testing-only',
        {
          expiresIn: '1h',
          issuer: 'hucares-api',
          audience: 'wrong-audience',
        }
      );

      const req = testUtils.mockRequest({
        headers: {
          authorization: `Bearer ${wrongAudienceToken}`,
        },
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid token',
        })
      );
    });
  });

  describe('optionalAuth', () => {
    test('should authenticate valid token when provided', async () => {
      // Create test user
      const user = await testUtils.createTestUser({
        username: 'optionaluser',
      });

      const token = testUtils.generateTestToken({
        userId: user?.id || 'test-id',
        username: 'optionaluser',
      });

      const req = testUtils.mockRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      await optionalAuth(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user?.username).toBe('optionaluser');
      expect(next).toHaveBeenCalledWith();
    });

    test('should continue without authentication when no token provided', async () => {
      const req = testUtils.mockRequest({
        headers: {},
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });

    test('should continue without authentication when invalid token provided', async () => {
      const req = testUtils.mockRequest({
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });

    test('should continue without authentication when token is expired', async () => {
      // Create expired token
      const expiredToken = jwt.sign(
        { userId: 'test-id', username: 'testuser' },
        'test-jwt-secret-key-for-testing-only',
        {
          expiresIn: '-1h', // Expired 1 hour ago
          issuer: 'hucares-api',
          audience: 'hucares-app',
        }
      );

      const req = testUtils.mockRequest({
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });

    test('should continue without authentication when user does not exist', async () => {
      const token = testUtils.generateTestToken({
        userId: 'non-existent-user-id',
        username: 'nonexistent',
      });

      const req = testUtils.mockRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });
  });
}); 