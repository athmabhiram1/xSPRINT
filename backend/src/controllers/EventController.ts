import { Request, Response } from 'express';
import { prisma } from '../lib/db';
import { asyncHandler } from '../middlewares/asyncHandler';
import { ok, fail } from '../utils/responseFormatter';
import { validateBody, validateParams, eventSchema, registrationSchema } from '../utils/validation';
import { z } from 'zod';
import { getCached, getCacheKey, invalidateCache } from '../utils/cache';
import { logInfo, logError } from '../utils/logger';

const eventIdSchema = z.object({
  eventId: z.string().uuid('Invalid event ID format'),
});

const tournamentIdSchema = z.object({
  tournamentId: z.string().uuid('Invalid tournament ID format'),
});

export const createEvent = [
  validateBody(eventSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { tournamentId, name, sport, type, gender, category } = req.body;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true }
    });

    if (!tournament) {
      return res.status(404).json(fail('Tournament not found'));
    }

    try {
      const event = await prisma.event.create({
        data: {
          tournamentId,
          name: name.trim(),
          sport: sport?.toUpperCase() || 'BADMINTON',
          type: (type?.toUpperCase() as 'KNOCKOUT' | 'ROUND_ROBIN') || 'KNOCKOUT',
          gender: gender?.toUpperCase(),
          category: category?.toUpperCase()
        },
        include: {
          tournament: {
            select: {
              name: true,
              startDate: true,
              endDate: true
            }
          }
        }
      });

      invalidateCache(`tournament:${tournamentId}:*`);
      logInfo('Event created', { eventId: event.id, tournamentId, name });

      return res.status(201).json(ok(event));
    } catch (error: any) {
      logError(error, { tournamentId, name });
      throw error;
    }
  })
];

export const getAllEvents = asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = getCacheKey('events', 'all');
  
  const events = await getCached(cacheKey, async () => {
    return prisma.event.findMany({
      include: {
        _count: {
          select: {
            registrations: true,
            matches: true
          }
        },
        tournament: {
          select: {
            name: true,
            startDate: true,
            endDate: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }, 60);

  return res.json(ok(events));
});

export const getEventsByTournament = [
  validateParams(tournamentIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { tournamentId } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true }
    });

    if (!tournament) {
      return res.status(404).json(fail('Tournament not found'));
    }

    const cacheKey = getCacheKey('events', 'tournament', tournamentId);
    
    const events = await getCached(cacheKey, async () => {
      return prisma.event.findMany({
        where: { tournamentId },
        include: {
          _count: {
            select: {
              registrations: true,
              matches: true
            }
          },
          tournament: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });
    }, 120);

    return res.json(ok(events));
  })
];

export const registerPlayerToEvent = [
  validateBody(registrationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { eventId, playerId, seed } = req.body;

    const [event, player] = await Promise.all([
      prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, type: true }
      }),
      prisma.player.findUnique({
        where: { id: playerId },
        select: { id: true }
      })
    ]);

    if (!event) {
      return res.status(404).json(fail('Event not found'));
    }

    if (!player) {
      return res.status(404).json(fail('Player not found'));
    }

    const existingRegistration = await prisma.registration.findUnique({
      where: {
        eventId_playerId: { eventId, playerId }
      }
    });

    if (existingRegistration) {
      return res.status(409).json(fail('Player is already registered for this event'));
    }

    const matchExists = await prisma.match.findFirst({
      where: {
        eventId,
        status: { in: ['SCHEDULED', 'ONGOING', 'COMPLETED'] }
      },
      select: { id: true }
    });

    if (matchExists) {
      return res.status(400).json(fail('Cannot register player: matches have already been scheduled'));
    }

    try {
      const registration = await prisma.registration.create({
        data: {
          eventId,
          playerId,
          seed: seed || null
        },
        include: {
          player: {
            include: {
              club: true
            }
          },
          event: {
            select: {
              name: true,
              sport: true,
              type: true
            }
          }
        }
      });

      invalidateCache(`event:${eventId}:*`);
      invalidateCache(`events:*`);
      logInfo('Player registered to event', { eventId, playerId, seed });

      return res.status(201).json(ok(registration));
    } catch (error: any) {
      logError(error, { eventId, playerId });
      throw error;
    }
  })
];

export const getEventRegistrations = [
  validateParams(eventIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true }
    });

    if (!event) {
      return res.status(404).json(fail('Event not found'));
    }

    const cacheKey = getCacheKey('registrations', 'event', eventId);
    
    const registrations = await getCached(cacheKey, async () => {
      return prisma.registration.findMany({
        where: { eventId },
        include: {
          player: {
            include: {
              club: true
            }
          },
          event: {
            select: {
              name: true,
              sport: true
            }
          }
        },
        orderBy: [
          { seed: 'asc' },
          { player: { name: 'asc' } }
        ]
      });
    }, 60);

    return res.json(ok(registrations));
  })
];
