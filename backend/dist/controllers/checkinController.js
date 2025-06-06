"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentWeekCheckins = exports.getGroupCheckins = exports.getUserCheckins = exports.submitCheckin = exports.getCheckinValidation = exports.submitCheckinValidation = void 0;
const express_validator_1 = require("express-validator");
const logger_1 = require("@/utils/logger");
const errorHandler_1 = require("@/middleware/errorHandler");
const errorHandler_2 = require("@/middleware/errorHandler");
const database_1 = require("@/services/database");
const checkValidation = (req) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg).join(', ');
        throw new errorHandler_2.ValidationError(errorMessages);
    }
};
const getWeekStartDate = (date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
};
const calculateHuCaresScore = (productive, satisfied, body, care) => {
    return productive + satisfied + body - care;
};
exports.submitCheckinValidation = [
    (0, express_validator_1.body)('groupId')
        .isString()
        .withMessage('Group ID is required'),
    (0, express_validator_1.body)('productiveScore')
        .isInt({ min: 1, max: 10 })
        .withMessage('Productive score must be between 1 and 10'),
    (0, express_validator_1.body)('satisfiedScore')
        .isInt({ min: 1, max: 10 })
        .withMessage('Satisfied score must be between 1 and 10'),
    (0, express_validator_1.body)('bodyScore')
        .isInt({ min: 1, max: 10 })
        .withMessage('Body score must be between 1 and 10'),
    (0, express_validator_1.body)('careScore')
        .isInt({ min: 1, max: 10 })
        .withMessage('Care score must be between 1 and 10'),
    (0, express_validator_1.body)('weekStartDate')
        .optional()
        .isISO8601()
        .withMessage('Week start date must be a valid ISO date'),
];
exports.getCheckinValidation = [
    (0, express_validator_1.query)('groupId')
        .optional()
        .isString()
        .withMessage('Group ID must be a valid string'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('offset')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Offset must be 0 or greater'),
];
exports.submitCheckin = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    checkValidation(req);
    if (!req.user) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
        });
        return;
    }
    const { groupId, productiveScore, satisfiedScore, bodyScore, careScore, weekStartDate: providedWeekStartDate, } = req.body;
    logger_1.logger.info(`📝 Check-in submission by user: ${req.user.username} for group: ${groupId}`);
    const membership = await database_1.db.groupMembership.findFirst({
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
    const weekStartDate = providedWeekStartDate
        ? new Date(providedWeekStartDate)
        : getWeekStartDate();
    const existingCheckin = await database_1.db.checkIn.findFirst({
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
    const huCaresScore = calculateHuCaresScore(productiveScore, satisfiedScore, bodyScore, careScore);
    const checkin = await database_1.db.checkIn.create({
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
    logger_1.logger.info(`✅ Check-in submitted: Score ${huCaresScore} by ${req.user.username} in ${membership.group.name}`);
    const weeklyGroupCheckins = await database_1.db.checkIn.findMany({
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
exports.getUserCheckins = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
    const whereClause = {
        userId: req.user.id,
    };
    if (groupId) {
        const membership = await database_1.db.groupMembership.findFirst({
            where: {
                userId: req.user.id,
                groupId: groupId,
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
    const checkins = await database_1.db.checkIn.findMany({
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
    const totalCount = await database_1.db.checkIn.count({
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
exports.getGroupCheckins = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
    const membership = await database_1.db.groupMembership.findFirst({
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
    const whereClause = {
        groupId,
    };
    if (weekStartDate) {
        whereClause.weekStartDate = new Date(weekStartDate);
    }
    const checkins = await database_1.db.checkIn.findMany({
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
    const totalCount = await database_1.db.checkIn.count({
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
exports.getCurrentWeekCheckins = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
        });
        return;
    }
    const currentWeekStart = getWeekStartDate();
    const memberships = await database_1.db.groupMembership.findMany({
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
    const checkins = await database_1.db.checkIn.findMany({
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
exports.default = {
    submitCheckin: exports.submitCheckin,
    getUserCheckins: exports.getUserCheckins,
    getGroupCheckins: exports.getGroupCheckins,
    getCurrentWeekCheckins: exports.getCurrentWeekCheckins,
};
//# sourceMappingURL=checkinController.js.map