import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';
import { UnauthorizedError } from '@/middleware/errorHandler';
import { db } from '@/services/database';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email: string | null;
        isActive: boolean;
      };
    }
  }
}

// JWT payload interface
interface JWTPayload {
  userId: string;
  username: string;
  iat: number;
  exp: number;
}

// Extract token from Authorization header
const extractToken = (authHeader: string | string[] | undefined): string | null => {
  if (!authHeader || Array.isArray(authHeader)) {
    return null;
  }

  // Expected format: "Bearer <token>"
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1] || null;
};

// JWT Authentication Middleware
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const token = extractToken(req.headers.authorization as string | undefined);

    if (!token) {
      throw new UnauthorizedError('Access token is required');
    }

    // Verify JWT token
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET, {
        issuer: 'hucares-api',
        audience: 'hucares-app',
      }) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      } else {
        throw new UnauthorizedError('Token verification failed');
      }
    }

    // Find user in database
    const user = await db.user.findUnique({
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
      throw new UnauthorizedError('User not found or inactive');
    }

    // Attach user to request object
    req.user = user;

    logger.debug(`🔑 Authenticated user: ${user.username}`);
    next();

  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      logger.error('Authentication middleware error:', error);
      next(new UnauthorizedError('Authentication failed'));
    }
  }
};

// Optional authentication middleware (doesn't throw if no token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = extractToken(req.headers.authorization);

    if (!token) {
      // No token provided, continue without authentication
      next();
      return;
    }

    // Verify token if provided
    const payload = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'hucares-api',
      audience: 'hucares-app',
    }) as JWTPayload;

    // Find user
    const user = await db.user.findUnique({
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
      logger.debug(`🔑 Optionally authenticated user: ${user.username}`);
    }

    next();

  } catch (error) {
    // On optional auth, continue even if token is invalid
    logger.debug('Optional authentication failed, continuing without auth:', error);
    next();
  }
};

// Role-based authorization middleware
export const requireRole = (role: 'ADMIN') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      // For now, we'll implement admin check based on username
      // In a more complex system, you'd have role-based permissions
      const isAdmin = req.user.username === 'admin' || req.user.username.endsWith('-admin');

      if (role === 'ADMIN' && !isAdmin) {
        throw new UnauthorizedError('Admin access required');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Refresh token middleware (for future implementation)
export const validateRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // This would be implemented when we add refresh token functionality
  // For now, just pass through
  next();
};

export default {
  authenticateToken,
  optionalAuth,
  requireRole,
  validateRefreshToken,
}; 