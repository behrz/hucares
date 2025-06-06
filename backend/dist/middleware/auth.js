"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRefreshToken = exports.requireRole = exports.optionalAuth = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("@/config/env");
const logger_1 = require("@/utils/logger");
const errorHandler_1 = require("@/middleware/errorHandler");
const database_1 = require("@/services/database");
const extractToken = (authHeader) => {
    if (!authHeader || Array.isArray(authHeader)) {
        return null;
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    return parts[1] || null;
};
const authenticateToken = async (req, res, next) => {
    try {
        const token = extractToken(req.headers.authorization);
        if (!token) {
            throw new errorHandler_1.UnauthorizedError('Access token is required');
        }
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET, {
                issuer: 'hucares-api',
                audience: 'hucares-app',
            });
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new errorHandler_1.UnauthorizedError('Token has expired');
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new errorHandler_1.UnauthorizedError('Invalid token');
            }
            else {
                throw new errorHandler_1.UnauthorizedError('Token verification failed');
            }
        }
        const user = await database_1.db.user.findUnique({
            where: {
                id: payload.userId,
                isActive: true,
            },
            select: {
                id: true,
                username: true,
                email: true,
                isActive: true,
            },
        });
        if (!user) {
            throw new errorHandler_1.UnauthorizedError('User not found or inactive');
        }
        req.user = user;
        logger_1.logger.debug(`🔑 Authenticated user: ${user.username}`);
        next();
    }
    catch (error) {
        if (error instanceof errorHandler_1.UnauthorizedError) {
            next(error);
        }
        else {
            logger_1.logger.error('Authentication middleware error:', error);
            next(new errorHandler_1.UnauthorizedError('Authentication failed'));
        }
    }
};
exports.authenticateToken = authenticateToken;
const optionalAuth = async (req, res, next) => {
    try {
        const token = extractToken(req.headers.authorization);
        if (!token) {
            next();
            return;
        }
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET, {
            issuer: 'hucares-api',
            audience: 'hucares-app',
        });
        const user = await database_1.db.user.findUnique({
            where: {
                id: payload.userId,
                isActive: true,
            },
            select: {
                id: true,
                username: true,
                email: true,
                isActive: true,
            },
        });
        if (user) {
            req.user = user;
            logger_1.logger.debug(`🔑 Optionally authenticated user: ${user.username}`);
        }
        next();
    }
    catch (error) {
        logger_1.logger.debug('Optional authentication failed, continuing without auth:', error);
        next();
    }
};
exports.optionalAuth = optionalAuth;
const requireRole = (role) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                throw new errorHandler_1.UnauthorizedError('Authentication required');
            }
            const isAdmin = req.user.username === 'admin' || req.user.username.endsWith('-admin');
            if (role === 'ADMIN' && !isAdmin) {
                throw new errorHandler_1.UnauthorizedError('Admin access required');
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireRole = requireRole;
const validateRefreshToken = async (req, res, next) => {
    next();
};
exports.validateRefreshToken = validateRefreshToken;
exports.default = {
    authenticateToken: exports.authenticateToken,
    optionalAuth: exports.optionalAuth,
    requireRole: exports.requireRole,
    validateRefreshToken: exports.validateRefreshToken,
};
//# sourceMappingURL=auth.js.map