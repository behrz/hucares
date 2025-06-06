import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '@/middleware/auth';
import {
  createGroup,
  joinGroup,
  createGroupValidation,
  joinGroupValidation,
} from '@/controllers/groupController';

const router = Router();

// Rate limiting for group operations
const groupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Allow more requests for group operations
  message: {
    error: 'TooManyRequests',
    message: 'Too many group requests, please try again later.',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictGroupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit group creation/joining
  message: {
    error: 'TooManyRequests',
    message: 'Too many group creation/join attempts, please try again later.',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// All group routes require authentication
router.use(authenticateToken);

/**
 * @route POST /api/groups
 * @desc Create a new group
 * @access Private
 * @rateLimit 5 requests per hour
 */
router.post('/', strictGroupLimiter, createGroupValidation, createGroup);

/**
 * @route POST /api/groups/join
 * @desc Join a group with access code
 * @access Private
 * @rateLimit 5 requests per hour
 */
router.post('/join', strictGroupLimiter, joinGroupValidation, joinGroup);

/**
 * @route GET /api/groups/health
 * @desc Group service health check
 * @access Private
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    service: 'Group Management Service',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: {
      createGroup: 'enabled',
      joinGroup: 'enabled',
      groupListing: 'enabled',
      groupManagement: 'enabled',
      memberManagement: 'enabled',
    },
  });
});

export default router; 