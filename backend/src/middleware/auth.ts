import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth';
import { Role } from '@prisma/client';

/**
 * Extended Request interface with user information
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: Role;
    email: string;
  } | null;
}

/**
 * JWT Payload structure
 */
interface JwtPayload {
  userId: string;
  role: Role;
  email: string;
}

/**
 * Global authentication middleware
 * 
 * Reads JWT from cookie, verifies it, and attaches user info to req.user.
 * Does NOT reject requests if token is missing/invalid - allows public endpoints.
 * Use requireAuth or requireRole to enforce authentication.
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Read token from cookie
    const token = req.cookies?.[authConfig.cookieName];

    if (!token) {
      req.user = null;
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, authConfig.jwtSecret) as JwtPayload;

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (error) {
    // Invalid token - treat as unauthenticated
    req.user = null;
    next();
  }
};

/**
 * Middleware to require authentication
 * 
 * Returns 401 if user is not authenticated.
 */
export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentication required',
      message: 'You must be logged in to access this resource',
    });
    return;
  }
  next();
};

/**
 * Middleware to require specific role(s)
 * 
 * Returns 403 if user doesn't have one of the required roles.
 * Automatically requires authentication.
 */
export const requireRole = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        message: `This resource requires one of the following roles: ${roles.join(', ')}`,
        userRole: req.user.role,
      });
      return;
    }

    next();
  };
};

/**
 * Legacy middleware for backward compatibility
 * @deprecated Use requireAuth instead
 */
export const protect = requireAuth;

/**
 * Legacy middleware for backward compatibility
 * @deprecated Use requireRole instead
 */
export const authorize = (...roles: string[]) => {
  return requireRole(...(roles as Role[]));
};