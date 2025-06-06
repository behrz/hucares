import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '@/middleware/auth';
import {
  submitCheckin,
  getUserCheckins,
  getGroupCheckins,
  getCurrentWeekCheckins,
  submitCheckinValidation,
  getCheckinValidation,
} from '@/controllers/checkinController';

const router = Router();

// Rate limiting for check-in operations
const checkinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Allow reasonable requests for check-in operations
  message: {
    error: 'TooManyRequests',
    message: 'Too many check-in requests, please try again later.',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// All check-in routes require authentication
router.use(authenticateToken);

/**
 * @route POST /api/checkins
 * @desc Submit weekly check-in
 * @access Private
 */
router.post('/', submitCheckinValidation, submitCheckin);

/**
 * @route GET /api/checkins
 * @desc Get user's check-in history
 * @access Private
 */
router.get('/', getCheckinValidation, getUserCheckins);

/**
 * @route GET /api/checkins/current
 * @desc Get current week's check-ins for user's groups
 * @access Private
 */
router.get('/current', getCurrentWeekCheckins);

/**
 * @route GET /api/checkins/group/:id
 * @desc Get specific group's check-ins
 * @access Private
 */
router.get('/group/:id', getGroupCheckins);

export default router; 