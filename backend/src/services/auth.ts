import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';
import { 
  UnauthorizedError, 
  ValidationError, 
  ConflictError,
  NotFoundError 
} from '@/middleware/errorHandler';
import { db } from '@/services/database';

// JWT payload interface
export interface JWTPayload {
  userId: string;
  username: string;
  iat: number;
  exp: number;
}

// User registration data
export interface RegisterData {
  username: string;
  password: string;
  email?: string;
}

// User login data
export interface LoginData {
  username: string;
  password: string;
}

// Auth response
export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string | null;
    createdAt: Date;
    lastLoginAt: Date | null;
  };
  token: string;
  expiresIn: string;
}

export class AuthService {
  // Generate JWT token
  static generateToken(user: User): string {
    const payload = {
      userId: user.id,
      username: user.username,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as string | number,
      issuer: 'hucares-api',
      audience: 'hucares-app',
    } as jwt.SignOptions);

    logger.info(`🔑 JWT token generated for user: ${user.username}`);
    return token;
  }

  // Verify JWT token
  static verifyToken(token: string): JWTPayload {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET, {
        issuer: 'hucares-api',
        audience: 'hucares-app',
      }) as JWTPayload;

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      } else {
        throw new UnauthorizedError('Token verification failed');
      }
    }
  }

  // Hash password
  static async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = env.BCRYPT_SALT_ROUNDS;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      return hashedPassword;
    } catch (error) {
      logger.error('Password hashing failed:', error);
      throw new Error('Password hashing failed');
    }
  }

  // Compare password
  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      logger.error('Password comparison failed:', error);
      return false;
    }
  }

  // Validate password strength
  static validatePassword(password: string): void {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (password.length < minLength) {
      throw new ValidationError(`Password must be at least ${minLength} characters long`);
    }

    if (!hasUpperCase) {
      throw new ValidationError('Password must contain at least one uppercase letter');
    }

    if (!hasLowerCase) {
      throw new ValidationError('Password must contain at least one lowercase letter');
    }

    if (!hasNumbers) {
      throw new ValidationError('Password must contain at least one number');
    }
  }

  // Validate username
  static validateUsername(username: string): void {
    const minLength = 3;
    const maxLength = 20;
    const validPattern = /^[a-zA-Z0-9_-]+$/;

    if (username.length < minLength || username.length > maxLength) {
      throw new ValidationError(`Username must be between ${minLength} and ${maxLength} characters`);
    }

    if (!validPattern.test(username)) {
      throw new ValidationError('Username can only contain letters, numbers, hyphens, and underscores');
    }

    // Reserved usernames
    const reserved = ['admin', 'root', 'api', 'www', 'mail', 'support', 'help', 'info'];
    if (reserved.includes(username.toLowerCase())) {
      throw new ValidationError('This username is reserved');
    }
  }

  // Register new user
  static async register(userData: RegisterData): Promise<AuthResponse> {
    const { username, password, email } = userData;

    logger.info(`📝 Registration attempt for username: ${username}`);

    // Validate input
    this.validateUsername(username);
    this.validatePassword(password);

    if (email && !this.isValidEmail(email)) {
      throw new ValidationError('Invalid email format');
    }

    try {
      // Check if username already exists
      const existingUser = await db.user.findUnique({
        where: { username: username.toLowerCase() },
      });

      if (existingUser) {
        throw new ConflictError('Username already exists');
      }

      // Check if email already exists (if provided)
      if (email) {
        const existingEmail = await db.user.findFirst({
          where: { email: email.toLowerCase() },
        });

        if (existingEmail) {
          throw new ConflictError('Email already registered');
        }
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user
      const user = await db.user.create({
        data: {
          username: username.toLowerCase(),
          passwordHash: hashedPassword,
          email: email ? email.toLowerCase() : null,
          lastLoginAt: new Date(),
        },
      });

      // Generate token
      const token = this.generateToken(user);

      logger.info(`✅ User registered successfully: ${user.username}`);

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        },
        token,
        expiresIn: env.JWT_EXPIRES_IN,
      };

    } catch (error) {
      if (error instanceof ConflictError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Registration error:', error);
      throw new Error('Registration failed');
    }
  }

  // Login user
  static async login(loginData: LoginData): Promise<AuthResponse> {
    const { username, password } = loginData;

    logger.info(`🔐 Login attempt for username: ${username}`);

    try {
      // Find user by username
      const user = await db.user.findUnique({
        where: { 
          username: username.toLowerCase(),
          isActive: true,
        },
      });

      if (!user) {
        throw new UnauthorizedError('Invalid username or password');
      }

      // Compare password
      const isPasswordValid = await this.comparePassword(password, user.passwordHash);

      if (!isPasswordValid) {
        logger.warn(`❌ Failed login attempt for user: ${username}`);
        throw new UnauthorizedError('Invalid username or password');
      }

      // Update last login time
      const updatedUser = await db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate token
      const token = this.generateToken(updatedUser);

      logger.info(`✅ User logged in successfully: ${user.username}`);

      return {
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          createdAt: updatedUser.createdAt,
          lastLoginAt: updatedUser.lastLoginAt,
        },
        token,
        expiresIn: env.JWT_EXPIRES_IN,
      };

    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      logger.error('Login error:', error);
      throw new Error('Login failed');
    }
  }

  // Change password
  static async changePassword(
    userId: string, 
    currentPassword: string, 
    newPassword: string
  ): Promise<void> {
    logger.info(`🔑 Password change attempt for user ID: ${userId}`);

    this.validatePassword(newPassword);

    try {
      // Find user
      const user = await db.user.findUnique({
        where: { id: userId, isActive: true },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await this.comparePassword(currentPassword, user.passwordHash);

      if (!isCurrentPasswordValid) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await this.hashPassword(newPassword);

      // Update password
      await db.user.update({
        where: { id: userId },
        data: { passwordHash: hashedNewPassword },
      });

      logger.info(`✅ Password changed successfully for user: ${user.username}`);

    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Password change error:', error);
      throw new Error('Password change failed');
    }
  }

  // Get user by token
  static async getUserByToken(token: string): Promise<User | null> {
    try {
      const payload = this.verifyToken(token);
      
      const user = await db.user.findUnique({
        where: { 
          id: payload.userId,
          isActive: true,
        },
      });

      return user;
    } catch (error) {
      logger.warn('Token verification failed:', error);
      return null;
    }
  }

  // Validate email format
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Deactivate user account
  static async deactivateAccount(userId: string): Promise<void> {
    logger.info(`🗑️ Account deactivation for user ID: ${userId}`);

    try {
      await db.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      logger.info(`✅ Account deactivated successfully for user ID: ${userId}`);
    } catch (error) {
      logger.error('Account deactivation error:', error);
      throw new Error('Account deactivation failed');
    }
  }
}

export default AuthService; 