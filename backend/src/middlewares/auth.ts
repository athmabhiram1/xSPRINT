import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth';
import { Role } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: Role;
    email: string;
    name: string;
  } | null;
}

interface JwtPayload {
  userId: string;
  role: Role;
  email: string;
  name: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.[authConfig.cookieName];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, authConfig.jwtSecret) as JwtPayload;

    req.user = {
      id: decoded.userId,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name,
    };

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }
  next();
};

export const requireRole = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};
