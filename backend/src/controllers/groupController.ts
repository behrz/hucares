import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { logger } from '@/utils/logger';
import { asyncHandler } from '@/middleware/errorHandler';
import { ValidationError, NotFoundError, ConflictError, ForbiddenError } from '@/middleware/errorHandler';
import { db } from '@/services/database';

// Helper to check validation results
const checkValidation = (req: Request): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg).join(', ');
    throw new ValidationError(errorMessages);
  }
};

// Generate unique access code
const generateAccessCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Validation rules
export const createGroupValidation = [
  body('name')
    .isLength({ min: 3, max: 100 })
    .withMessage('Group name must be between 3 and 100 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim(),
  body('maxMembers')
    .optional()
    .isInt({ min: 2, max: 50 })
    .withMessage('Maximum members must be between 2 and 50'),
];

export const joinGroupValidation = [
  body('accessCode')
    .isLength({ min: 6, max: 10 })
    .withMessage('Access code must be between 6 and 10 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Access code must contain only uppercase letters and numbers')
    .trim(),
];

export const updateGroupValidation = [
  param('id')
    .isString()
    .withMessage('Group ID must be a valid string'),
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Group name must be between 3 and 100 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim(),
  body('maxMembers')
    .optional()
    .isInt({ min: 2, max: 50 })
    .withMessage('Maximum members must be between 2 and 50'),
];

/**
 * @route POST /api/groups
 * @desc Create a new group
 * @access Private
 */
export const createGroup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  checkValidation(req);

  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const { name, description, maxMembers = 20 } = req.body;

  logger.info(`🏗️ Group creation attempt by user: ${req.user.username}`);

  // Generate unique access code
  let accessCode: string;
  let isUnique = false;
  let attempts = 0;

  do {
    accessCode = generateAccessCode();
    const existing = await db.group.findUnique({
      where: { accessCode },
    });
    isUnique = !existing;
    attempts++;
  } while (!isUnique && attempts < 10);

  if (!isUnique) {
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Unable to generate unique access code',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Create the group
  const group = await db.group.create({
    data: {
      name,
      description,
      accessCode,
      createdBy: req.user.id,
      maxMembers,
    },
    include: {
      creator: {
        select: { id: true, username: true },
      },
    },
  });

  // Add creator as admin member
  await db.groupMembership.create({
    data: {
      userId: req.user.id,
      groupId: group.id,
      role: 'ADMIN',
    },
  });

  logger.info(`✅ Group created successfully: ${group.name} (${group.accessCode})`);

  res.status(201).json({
    message: 'Group created successfully',
    group: {
      id: group.id,
      name: group.name,
      description: group.description,
      accessCode: group.accessCode,
      maxMembers: group.maxMembers,
      createdAt: group.createdAt,
      creator: group.creator,
      memberCount: 1,
      userRole: 'ADMIN',
    },
  });
});

/**
 * @route GET /api/groups
 * @desc Get user's groups
 * @access Private
 */
