import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { fail } from '../utils/responseFormatter';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(fail(err.message));
  }

  if (err instanceof ZodError) {
    const errors: Record<string, string> = {};
    err.issues.forEach((issue) => {
      const path = issue.path.join('.');
      errors[path] = issue.message;
    });
    return res.status(400).json(fail('Validation failed'));
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json(fail('Record already exists'));
      case 'P2025':
        return res.status(404).json(fail('Record not found'));
      case 'P2003':
        return res.status(400).json(fail('Invalid reference'));
      case 'P2014':
        return res.status(400).json(fail('Cannot delete record with existing relations'));
      default:
        return res.status(400).json(fail('Database operation failed'));
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json(fail('Invalid data provided'));
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(fail('Invalid authentication token'));
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(fail('Authentication token expired'));
  }

  const statusCode = 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Something went wrong';

  return res.status(statusCode).json(fail(message));
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json(fail(`Route ${req.method} ${req.originalUrl} not found`));
}
