import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { logger } from '@/utils/logger';
import { asyncHandler } from '@/middleware/errorHandler';
import { ValidationError } from '@/middleware/errorHandler';
import { db } from '@/services/database';

// Helper to check validation results
const checkValidation = (req: Request): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg).join(', ');
    throw new ValidationError(errorMessages);
  }
};

// Helper to get week start date (Monday)
const getWeekStartDate = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

// Calculate HuCares score
const calculateHuCaresScore = (
  productive: number,
  satisfied: number,
  body: number,
  care: number,
): number => {
  return productive + satisfied + body - care;
};

// Validation rules
export const submitCheckinValidation = [
  body('groupId')
    .isString()
    .withMessage('Group ID is required'),
  body('productiveScore')
    .isInt({ min: 1, max: 10 })
    .withMessage('Productive score must be between 1 and 10'),
  body('satisfiedScore')
    .isInt({ min: 1, max: 10 })
    .withMessage('Satisfied score must be between 1 and 10'),
  body('bodyScore')
    .isInt({ min: 1, max: 10 })
    .withMessage('Body score must be between 1 and 10'),
  body('careScore')
    .isInt({ min: 1, max: 10 })
    .withMessage('Care score must be between 1 and 10'),
  body('weekStartDate')
    .optional()
    .isISO8601()
    .withMessage('Week start date must be a valid ISO date'),
];

export const getCheckinValidation = [
  query('groupId')
    .optional()
    .isString()
    .withMessage('Group ID must be a valid string'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be 0 or greater'),
];

/**
 * @route POST /api/checkins
 * @desc Submit weekly check-in
 * @access Private
 */
export const submitCheckin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  checkValidation(req);

  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const {
    groupId,
    productiveScore,
    satisfiedScore,
    bodyScore,
    careScore,
    weekStartDate: providedWeekStartDate,
  } = req.body;

  logger.info(`📝 Check-in submission by user: ${req.user.username} for group: ${groupId}`);

  // Verify user is a member of the group
  const membership = await db.groupMembership.findFirst({
    where: {
      userId: req.user.id,
      groupId,
      isActive: true,
    },
    include: {
      group: {
        select: { name: true, isActive: true },
      },
    },
  });

  if (!membership || !membership.group.isActive) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You are not a member of this group or group is inactive',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Determine week start date
  const weekStartDate = providedWeekStartDate 
    ? new Date(providedWeekStartDate)
    : getWeekStartDate();

  // Check if user already submitted check-in for this week and group
  const existingCheckin = await db.checkIn.findFirst({
    where: {
      userId: req.user.id,
      groupId,
      weekStartDate,
    },
  });

  if (existingCheckin) {
    res.status(409).json({
      error: 'Conflict',
      message: 'You have already submitted a check-in for this week in this group',
      existingCheckin: {
        id: existingCheckin.id,
        huCaresScore: existingCheckin.huCaresScore,
        submittedAt: existingCheckin.submittedAt,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Calculate HuCares score
  const huCaresScore = calculateHuCaresScore(productiveScore, satisfiedScore, bodyScore, careScore);

  // Create check-in
  const checkin = await db.checkIn.create({
    data: {
      userId: req.user.id,
      groupId,
      weekStartDate,
      productiveScore,
      satisfiedScore,
      bodyScore,
      careScore,
      huCaresScore,
    },
    include: {
      user: {
        select: { id: true, username: true },
      },
      group: {
        select: { id: true, name: true },
      },
    },
  });

  logger.info(`✅ Check-in submitted: Score ${huCaresScore} by ${req.user.username} in ${membership.group.name}`);

  // Get group check-ins for this week to show in response
  const weeklyGroupCheckins = await db.checkIn.findMany({
    where: {
      groupId,
      weekStartDate,
    },
    include: {
      user: {
        select: { id: true, username: true },
      },
    },
    orderBy: {
      submittedAt: 'desc',
    },
  });

  // Calculate group statistics for this week
  const scores = weeklyGroupCheckins.map(c => c.huCaresScore);
  const groupStats = {
    totalCheckins: scores.length,
    averageScore: scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0,
    highestScore: scores.length > 0 ? Math.max(...scores) : 0,
    lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
  };

  res.status(201).json({
    message: 'Check-in submitted successfully',
    checkin: {
      id: checkin.id,
      weekStartDate: checkin.weekStartDate,
      productiveScore: checkin.productiveScore,
      satisfiedScore: checkin.satisfiedScore,
      bodyScore: checkin.bodyScore,
      careScore: checkin.careScore,
      huCaresScore: checkin.huCaresScore,
      submittedAt: checkin.submittedAt,
      user: checkin.user,
      group: checkin.group,
    },
    groupStats,
    weeklyCheckins: weeklyGroupCheckins.map(c => ({
      id: c.id,
      user: c.user,
      huCaresScore: c.huCaresScore,
      submittedAt: c.submittedAt,
    })),
  });
});

/**
 * @route GET /api/checkins
 * @desc Get user's check-in history
 * @access Private
 */
export const getUserCheckins = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  checkValidation(req);

  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const { groupId, limit = 20, offset = 0 } = req.query;

  const whereClause: any = {
    userId: req.user.id,
  };

  if (groupId) {
    // Verify user is a member of the group
    const membership = await db.groupMembership.findFirst({
      where: {
        userId: req.user.id,
        groupId: groupId as string,
        isActive: true,
      },
    });

    if (!membership) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You are not a member of this group',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    whereClause.groupId = groupId;
  }

  const checkins = await db.checkIn.findMany({
    where: whereClause,
    include: {
      group: {
        select: { id: true, name: true },
      },
    },
    orderBy: {
      weekStartDate: 'desc',
    },
    take: Number(limit),
    skip: Number(offset),
  });

  const totalCount = await db.checkIn.count({
    where: whereClause,
  });

  res.status(200).json({
    checkins: checkins.map(checkin => ({
      id: checkin.id,
      weekStartDate: checkin.weekStartDate,
      productiveScore: checkin.productiveScore,
      satisfiedScore: checkin.satisfiedScore,
      bodyScore: checkin.bodyScore,
      careScore: checkin.careScore,
      huCaresScore: checkin.huCaresScore,
      submittedAt: checkin.submittedAt,
      group: checkin.group,
    })),
    pagination: {
      total: totalCount,
      limit: Number(limit),
      offset: Number(offset),
      hasMore: totalCount > Number(offset) + Number(limit),
    },
  });
});

/**
 * @route GET /api/checkins/group/:id
 * @desc Get group's check-ins
 * @access Private
 */
export const getGroupCheckins = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const { id: groupId } = req.params;
  const { limit = 50, offset = 0, weekStartDate } = req.query;

  // Verify user is a member of the group
  const membership = await db.groupMembership.findFirst({
    where: {
      userId: req.user.id,
      groupId,
      isActive: true,
    },
    include: {
      group: {
        select: { name: true, isActive: true },
      },
    },
  });

  if (!membership || !membership.group.isActive) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You are not a member of this group or group is inactive',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const whereClause: any = {
    groupId,
  };

  if (weekStartDate) {
    whereClause.weekStartDate = new Date(weekStartDate as string);
  }

  const checkins = await db.checkIn.findMany({
    where: whereClause,
    include: {
      user: {
        select: { id: true, username: true },
      },
    },
    orderBy: [
      { weekStartDate: 'desc' },
      { submittedAt: 'desc' },
    ],
    take: Number(limit),
    skip: Number(offset),
  });

  const totalCount = await db.checkIn.count({
    where: whereClause,
  });

  res.status(200).json({
    groupName: membership.group.name,
    checkins: checkins.map(checkin => ({
      id: checkin.id,
      user: checkin.user,
      weekStartDate: checkin.weekStartDate,
      productiveScore: checkin.productiveScore,
      satisfiedScore: checkin.satisfiedScore,
      bodyScore: checkin.bodyScore,
      careScore: checkin.careScore,
      huCaresScore: checkin.huCaresScore,
      submittedAt: checkin.submittedAt,
    })),
    pagination: {
      total: totalCount,
      limit: Number(limit),
      offset: Number(offset),
      hasMore: totalCount > Number(offset) + Number(limit),
    },
  });
});