export const getUserGroups = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    const memberships = await db.groupMembership.findMany({
      where: {
        userId: req.user.id,
        isActive: true,
      },
      include: {
        group: {
          include: {
            creator: {
              select: { id: true, username: true },
            },
            memberships: {
              where: { isActive: true },
              include: {
                user: {
                  select: { id: true, username: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    const groups = memberships.map(membership => ({
      id: membership.group.id,
      name: membership.group.name,
      description: membership.group.description,
      accessCode: membership.group.accessCode,
      maxMembers: membership.group.maxMembers,
      createdAt: membership.group.createdAt,
      joinedAt: membership.joinedAt,
      creator: membership.group.creator,
      userRole: membership.role,
      memberCount: membership.group.memberships.length,
      members: membership.group.memberships.map(m => ({
        id: m.user.id,
        username: m.user.username,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
    }));

    res.status(200).json({
      groups,
      totalGroups: groups.length,
    });
  } catch (error) {
    logger.error('Get user groups error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve groups',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route GET /api/groups/:id
 * @desc Get specific group details
 * @access Private
 */
export const getGroup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const { id: groupId } = req.params;

  try {
    // Validate groupId parameter
    if (!groupId) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Group ID is required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check if user is a member of this group
    const membership = await db.groupMembership.findFirst({
      where: {
        userId: req.user.id,
        groupId,
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

    // Get group details
    const group = await db.group.findUnique({
      where: { id: groupId, isActive: true },
      include: {
        creator: {
          select: { id: true, username: true },
        },
        memberships: {
          where: { isActive: true },
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
        checkIns: {
          orderBy: {
            weekStartDate: 'desc',
          },
          take: 10, // Recent check-ins
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
        },
      },
    });

    if (!group) {
      res.status(404).json({
        error: 'NotFound',
        message: 'Group not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        accessCode: group.accessCode,
        maxMembers: group.maxMembers,
        createdAt: group.createdAt,
        creator: group.creator,
        userRole: membership.role,
        memberCount: group.memberships.length,
        members: group.memberships.map(m => ({
          id: m.user.id,
          username: m.user.username,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
        recentCheckIns: group.checkIns.map(checkIn => ({
          id: checkIn.id,
          user: checkIn.user,
          weekStartDate: checkIn.weekStartDate,
          huCaresScore: checkIn.huCaresScore,
          submittedAt: checkIn.submittedAt,
        })),
      },
    });
  } catch (error) {
    logger.error('Get group error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve group',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route POST /api/groups/join
 * @desc Join a group with access code
 * @access Private
 */
export const joinGroup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  checkValidation(req);

  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const { accessCode } = req.body;

  logger.info(`🤝 Group join attempt by user: ${req.user.username} with code: ${accessCode}`);

  // Find group by access code
  const group = await db.group.findUnique({
    where: { 
      accessCode: accessCode.toUpperCase(),
      isActive: true,
    },
    include: {
      memberships: {
        where: { isActive: true },
      },
      creator: {
        select: { id: true, username: true },
      },
    },
  });

  if (!group) {
    res.status(404).json({
      error: 'NotFound',
      message: 'Invalid access code',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Check if user is already a member
  const existingMembership = await db.groupMembership.findFirst({
    where: {
      userId: req.user.id,
      groupId: group.id,
      isActive: true,
    },
  });

  if (existingMembership) {
    res.status(409).json({
      error: 'Conflict',
      message: 'You are already a member of this group',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Check if group is full
  if (group.memberships.length >= group.maxMembers) {
    res.status(409).json({
      error: 'Conflict',
      message: 'This group is full',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Add user to group
  const membership = await db.groupMembership.create({
    data: {
      userId: req.user.id,
      groupId: group.id,
      role: 'MEMBER',
    },
  });

  logger.info(`✅ User ${req.user.username} joined group: ${group.name}`);

  res.status(200).json({
    message: 'Successfully joined group',
    group: {
      id: group.id,
      name: group.name,
      description: group.description,
      accessCode: group.accessCode,
      maxMembers: group.maxMembers,
      createdAt: group.createdAt,
      creator: group.creator,
      userRole: membership.role,
      memberCount: group.memberships.length + 1,
      joinedAt: membership.joinedAt,
    },
  });
});

/**
 * @route PUT /api/groups/:id
 * @desc Update group (admin only)
 * @access Private
 */
export const updateGroup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  checkValidation(req);

  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const { id: groupId } = req.params;
  const { name, description, maxMembers } = req.body;

  try {
    // Check if user is admin of this group
    const membership = await db.groupMembership.findFirst({
      where: {
        userId: req.user.id,
        groupId,
        isActive: true,
        role: 'ADMIN',
      },
    });

    if (!membership) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Only group admins can update group settings',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Get current member count to validate maxMembers
    const currentMemberCount = await db.groupMembership.count({
      where: {
        groupId,
        isActive: true,
      },
    });

    if (maxMembers && maxMembers < currentMemberCount) {
      res.status(400).json({
        error: 'ValidationError',
        message: `Cannot set max members below current member count (${currentMemberCount})`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Update group
    const updatedGroup = await db.group.update({
      where: { id: groupId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(maxMembers && { maxMembers }),
      },
      include: {
        creator: {
          select: { id: true, username: true },
        },
      },
    });

    logger.info(`✅ Group updated by ${req.user.username}: ${updatedGroup.name}`);

    res.status(200).json({
      message: 'Group updated successfully',
      group: {
        id: updatedGroup.id,
        name: updatedGroup.name,
        description: updatedGroup.description,
        accessCode: updatedGroup.accessCode,
        maxMembers: updatedGroup.maxMembers,
        createdAt: updatedGroup.createdAt,
        updatedAt: updatedGroup.updatedAt,
        creator: updatedGroup.creator,
        userRole: membership.role,
      },
    });
  } catch (error) {
    logger.error('Update group error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update group',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route DELETE /api/groups/:id/leave
 * @desc Leave a group
 * @access Private
 */
export const leaveGroup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const { id: groupId } = req.params;

  try {
    // Check if user is a member
    const membership = await db.groupMembership.findFirst({
      where: {
        userId: req.user.id,
        groupId,
        isActive: true,
      },
      include: {
        group: {
          select: { name: true, createdBy: true },
        },
      },
    });

    if (!membership) {
      res.status(404).json({
        error: 'NotFound',
        message: 'You are not a member of this group',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check if user is the group creator
    if (membership.group.createdBy === req.user.id) {
      // Count other admins
      const otherAdmins = await db.groupMembership.count({
        where: {
          groupId,
          isActive: true,
          role: 'ADMIN',
          userId: { not: req.user.id },
        },
      });

      if (otherAdmins === 0) {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Cannot leave group as the only admin. Promote another member to admin first.',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    // Remove membership
    await db.groupMembership.update({
      where: { id: membership.id },
      data: { isActive: false },
    });

    logger.info(`👋 User ${req.user.username} left group: ${membership.group.name}`);

    res.status(200).json({
      message: 'Successfully left group',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Leave group error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to leave group',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route GET /api/groups/:id/members
 * @desc Get group members
 * @access Private
 */
export const getGroupMembers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const { id: groupId } = req.params;

  try {
    // Check if user is a member
    const userMembership = await db.groupMembership.findFirst({
      where: {
        userId: req.user.id,
        groupId,
        isActive: true,
      },
    });

    if (!userMembership) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You are not a member of this group',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Get all group members
    const memberships = await db.groupMembership.findMany({
      where: {
        groupId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            createdAt: true,
            lastLoginAt: true,
          },
        },
      },
      orderBy: [
        { role: 'desc' }, // Admins first
        { joinedAt: 'asc' }, // Then by join date
      ],
    });

    const members = memberships.map(membership => ({
      id: membership.user.id,
      username: membership.user.username,
      email: membership.user.email,
      role: membership.role,
      joinedAt: membership.joinedAt,
      lastLoginAt: membership.user.lastLoginAt,
      isCurrentUser: membership.user.id === req.user?.id,
    }));

    res.status(200).json({
      members,
      totalMembers: members.length,
      adminCount: members.filter(m => m.role === 'ADMIN').length,
    });
  } catch (error) {
    logger.error('Get group members error:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve group members',
      timestamp: new Date().toISOString(),
    });
  }
});

export default {
  createGroup,
  getUserGroups,
  getGroup,
  joinGroup,
  updateGroup,
  leaveGroup,
  getGroupMembers,
}; 