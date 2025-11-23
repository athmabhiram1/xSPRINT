import { Request, Response } from 'express';
import { prisma } from '../lib/db';
import { ScheduleEngine } from '../services/ScheduleEngine';
import { asyncHandler } from '../middlewares/asyncHandler';
import { ok, fail } from '../utils/responseFormatter';
import { AuthRequest } from '../middlewares/auth';
import { validateParams, validateBody, scheduleGenerationSchema } from '../utils/validation';
import { z } from 'zod';
import { invalidateCache } from '../utils/cache';
import { logInfo, logError } from '../utils/logger';

const scheduleEngine = new ScheduleEngine();

const eventIdParamSchema = z.object({
  id: z.string().uuid('Invalid event ID format'),
});

export const generateSchedule = [
  validateParams(eventIdParamSchema),
  validateBody(scheduleGenerationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { startTime, matchDuration, restTime, changeover } = req.body;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        tournament: {
          include: { courts: true }
        }
      }
    });

    if (!event) {
      return res.status(404).json(fail('Event not found'));
    }

    if (!event.tournament.courts || event.tournament.courts.length === 0) {
      return res.status(400).json(fail('No courts available for this tournament'));
    }

    const matchCount = await prisma.match.count({ where: { eventId: id } });

    if (matchCount === 0) {
      return res.status(400).json(fail('No matches found. Generate fixtures first'));
    }

    try {
      const result = await scheduleEngine.generateSchedule(id, {
        startTime: startTime ? new Date(startTime) : undefined,
        matchDuration,
        restTime,
        changeover
      });

      invalidateCache(`event:${id}:*`);
      invalidateCache(`schedule:*`);
      logInfo('Schedule generated', { eventId: id, scheduled: result.scheduled });

      return res.json(ok(result));
    } catch (error: any) {
      logError(error, { eventId: id });
      if (error.message.includes('not found')) {
        return res.status(404).json(fail(error.message));
      }
      throw error;
    }
  })
];

export const rescheduleMatch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { startTime, courtId } = req.body;

  if (!id || !startTime || !courtId) {
    return res.status(400).json(fail('Match ID, startTime, and courtId are required'));
  }

  const result = await scheduleEngine.rescheduleMatch(id, new Date(startTime), courtId);

  return res.json(ok(result));
});

export const withdrawMatch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { playerId } = req.body;

  if (!id || !playerId) {
    return res.status(400).json(fail('Match ID and playerId are required'));
  }

  const result = await scheduleEngine.handleWithdrawal(id, playerId);

  return res.json(ok(result));
});
