import { Request, Response } from 'express';
import { prisma } from '../lib/db';
import { MatchStatus } from '@prisma/client';
import { FixtureEngine } from '../services/FixtureEngineEnhanced';
import { MatchCodeService } from '../services/MatchCodeService';
import { asyncHandler } from '../middlewares/asyncHandler';
import { ok, fail } from '../utils/responseFormatter';
import { AuthRequest } from '../middlewares/auth';
import { validateBody, matchResultSchema } from '../utils/validation';
import { invalidateCache } from '../utils/cache';
import { logInfo, logError } from '../utils/logger';

const codeService = new MatchCodeService();
const fixtureEngine = new FixtureEngine();

export const submitMatchResult = [
  validateBody(matchResultSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { matchId, matchCode, score, winnerId } = req.body;

    if (!req.user) {
      return res.status(401).json(fail('Authentication required'));
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true, status: true, eventId: true }
    });

    if (!match) {
      return res.status(404).json(fail('Match not found'));
    }

    if (match.status === MatchStatus.COMPLETED) {
      return res.status(400).json(fail('Match already completed'));
    }

    if (match.status !== MatchStatus.PENDING && match.status !== MatchStatus.SCHEDULED) {
      return res.status(400).json(fail('Invalid match status'));
    }

    const isValid = await codeService.verifyCode(matchId, matchCode, req.user.id, req.ip);

    if (!isValid) {
      return res.status(403).json(fail('Invalid or expired match code'));
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.match.update({
        where: { id: matchId },
        data: {
          score,
          winnerId,
          status: MatchStatus.COMPLETED,
          endTime: new Date(),
        }
      });

      await tx.matchCode.update({
        where: { matchId },
        data: { isActive: false, expiresAt: new Date() }
      });

      await tx.matchResultAudit.create({
        data: {
          matchId,
          actorId: req.user!.id,
          action: 'SUBMIT_RESULT',
          payload: {
            winnerId,
            score,
            timestamp: new Date().toISOString(),
            ip: req.ip
          }
        }
      });
    });

    await fixtureEngine.propagateWinner(matchId, winnerId);

    invalidateCache(`match:${matchId}:*`);
    invalidateCache(`event:${match.eventId}:*`);
    invalidateCache(`leaderboard:*`);

    logInfo('Match result submitted', { matchId, winnerId, eventId: match.eventId, userId: req.user.id });

    return res.json(ok({ success: true }));
  })
];

export const validateMatchCode = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { matchId, code } = req.body;

  if (!matchId || !code) {
    return res.status(400).json(fail('Match ID and code are required'));
  }

  if (!req.user) {
    return res.status(401).json(fail('Authentication required'));
  }

  const isValid = await codeService.verifyCode(matchId, code, req.user.id, req.ip);

  if (!isValid) {
    return res.status(403).json(fail('Invalid or expired match code'));
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      playerA: { include: { club: true } },
      playerB: { include: { club: true } },
      winner: true,
      schedule: { include: { court: true } },
      event: true
    }
  });

  if (!match) {
    return res.status(404).json(fail('Match not found'));
  }

  return res.json(ok(match));
});

export const generateMatchCode = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { assignedUmpireId } = req.body;

  if (!id || !assignedUmpireId) {
    return res.status(400).json(fail('Match ID and assignedUmpireId are required'));
  }

  const rawCode = await codeService.generateCodeForMatch(id, assignedUmpireId);

  const umpire = await prisma.user.findUnique({
    where: { id: assignedUmpireId },
    select: { id: true, name: true, email: true, role: true }
  });

  const matchCode = await prisma.matchCode.findUnique({
    where: { matchId: id },
    select: { expiresAt: true }
  });

  return res.json(ok({
    matchCode: rawCode,
    assignedUmpire: umpire,
    expiresAt: matchCode?.expiresAt
  }));
});

export const getMatch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      playerA: { include: { club: true } },
      playerB: { include: { club: true } },
      winner: true,
      schedule: { include: { court: true } },
      event: true
    }
  });

  if (!match) {
    return res.status(404).json(fail('Match not found'));
  }

  return res.json(ok(match));
});
