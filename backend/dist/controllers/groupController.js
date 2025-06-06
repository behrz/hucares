"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGroupMembers = exports.leaveGroup = exports.updateGroup = exports.joinGroup = exports.getGroup = exports.getUserGroups = exports.createGroup = exports.updateGroupValidation = exports.joinGroupValidation = exports.createGroupValidation = void 0;
const express_validator_1 = require("express-validator");
const logger_1 = require("@/utils/logger");
const errorHandler_1 = require("@/middleware/errorHandler");
const errorHandler_2 = require("@/middleware/errorHandler");
const database_1 = require("@/services/database");
const client_1 = require("@prisma/client");
const checkValidation = (req) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg).join(', ');
        throw new errorHandler_2.ValidationError(errorMessages);
    }
};
const generateAccessCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
exports.createGroupValidation = [
    (0, express_validator_1.body)('name')
        .isLength({ min: 3, max: 100 })
        .withMessage('Group name must be between 3 and 100 characters')
        .trim(),
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters')
        .trim(),
    (0, express_validator_1.body)('maxMembers')
        .optional()
        .isInt({ min: 2, max: 50 })
        .withMessage('Maximum members must be between 2 and 50'),
];
exports.joinGroupValidation = [
    (0, express_validator_1.body)('accessCode')
        .isLength({ min: 6, max: 10 })
        .withMessage('Access code must be between 6 and 10 characters')
        .matches(/^[A-Z0-9]+$/)
        .withMessage('Access code must contain only uppercase letters and numbers')
        .trim(),
];
exports.updateGroupValidation = [
    (0, express_validator_1.param)('id')
        .isString()
        .withMessage('Group ID must be a valid string'),
    (0, express_validator_1.body)('name')
        .optional()
        .isLength({ min: 3, max: 100 })
        .withMessage('Group name must be between 3 and 100 characters')
        .trim(),
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters')
        .trim(),
    (0, express_validator_1.body)('maxMembers')
        .optional()
        .isInt({ min: 2, max: 50 })
        .withMessage('Maximum members must be between 2 and 50'),
];
exports.createGroup = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
    logger_1.logger.info(`🏗️ Group creation attempt by user: ${req.user.username}`);
    let accessCode;
    let isUnique = false;
    let attempts = 0;
    do {
        accessCode = generateAccessCode();
        const existing = await database_1.db.group.findUnique({
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
    const group = await database_1.db.group.create({
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
    await database_1.db.groupMembership.create({
        data: {
            userId: req.user.id,
            groupId: group.id,
            role: client_1.Role.ADMIN,
        },
    });
    logger_1.logger.info(`✅ Group created successfully: ${group.name} (${group.accessCode})`);
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
exports.getUserGroups = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
        });
        return;
    }
    try {
        const memberships = await database_1.db.groupMembership.findMany({
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
    }
    catch (error) {
        logger_1.logger.error('Get user groups error:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to retrieve groups',
            timestamp: new Date().toISOString(),
        });
    }
});
exports.getGroup = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
        if (!groupId) {
            res.status(400).json({
                error: 'ValidationError',
                message: 'Group ID is required',
                timestamp: new Date().toISOString(),
            });
            return;
        }
        const membership = await database_1.db.groupMembership.findFirst({
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
        const group = await database_1.db.group.findUnique({
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
                    take: 10,
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
    }
    catch (error) {
        logger_1.logger.error('Get group error:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to retrieve group',
            timestamp: new Date().toISOString(),
        });
    }
});
exports.joinGroup = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
    logger_1.logger.info(`🤝 Group join attempt by user: ${req.user.username} with code: ${accessCode}`);
    const group = await database_1.db.group.findUnique({
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
    const existingMembership = await database_1.db.groupMembership.findFirst({
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
    if (group.memberships.length >= group.maxMembers) {
        res.status(409).json({
            error: 'Conflict',
            message: 'This group is full',
            timestamp: new Date().toISOString(),
        });
        return;
    }
    const membership = await database_1.db.groupMembership.create({
        data: {
            userId: req.user.id,
            groupId: group.id,
            role: client_1.Role.MEMBER,
        },
    });
    logger_1.logger.info(`✅ User ${req.user.username} joined group: ${group.name}`);
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
exports.updateGroup = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
        const membership = await database_1.db.groupMembership.findFirst({
            where: {
                userId: req.user.id,
                groupId,
                isActive: true,
                role: client_1.Role.ADMIN,
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
        const currentMemberCount = await database_1.db.groupMembership.count({
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
        const updatedGroup = await database_1.db.group.update({
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
        logger_1.logger.info(`✅ Group updated by ${req.user.username}: ${updatedGroup.name}`);
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
    }
    catch (error) {
        logger_1.logger.error('Update group error:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to update group',
            timestamp: new Date().toISOString(),
        });
    }
});
exports.leaveGroup = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
        const membership = await database_1.db.groupMembership.findFirst({
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
        if (membership.group.createdBy === req.user.id) {
            const otherAdmins = await database_1.db.groupMembership.count({
                where: {
                    groupId,
                    isActive: true,
                    role: client_1.Role.ADMIN,
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
        await database_1.db.groupMembership.update({
            where: { id: membership.id },
            data: { isActive: false },
        });
        logger_1.logger.info(`👋 User ${req.user.username} left group: ${membership.group.name}`);
        res.status(200).json({
            message: 'Successfully left group',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Leave group error:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to leave group',
            timestamp: new Date().toISOString(),
        });
    }
});
exports.getGroupMembers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
        const userMembership = await database_1.db.groupMembership.findFirst({
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
        const memberships = await database_1.db.groupMembership.findMany({
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
                { role: 'desc' },
                { joinedAt: 'asc' },
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
    }
    catch (error) {
        logger_1.logger.error('Get group members error:', error);
        res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to retrieve group members',
            timestamp: new Date().toISOString(),
        });
    }
});
exports.default = {
    createGroup: exports.createGroup,
    getUserGroups: exports.getUserGroups,
    getGroup: exports.getGroup,
    joinGroup: exports.joinGroup,
    updateGroup: exports.updateGroup,
    leaveGroup: exports.leaveGroup,
    getGroupMembers: exports.getGroupMembers,
};
//# sourceMappingURL=groupController.js.map