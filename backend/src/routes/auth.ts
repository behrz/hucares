import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '@/config/env';
import { authenticateToken } from '@/middleware/auth';
import {
  register,
  login,
  getProfile,
  changePassword,
  logout,
  deactivateAccount,
  registerValidation,
  loginValidation,
  changePasswordValidation,
} from '@/controllers/authController';

const router = Router();

// Rate limiting configurations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    error: 'TooManyRequests',
    message: 'Too many authentication attempts, please try again later.',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Even stricter for sensitive operations
  message: {
    error: 'TooManyRequests',
    message: 'Too many attempts, please try again later.',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes (no authentication required)

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 * @rateLimit 5 requests per 15 minutes
 */
router.post('/register', authLimiter, registerValidation, register);

/**
 * @route POST /api/auth/login
 * @desc Login user and get JWT token
 * @access Public
 * @rateLimit 5 requests per 15 minutes
 */
router.post('/login', authLimiter, loginValidation, login);

// Protected routes (authentication required)

/**
 * @route GET /api/auth/me
 * @desc Get current user profile with groups
 * @access Private
 */
router.get('/me', authenticateToken, getProfile);

/**
 * @route PUT /api/auth/change-password
 * @desc Change user password
 * @access Private
 * @rateLimit 3 requests per 15 minutes
 */
router.put('/change-password', strictAuthLimiter, authenticateToken, changePasswordValidation, changePassword);

/**
 * @route POST /api/auth/logout
 * @desc Logout user (client-side token invalidation)
 * @access Private
 */
router.post('/logout', authenticateToken, logout);

/**
 * @route DELETE /api/auth/account
 * @desc Deactivate user account
 * @access Private
 * @rateLimit 3 requests per 15 minutes
 */
router.delete('/account', strictAuthLimiter, authenticateToken, deactivateAccount);

// Additional utility routes

/**
 * @route GET /api/auth/verify
 * @desc Verify JWT token validity
 * @access Private
 */
router.get('/verify', authenticateToken, (req, res) => {
  res.status(200).json({
    valid: true,
    user: {
      id: req.user?.id,
      username: req.user?.username,
      email: req.user?.email,
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route GET /api/auth/health
 * @desc Authentication service health check
 * @access Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    service: 'Authentication Service',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: {
      registration: 'enabled',
      login: 'enabled',
      passwordChange: 'enabled',
      accountDeactivation: 'enabled',
      rateLimiting: 'enabled',
    },
  });
});

export default router; 