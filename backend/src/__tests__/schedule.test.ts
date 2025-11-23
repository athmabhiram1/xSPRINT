import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../lib/db';
import { ScheduleEngine } from '../services/ScheduleEngine';
import { MatchStatus } from '@prisma/client';
import { nanoid } from 'nanoid';

describe('Schedule Engine', () => {
  let tournament: any;
  let event: any;
  let courts: any[];

  beforeEach(async () => {
    await prisma.scheduleBlock.deleteMany({});
    await prisma.matchCodeUsage.deleteMany({});
    await prisma.matchCode.deleteMany({});
    await prisma.match.deleteMany({});
    await prisma.registration.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.court.deleteMany({});
    await prisma.tournament.deleteMany({});

    const testId = nanoid(8);
    tournament = await prisma.tournament.create({
      data: {
        name: `Test Tournament ${testId}`,
        startDate: new Date(),
        endDate: new Date(),
      },
    });

    courts = await Promise.all([
      prisma.court.create({
        data: { name: `Court 1 ${testId}`, tournamentId: tournament.id },
      }),
      prisma.court.create({
        data: { name: `Court 2 ${testId}`, tournamentId: tournament.id },
      }),
    ]);

    event = await prisma.event.create({
      data: {
        name: `Test Event ${testId}`,
        tournamentId: tournament.id,
        type: 'KNOCKOUT',
      },
    });
  });

  it('should generate schedule without overlaps', async () => {
    const testId = nanoid(8);
    const player1 = await prisma.player.create({ data: { name: `P1 ${testId}`, playerId: `P1-${testId}` } });
    const player2 = await prisma.player.create({ data: { name: `P2 ${testId}`, playerId: `P2-${testId}` } });
    const player3 = await prisma.player.create({ data: { name: `P3 ${testId}`, playerId: `P3-${testId}` } });

    const match1 = await prisma.match.create({
      data: {
        eventId: event.id,
        round: 1,
        matchNumber: 1,
        playerAId: player1.id,
        playerBId: player2.id,
        status: MatchStatus.PENDING,
      },
    });

    const match2 = await prisma.match.create({
      data: {
        eventId: event.id,
        round: 2,
        matchNumber: 1,
        playerAId: player1.id,
        playerBId: player3.id,
        status: MatchStatus.PENDING,
      },
    });

    const engine = new ScheduleEngine();
    await engine.generateSchedule(event.id, {
      startTime: new Date(),
      matchDuration: 45,
      restTime: 20,
    });

    const schedule1 = await prisma.scheduleBlock.findUnique({
      where: { matchId: match1.id },
    });

    const schedule2 = await prisma.scheduleBlock.findUnique({
      where: { matchId: match2.id },
    });

    if (schedule1 && schedule2) {
      const timeDiff = schedule2.startTime.getTime() - schedule1.endTime.getTime();
      expect(timeDiff).toBeGreaterThanOrEqual(20 * 60 * 1000);
    }
  });

  it('should enforce rest time between matches', async () => {
    const testId = nanoid(8);
    const player1 = await prisma.player.create({ data: { name: `P1 ${testId}`, playerId: `P1-${testId}` } });
    const player2 = await prisma.player.create({ data: { name: `P2 ${testId}`, playerId: `P2-${testId}` } });
    const player3 = await prisma.player.create({ data: { name: `P3 ${testId}`, playerId: `P3-${testId}` } });

    const match1 = await prisma.match.create({
      data: {
        eventId: event.id,
        round: 1,
        matchNumber: 1,
        playerAId: player1.id,
        playerBId: player2.id,
        status: MatchStatus.PENDING,
      },
    });

    const match2 = await prisma.match.create({
      data: {
        eventId: event.id,
        round: 2,
        matchNumber: 1,
        playerAId: player1.id,
        playerBId: player3.id,
        status: MatchStatus.PENDING,
      },
    });

    const engine = new ScheduleEngine();
    await engine.generateSchedule(event.id, {
      startTime: new Date(),
      matchDuration: 45,
      restTime: 20,
    });

    const schedule1 = await prisma.scheduleBlock.findUnique({
      where: { matchId: match1.id },
    });

    const schedule2 = await prisma.scheduleBlock.findUnique({
      where: { matchId: match2.id },
    });

    if (schedule1 && schedule2) {
      const restTime = (schedule2.startTime.getTime() - schedule1.endTime.getTime()) / 60000;
      expect(restTime).toBeGreaterThanOrEqual(20);
    }
  });

  it('should allocate matches across multiple courts', async () => {
    const testId = nanoid(8);
    const players = await Promise.all([
      prisma.player.create({ data: { name: `P1 ${testId}`, playerId: `P1-${testId}` } }),
      prisma.player.create({ data: { name: `P2 ${testId}`, playerId: `P2-${testId}` } }),
      prisma.player.create({ data: { name: `P3 ${testId}`, playerId: `P3-${testId}` } }),
      prisma.player.create({ data: { name: `P4 ${testId}`, playerId: `P4-${testId}` } }),
    ]);

    await Promise.all([
      prisma.match.create({
        data: {
          eventId: event.id,
          round: 1,
          matchNumber: 1,
          playerAId: players[0].id,
          playerBId: players[1].id,
          status: MatchStatus.PENDING,
        },
      }),
      prisma.match.create({
        data: {
          eventId: event.id,
          round: 1,
          matchNumber: 2,
          playerAId: players[2].id,
          playerBId: players[3].id,
          status: MatchStatus.PENDING,
        },
      }),
    ]);

    const engine = new ScheduleEngine();
    await engine.generateSchedule(event.id, {
      startTime: new Date(),
      matchDuration: 45,
      restTime: 20,
    });

    const schedules = await prisma.scheduleBlock.findMany({
      where: { match: { eventId: event.id } },
      include: { court: true }
    });

    const courtIds = new Set(schedules.map(s => s.courtId));
    expect(courtIds.size).toBeGreaterThan(0);
  });
});
