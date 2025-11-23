import { Response } from 'express';
import { prisma } from '../lib/db';
import { ScheduleEngine } from '../services/ScheduleEngine';
import { asyncHandler } from '../middlewares/asyncHandler';
import { ok, fail } from '../utils/responseFormatter';
import { AuthRequest } from '../middlewares/auth';
import { MatchStatus } from '@prisma/client';

const scheduleEngine = new ScheduleEngine();

export const getEventAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json(fail('Event ID is required'));
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      tournament: {
        include: { courts: true }
      },
      matches: {
        include: {
          schedule: { include: { court: true } },
          playerA: { include: { club: true } },
          playerB: { include: { club: true } }
        }
      }
    }
  });

  if (!event) {
    return res.status(404).json(fail('Event not found'));
  }

  try {
    const metrics = await scheduleEngine.getSchedulingMetrics(id);

    const totalMatches = event.matches.length;
    const completedMatches = event.matches.filter(m => m.status === MatchStatus.COMPLETED).length;
    const inProgressMatches = event.matches.filter(m => m.status === MatchStatus.ONGOING).length;
    const scheduledMatches = event.matches.filter(m => m.status === MatchStatus.SCHEDULED).length;
    const pendingMatches = event.matches.filter(m => m.status === MatchStatus.PENDING).length;

    return res.json(ok({
      eventId: id,
      eventName: event.name,
      totalMatches,
      completedMatches,
      inProgressMatches,
      scheduledMatches,
      pendingMatches,
      courtUtilization: metrics.courtUtilization,
      restTimeViolations: metrics.restTimeViolations,
      sameClubMatchCount: metrics.sameClubMatchCount,
      restTimeViolationCount: metrics.restTimeViolations.length
    }));
  } catch (error: any) {
    return res.status(500).json(fail('Failed to fetch analytics'));
  }
});