/**
 * @route GET /api/checkins/current
 * @desc Get current week's check-ins for user's groups
 * @access Private
 */
export const getCurrentWeekCheckins = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const currentWeekStart = getWeekStartDate();

  // Get user's groups
  const memberships = await db.groupMembership.findMany({
    where: {
      userId: req.user.id,
      isActive: true,
    },
    include: {
      group: {
        select: { id: true, name: true },
      },
    },
  });

  const groupIds = memberships.map(m => m.group.id);

  // Get current week check-ins for all user's groups
  const checkins = await db.checkIn.findMany({
    where: {
      groupId: { in: groupIds },
      weekStartDate: currentWeekStart,
    },
    include: {
      user: {
        select: { id: true, username: true },
      },
      group: {
        select: { id: true, name: true },
      },
    },
    orderBy: {
      submittedAt: 'desc',
    },
  });

  // Group check-ins by group
  const groupedCheckins = groupIds.map(groupId => {
    const group = memberships.find(m => m.group.id === groupId)?.group;
    const groupCheckins = checkins.filter(c => c.groupId === groupId);
    const userCheckin = groupCheckins.find(c => c.userId === req.user?.id);
    
    const scores = groupCheckins.map(c => c.huCaresScore);
    const groupStats = {
      totalCheckins: scores.length,
      averageScore: scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
    };

    return {
      group,
      userSubmitted: !!userCheckin,
      userCheckin: userCheckin ? {
        id: userCheckin.id,
        huCaresScore: userCheckin.huCaresScore,
        submittedAt: userCheckin.submittedAt,
      } : null,
      groupStats,
      recentCheckins: groupCheckins.slice(0, 5).map(c => ({
        id: c.id,
        user: c.user,
        huCaresScore: c.huCaresScore,
        submittedAt: c.submittedAt,
      })),
    };
  });

  res.status(200).json({
    weekStartDate: currentWeekStart,
    totalGroups: groupIds.length,
    submittedCount: groupedCheckins.filter(g => g.userSubmitted).length,
    groups: groupedCheckins,
  });
});

export default {
  submitCheckin,
  getUserCheckins,
  getGroupCheckins,
  getCurrentWeekCheckins,
}; 