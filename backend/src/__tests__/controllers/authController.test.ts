import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { testUtils, testDb } from '../setup';
import {
  register,
  login,
  getProfile,
  changePassword,
  logout,
  deactivateAccount,
} from '../../controllers/authController';

describe('Auth Controller', () => {
  // Mock Express app for testing
  const mockApp = {
    use: jest.fn(),
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    test('should register a new user successfully', async () => {
      const req = testUtils.mockRequest({
        body: {
          username: 'newuser',
          password: 'NewUser123!',
          email: 'newuser@example.com',
        },
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      // Mock validation to pass
      jest.doMock('express-validator', () => ({
        validationResult: () => ({
          isEmpty: () => true,
          array: () => [],
        }),
      }));

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User registered successfully',
          user: expect.objectContaining({
            username: 'newuser',
            email: 'newuser@example.com',
          }),
          token: expect.any(String),
          expiresIn: expect.any(String),
        })
      );
    });

    test('should reject duplicate username', async () => {
      // Create existing user first
      await testUtils.createTestUser({ username: 'existinguser' });

      const req = testUtils.mockRequest({
        body: {
          username: 'existinguser',
          password: 'NewUser123!',
          email: 'different@example.com',
        },
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      // Mock validation to pass
      jest.doMock('express-validator', () => ({
        validationResult: () => ({
          isEmpty: () => true,
          array: () => [],
        }),
      }));

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Conflict',
          message: 'Username already exists',
        })
      );
    });

    test('should reject duplicate email', async () => {
      // Create existing user first
      await testUtils.createTestUser({ email: 'existing@example.com' });

      const req = testUtils.mockRequest({
        body: {
          username: 'newuser',
          password: 'NewUser123!',
          email: 'existing@example.com',
        },
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      // Mock validation to pass
      jest.doMock('express-validator', () => ({
        validationResult: () => ({
          isEmpty: () => true,
          array: () => [],
        }),
      }));

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Conflict',
          message: 'Email already registered',
        })
      );
    });

    test('should handle validation errors', async () => {
      const req = testUtils.mockRequest({
        body: {
          username: 'ab', // Too short
          password: '123', // Too weak
          email: 'invalid-email',
        },
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      // Mock validation to fail
      jest.doMock('express-validator', () => ({
        validationResult: () => ({
          isEmpty: () => false,
          array: () => [
            { msg: 'Username must be between 3 and 20 characters' },
            { msg: 'Password must be at least 8 characters long' },
            { msg: 'Must be a valid email address' },
          ],
        }),
      }));

      await register(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Username must be between 3 and 20 characters'),
        })
      );
    });
  });

  describe('POST /login', () => {
    test('should login user successfully', async () => {
      // Create test user
      const user = await testUtils.createTestUser({
        username: 'loginuser',
        password: 'LoginUser123!',
      });

      const req = testUtils.mockRequest({
        body: {
          username: 'loginuser',
          password: 'LoginUser123!',
        },
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      // Mock validation to pass
      jest.doMock('express-validator', () => ({
        validationResult: () => ({
          isEmpty: () => true,
          array: () => [],
        }),
      }));

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login successful',
          user: expect.objectContaining({
            username: 'loginuser',
          }),
          token: expect.any(String),
        })
      );
    });

    test('should reject invalid username', async () => {
      const req = testUtils.mockRequest({
        body: {
          username: 'nonexistent',
          password: 'SomePassword123!',
        },
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      // Mock validation to pass
      jest.doMock('express-validator', () => ({
        validationResult: () => ({
          isEmpty: () => true,
          array: () => [],
        }),
      }));

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unauthorized',
          message: 'Invalid username or password',
        })
      );
    });

    test('should reject invalid password', async () => {
      // Create test user
      await testUtils.createTestUser({
        username: 'loginuser',
        password: 'CorrectPassword123!',
      });

      const req = testUtils.mockRequest({
        body: {
          username: 'loginuser',
          password: 'WrongPassword123!',
        },
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      // Mock validation to pass
      jest.doMock('express-validator', () => ({
        validationResult: () => ({
          isEmpty: () => true,
          array: () => [],
        }),
      }));

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unauthorized',
          message: 'Invalid username or password',
        })
      );
    });

    test('should reject inactive user', async () => {
      // Create inactive test user
      const user = await testUtils.createTestUser({
        username: 'inactiveuser',
        password: 'InactiveUser123!',
      });

      // Deactivate user
      await testDb?.user.update({
        where: { id: user?.id },
        data: { isActive: false },
      });

      const req = testUtils.mockRequest({
        body: {
          username: 'inactiveuser',
          password: 'InactiveUser123!',
        },
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      // Mock validation to pass
      jest.doMock('express-validator', () => ({
        validationResult: () => ({
          isEmpty: () => true,
          array: () => [],
        }),
      }));

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unauthorized',
          message: 'Invalid username or password',
        })
      );
    });
  });

  describe('GET /me', () => {
    test('should return user profile successfully', async () => {
      // Create test user
      const user = await testUtils.createTestUser({
        username: 'profileuser',
      });

      const req = testUtils.mockRequest({
        user: {
          id: user?.id,
          username: user?.username,
          email: user?.email,
          isActive: true,
        },
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      await getProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            username: 'profileuser',
            groups: expect.any(Array),
          }),
        })
      );
    });

    test('should reject unauthenticated request', async () => {
      const req = testUtils.mockRequest({
        user: undefined,
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      await getProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unauthorized',
          message: 'Authentication required',
        })
      );
    });
  });

  describe('PUT /change-password', () => {
    test('should change password successfully', async () => {
      // Create test user
      const user = await testUtils.createTestUser({
        username: 'passworduser',
        password: 'OldPassword123!',
      });

      const req = testUtils.mockRequest({
        user: {
          id: user?.id,
          username: user?.username,
          email: user?.email,
          isActive: true,
        },
        body: {
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
        },
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      // Mock validation to pass
      jest.doMock('express-validator', () => ({
        validationResult: () => ({
          isEmpty: () => true,
          array: () => [],
        }),
      }));

      await changePassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Password changed successfully',
        })
      );

      // Verify password was actually changed
      const updatedUser = await testDb?.user.findUnique({
        where: { id: user?.id },
      });
      const isNewPasswordValid = await bcrypt.compare('NewPassword123!', updatedUser?.passwordHash || '');
      expect(isNewPasswordValid).toBe(true);
    });

    test('should reject incorrect current password', async () => {
      // Create test user
      const user = await testUtils.createTestUser({
        username: 'passworduser',
        password: 'OldPassword123!',
      });

      const req = testUtils.mockRequest({
        user: {
          id: user?.id,
          username: user?.username,
          email: user?.email,
          isActive: true,
        },
        body: {
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!',
        },
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      // Mock validation to pass
      jest.doMock('express-validator', () => ({
        validationResult: () => ({
          isEmpty: () => true,
          array: () => [],
        }),
      }));

      await changePassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unauthorized',
          message: 'Current password is incorrect',
        })
      );
    });
  });

  describe('POST /logout', () => {
    test('should logout successfully', async () => {
      const req = testUtils.mockRequest({
        user: {
          id: 'user-id',
          username: 'testuser',
          email: 'test@example.com',
          isActive: true,
        },
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      await logout(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Logout successful',
        })
      );
    });
  });

  describe('DELETE /account', () => {
    test('should deactivate account successfully', async () => {
      // Create test user
      const user = await testUtils.createTestUser({
        username: 'deactivateuser',
      });

      const req = testUtils.mockRequest({
        user: {
          id: user?.id,
          username: user?.username,
          email: user?.email,
          isActive: true,
        },
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      await deactivateAccount(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Account deactivated successfully',
        })
      );

      // Verify user was actually deactivated
      const deactivatedUser = await testDb?.user.findUnique({
        where: { id: user?.id },
      });
      expect(deactivatedUser?.isActive).toBe(false);
    });

    test('should reject unauthenticated request', async () => {
      const req = testUtils.mockRequest({
        user: undefined,
      });
      const res = testUtils.mockResponse();
      const next = testUtils.mockNext();

      await deactivateAccount(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unauthorized',
          message: 'Authentication required',
        })
      );
    });
  });
}); 