import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { logger } from '@/utils/logger';
import { asyncHandler } from '@/middleware/errorHandler';
import { ValidationError } from '@/middleware/errorHandler';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { db } from '@/services/database';

// JWT Token generation
const generateToken = (user: { id: string; username: string }): string => {
  const payload = { userId: user.id, username: user.username };
  const options = {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: 'hucares-api',
    audience: 'hucares-app',
  };
  return jwt.sign(payload, env.JWT_SECRET, options as any);
};

// Validation rules
export const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, hyphens, and underscores')
    .custom((value) => {
      const reserved = ['admin', 'root', 'api', 'www', 'mail', 'support', 'help', 'info'];
      if (reserved.includes(value.toLowerCase())) {
        throw new Error('This username is reserved');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
];

export const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .trim(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

// Helper to check validation results
const checkValidation = (req: Request): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg).join(', ');
    throw new ValidationError(errorMessages);
  }
};

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  checkValidation(req);

  const { username, password, email } = req.body;

  logger.info(`📝 Registration attempt for username: ${username}`);

  // Check if username already exists
  const existingUser = await db.user.findUnique({
    where: { username: username.toLowerCase() },
  });

  if (existingUser) {
    res.status(409).json({
      error: 'Conflict',
      message: 'Username already exists',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Check if email already exists (if provided)
  if (email) {
    const existingEmail = await db.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (existingEmail) {
      res.status(409).json({
        error: 'Conflict',
        message: 'Email already registered',
        timestamp: new Date().toISOString(),
      });
      return;
    }
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

  // Create user
  const user = await db.user.create({
    data: {
      username: username.toLowerCase(),
      passwordHash: hashedPassword,
      email: email ? email.toLowerCase() : null,
      lastLoginAt: new Date(),
    },
  });

  // Generate token
  const token = generateToken(user);

  logger.info(`✅ User registered successfully: ${user.username}`);

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    },
    token,
    expiresIn: env.JWT_EXPIRES_IN,
  });
});

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  checkValidation(req);

  const { username, password } = req.body;

  logger.info(`🔐 Login attempt for username: ${username}`);

  // Find user by username
  const user = await db.user.findUnique({
    where: { 
      username: username.toLowerCase(),
      isActive: true,
    },
  });

  if (!user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid username or password',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Compare password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    logger.warn(`❌ Failed login attempt for user: ${username}`);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid username or password',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Update last login time
  const updatedUser = await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Generate token
  const token = generateToken(updatedUser);

  logger.info(`✅ User logged in successfully: ${user.username}`);

  res.status(200).json({
    message: 'Login successful',
    user: {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      createdAt: updatedUser.createdAt,
      lastLoginAt: updatedUser.lastLoginAt,
    },
    token,
    expiresIn: env.JWT_EXPIRES_IN,
  });
});

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
export const getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Get full user data
  const user = await db.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
      lastLoginAt: true,
      groupMemberships: {
        where: { isActive: true },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              description: true,
              accessCode: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    res.status(404).json({
      error: 'NotFound',
      message: 'User not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.status(200).json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      groups: user.groupMemberships.map((membership: any) => membership.group),
    },
  });
});

/**
 * @route PUT /api/auth/change-password
 * @desc Change user password
 * @access Private
 */
export const changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  checkValidation(req);

  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const { currentPassword, newPassword } = req.body;

  logger.info(`🔑 Password change attempt for user: ${req.user.username}`);

  // Find user with password hash
  const user = await db.user.findUnique({
    where: { id: req.user.id, isActive: true },
  });

  if (!user) {
    res.status(404).json({
      error: 'NotFound',
      message: 'User not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isCurrentPasswordValid) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Current password is incorrect',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);

  // Update password
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: hashedNewPassword },
  });

  logger.info(`✅ Password changed successfully for user: ${user.username}`);

  res.status(200).json({
    message: 'Password changed successfully',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user (client-side token invalidation)
 * @access Private
 */
export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // With JWT, logout is typically handled client-side by removing the token
  // In a more advanced implementation, you might maintain a blacklist of tokens
  
  logger.info(`👋 User logged out: ${req.user?.username || 'unknown'}`);

  res.status(200).json({
    message: 'Logout successful',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route DELETE /api/users/account
 * @desc Deactivate user account
 * @access Private
 */
export const deactivateAccount = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  logger.info(`🗑️ Account deactivation for user: ${req.user.username}`);

  // Deactivate user account
  await db.user.update({
    where: { id: req.user.id },
    data: { isActive: false },
  });

  logger.info(`✅ Account deactivated successfully for user: ${req.user.username}`);

  res.status(200).json({
    message: 'Account deactivated successfully',
    timestamp: new Date().toISOString(),
  });
});

export default {
  register,
  login,
  getProfile,
  changePassword,
  logout,
  deactivateAccount,
}; 