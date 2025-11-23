import { z } from 'zod';
import { fail } from './responseFormatter';
import { Request, Response, NextFunction } from 'express';

export const eventSchema = z.object({
  tournamentId: z.string().uuid('Invalid tournament ID format'),
  name: z.string().min(1, 'Event name is required').max(200, 'Event name too long'),
  sport: z.enum(['BADMINTON', 'TENNIS', 'TABLE_TENNIS', 'PICKLEBALL', 'SQUASH']).optional(),
  type: z.enum(['KNOCKOUT', 'ROUND_ROBIN']).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'MIXED']).optional(),
  category: z.string().max(50).optional(),
});

export const registrationSchema = z.object({
  eventId: z.string().uuid('Invalid event ID format'),
  playerId: z.string().uuid('Invalid player ID format'),
  seed: z.number().int().positive().optional().nullable(),
});

export const fixtureGenerationSchema = z.object({
  type: z.enum(['knockout', 'roundrobin']).optional(),
  format: z.enum(['knockout', 'roundrobin']).optional(),
});

export const scheduleGenerationSchema = z.object({
  startTime: z.string().datetime().optional(),
  matchDuration: z.number().int().min(15).max(180).optional(),
  restTime: z.number().int().min(5).max(120).optional(),
  changeover: z.number().int().min(0).max(30).optional(),
});

export const matchResultSchema = z.object({
  matchId: z.string().uuid('Invalid match ID format'),
  code: z.string().length(6, 'Match code must be 6 digits'),
  winnerId: z.string().uuid('Invalid winner ID format'),
  score: z.object({
    sets: z.array(z.object({
      a: z.number().int().min(0),
      b: z.number().int().min(0),
    })).optional(),
    note: z.string().optional(),
  }).optional(),
});

export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body) as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json(fail(
          (error as any).errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
        ));
      }
      return res.status(400).json(fail('Invalid request body'));
    }
  };
}

export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json(fail(
          (error as any).errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
        ));
      }
      return res.status(400).json(fail('Invalid request parameters'));
    }
  };
}

export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json(fail(
          (error as any).errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
        ));
      }
      return res.status(400).json(fail('Invalid query parameters'));
    }
  };
}

