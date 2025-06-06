"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivateAccount = exports.logout = exports.changePassword = exports.getProfile = exports.login = exports.register = exports.changePasswordValidation = exports.loginValidation = exports.registerValidation = void 0;
const express_validator_1 = require("express-validator");
const logger_1 = require("@/utils/logger");
const errorHandler_1 = require("@/middleware/errorHandler");
const errorHandler_2 = require("@/middleware/errorHandler");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("@/config/env");
const database_1 = require("@/services/database");
const generateToken = (user) => {
    const payload = { userId: user.id, username: user.username };
    const options = {
        expiresIn: env_1.env.JWT_EXPIRES_IN,
        issuer: 'hucares-api',
        audience: 'hucares-app',
    };
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, options);
};
exports.registerValidation = [
    (0, express_validator_1.body)('username')
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
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    (0, express_validator_1.body)('email')
        .optional()
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail(),
];
exports.loginValidation = [
    (0, express_validator_1.body)('username')
        .notEmpty()
        .withMessage('Username is required')
        .trim(),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required'),
];
exports.changePasswordValidation = [
    (0, express_validator_1.body)('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    (0, express_validator_1.body)('newPassword')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
];
const checkValidation = (req) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg).join(', ');
        throw new errorHandler_2.ValidationError(errorMessages);
    }
};
exports.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    checkValidation(req);
    const { username, password, email } = req.body;
    logger_1.logger.info(`📝 Registration attempt for username: ${username}`);
    const existingUser = await database_1.db.user.findUnique({
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
    if (email) {
        const existingEmail = await database_1.db.user.findFirst({
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
    const hashedPassword = await bcryptjs_1.default.hash(password, env_1.env.BCRYPT_SALT_ROUNDS);
    const user = await database_1.db.user.create({
        data: {
            username: username.toLowerCase(),
            passwordHash: hashedPassword,
            email: email ? email.toLowerCase() : null,
            lastLoginAt: new Date(),
        },
    });
    const token = generateToken(user);
    logger_1.logger.info(`✅ User registered successfully: ${user.username}`);
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
        expiresIn: env_1.env.JWT_EXPIRES_IN,
    });
});
exports.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    checkValidation(req);
    const { username, password } = req.body;
    logger_1.logger.info(`🔐 Login attempt for username: ${username}`);
    const user = await database_1.db.user.findUnique({
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
    const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        logger_1.logger.warn(`❌ Failed login attempt for user: ${username}`);
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid username or password',
            timestamp: new Date().toISOString(),
        });
        return;
    }
    const updatedUser = await database_1.db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
    });
    const token = generateToken(updatedUser);
    logger_1.logger.info(`✅ User logged in successfully: ${user.username}`);
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
        expiresIn: env_1.env.JWT_EXPIRES_IN,
    });
});
exports.getProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
        });
        return;
    }
    const user = await database_1.db.user.findUnique({
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
            groups: user.groupMemberships.map((membership) => membership.group),
        },
    });
});
exports.changePassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
    logger_1.logger.info(`🔑 Password change attempt for user: ${req.user.username}`);
    const user = await database_1.db.user.findUnique({
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
    const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Current password is incorrect',
            timestamp: new Date().toISOString(),
        });
        return;
    }
    const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, env_1.env.BCRYPT_SALT_ROUNDS);
    await database_1.db.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedNewPassword },
    });
    logger_1.logger.info(`✅ Password changed successfully for user: ${user.username}`);
    res.status(200).json({
        message: 'Password changed successfully',
        timestamp: new Date().toISOString(),
    });
});
exports.logout = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    logger_1.logger.info(`👋 User logged out: ${req.user?.username || 'unknown'}`);
    res.status(200).json({
        message: 'Logout successful',
        timestamp: new Date().toISOString(),
    });
});
exports.deactivateAccount = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
        });
        return;
    }
    logger_1.logger.info(`🗑️ Account deactivation for user: ${req.user.username}`);
    await database_1.db.user.update({
        where: { id: req.user.id },
        data: { isActive: false },
    });
    logger_1.logger.info(`✅ Account deactivated successfully for user: ${req.user.username}`);
    res.status(200).json({
        message: 'Account deactivated successfully',
        timestamp: new Date().toISOString(),
    });
});
exports.default = {
    register: exports.register,
    login: exports.login,
    getProfile: exports.getProfile,
    changePassword: exports.changePassword,
    logout: exports.logout,
    deactivateAccount: exports.deactivateAccount,
};
//# sourceMappingURL=authController.js.map