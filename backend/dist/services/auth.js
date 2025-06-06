"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const env_1 = require("@/config/env");
const logger_1 = require("@/utils/logger");
const errorHandler_1 = require("@/middleware/errorHandler");
const database_1 = require("@/services/database");
class AuthService {
    static generateToken(user) {
        const payload = {
            userId: user.id,
            username: user.username,
        };
        const token = jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, {
            expiresIn: env_1.env.JWT_EXPIRES_IN,
            issuer: 'hucares-api',
            audience: 'hucares-app',
        });
        logger_1.logger.info(`🔑 JWT token generated for user: ${user.username}`);
        return token;
    }
    static verifyToken(token) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET, {
                issuer: 'hucares-api',
                audience: 'hucares-app',
            });
            return payload;
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
    }
    static async hashPassword(password) {
        try {
            const saltRounds = env_1.env.BCRYPT_SALT_ROUNDS;
            const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
            return hashedPassword;
        }
        catch (error) {
            logger_1.logger.error('Password hashing failed:', error);
            throw new Error('Password hashing failed');
        }
    }
    static async comparePassword(password, hashedPassword) {
        try {
            return await bcryptjs_1.default.compare(password, hashedPassword);
        }
        catch (error) {
            logger_1.logger.error('Password comparison failed:', error);
            return false;
        }
    }
    static validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        if (password.length < minLength) {
            throw new errorHandler_1.ValidationError(`Password must be at least ${minLength} characters long`);
        }
        if (!hasUpperCase) {
            throw new errorHandler_1.ValidationError('Password must contain at least one uppercase letter');
        }
        if (!hasLowerCase) {
            throw new errorHandler_1.ValidationError('Password must contain at least one lowercase letter');
        }
        if (!hasNumbers) {
            throw new errorHandler_1.ValidationError('Password must contain at least one number');
        }
    }
    static validateUsername(username) {
        const minLength = 3;
        const maxLength = 20;
        const validPattern = /^[a-zA-Z0-9_-]+$/;
        if (username.length < minLength || username.length > maxLength) {
            throw new errorHandler_1.ValidationError(`Username must be between ${minLength} and ${maxLength} characters`);
        }
        if (!validPattern.test(username)) {
            throw new errorHandler_1.ValidationError('Username can only contain letters, numbers, hyphens, and underscores');
        }
        const reserved = ['admin', 'root', 'api', 'www', 'mail', 'support', 'help', 'info'];
        if (reserved.includes(username.toLowerCase())) {
            throw new errorHandler_1.ValidationError('This username is reserved');
        }
    }
    static async register(userData) {
        const { username, password, email } = userData;
        logger_1.logger.info(`📝 Registration attempt for username: ${username}`);
        this.validateUsername(username);
        this.validatePassword(password);
        if (email && !this.isValidEmail(email)) {
            throw new errorHandler_1.ValidationError('Invalid email format');
        }
        try {
            const existingUser = await database_1.db.user.findUnique({
                where: { username: username.toLowerCase() },
            });
            if (existingUser) {
                throw new errorHandler_1.ConflictError('Username already exists');
            }
            if (email) {
                const existingEmail = await database_1.db.user.findFirst({
                    where: { email: email.toLowerCase() },
                });
                if (existingEmail) {
                    throw new errorHandler_1.ConflictError('Email already registered');
                }
            }
            const hashedPassword = await this.hashPassword(password);
            const user = await database_1.db.user.create({
                data: {
                    username: username.toLowerCase(),
                    passwordHash: hashedPassword,
                    email: email ? email.toLowerCase() : null,
                    lastLoginAt: new Date(),
                },
            });
            const token = this.generateToken(user);
            logger_1.logger.info(`✅ User registered successfully: ${user.username}`);
            return {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    createdAt: user.createdAt,
                    lastLoginAt: user.lastLoginAt,
                },
                token,
                expiresIn: env_1.env.JWT_EXPIRES_IN,
            };
        }
        catch (error) {
            if (error instanceof errorHandler_1.ConflictError || error instanceof errorHandler_1.ValidationError) {
                throw error;
            }
            logger_1.logger.error('Registration error:', error);
            throw new Error('Registration failed');
        }
    }
    static async login(loginData) {
        const { username, password } = loginData;
        logger_1.logger.info(`🔐 Login attempt for username: ${username}`);
        try {
            const user = await database_1.db.user.findUnique({
                where: {
                    username: username.toLowerCase(),
                    isActive: true,
                },
            });
            if (!user) {
                throw new errorHandler_1.UnauthorizedError('Invalid username or password');
            }
            const isPasswordValid = await this.comparePassword(password, user.passwordHash);
            if (!isPasswordValid) {
                logger_1.logger.warn(`❌ Failed login attempt for user: ${username}`);
                throw new errorHandler_1.UnauthorizedError('Invalid username or password');
            }
            const updatedUser = await database_1.db.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });
            const token = this.generateToken(updatedUser);
            logger_1.logger.info(`✅ User logged in successfully: ${user.username}`);
            return {
                user: {
                    id: updatedUser.id,
                    username: updatedUser.username,
                    email: updatedUser.email,
                    createdAt: updatedUser.createdAt,
                    lastLoginAt: updatedUser.lastLoginAt,
                },
                token,
                expiresIn: env_1.env.JWT_EXPIRES_IN,
            };
        }
        catch (error) {
            if (error instanceof errorHandler_1.UnauthorizedError) {
                throw error;
            }
            logger_1.logger.error('Login error:', error);
            throw new Error('Login failed');
        }
    }
    static async changePassword(userId, currentPassword, newPassword) {
        logger_1.logger.info(`🔑 Password change attempt for user ID: ${userId}`);
        this.validatePassword(newPassword);
        try {
            const user = await database_1.db.user.findUnique({
                where: { id: userId, isActive: true },
            });
            if (!user) {
                throw new errorHandler_1.NotFoundError('User not found');
            }
            const isCurrentPasswordValid = await this.comparePassword(currentPassword, user.passwordHash);
            if (!isCurrentPasswordValid) {
                throw new errorHandler_1.UnauthorizedError('Current password is incorrect');
            }
            const hashedNewPassword = await this.hashPassword(newPassword);
            await database_1.db.user.update({
                where: { id: userId },
                data: { passwordHash: hashedNewPassword },
            });
            logger_1.logger.info(`✅ Password changed successfully for user: ${user.username}`);
        }
        catch (error) {
            if (error instanceof errorHandler_1.UnauthorizedError || error instanceof errorHandler_1.NotFoundError || error instanceof errorHandler_1.ValidationError) {
                throw error;
            }
            logger_1.logger.error('Password change error:', error);
            throw new Error('Password change failed');
        }
    }
    static async getUserByToken(token) {
        try {
            const payload = this.verifyToken(token);
            const user = await database_1.db.user.findUnique({
                where: {
                    id: payload.userId,
                    isActive: true,
                },
            });
            return user;
        }
        catch (error) {
            logger_1.logger.warn('Token verification failed:', error);
            return null;
        }
    }
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    static async deactivateAccount(userId) {
        logger_1.logger.info(`🗑️ Account deactivation for user ID: ${userId}`);
        try {
            await database_1.db.user.update({
                where: { id: userId },
                data: { isActive: false },
            });
            logger_1.logger.info(`✅ Account deactivated successfully for user ID: ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Account deactivation error:', error);
            throw new Error('Account deactivation failed');
        }
    }
}
exports.AuthService = AuthService;
exports.default = AuthService;
//# sourceMappingURL=auth.js.map