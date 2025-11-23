import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../lib/db';
import { LeaderboardService } from '../services/LeaderboardService';
import { MatchStatus } from '@prisma/client';
import { nanoid } from 'nanoid';

describe('Leaderboard Service', () => {
  let tournament: any;
  let event: any;
  let players: any[];
  let leaderboardService: LeaderboardService;

  beforeEach(async () => {
    leaderboardService = new LeaderboardService();

    await prisma.scheduleBlock.deleteMany({});
    await prisma.matchCodeUsage.deleteMany({});
    await prisma.matchCode.deleteMany({});
    await prisma.match.deleteMany({});
    await prisma.registration.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.court.deleteMany({});
    await prisma.tournament.deleteMany({});
    await prisma.player.deleteMany({});

    const testId = nanoid(8);
    tournament = await prisma.tournament.create({
      data: {
        name: `Test Tournament ${testId}`,
        startDate: new Date(),
        endDate: new Date(),
      },
    });

    event = await prisma.event.create({
      data: {
        name: `Test Event ${testId}`,
        tournamentId: tournament.id,
        type: 'ROUND_ROBIN',
      },
    });

    players = await Promise.all([
      prisma.player.create({ data: { name: `Player 1 ${testId}`, playerId: `P1-${testId}` } }),
      prisma.player.create({ data: { name: `Player 2 ${testId}`, playerId: `P2-${testId}` } }),
    ]);

    for (const player of players) {
      await prisma.registration.create({
        data: {
          eventId: event.id,
          playerId: player.id,
        },
      });
    }
  });

  it('should generate event leaderboard for round robin', async () => {
    await prisma.match.create({
      data: {
        eventId: event.id,
        round: 1,
        matchNumber: 1,
        playerAId: players[0].id,
        playerBId: players[1].id,
        winnerId: players[0].id,
        status: MatchStatus.COMPLETED,
        score: { sets: [{ a: 21, b: 19 }] },
      },
    });

    const leaderboard = await leaderboardService.getEventLeaderboard(event.id);

    expect(leaderboard.format).toBe('ROUND_ROBIN');
    expect(leaderboard.roundRobin).toBeDefined();
    if (leaderboard.roundRobin) {
      expect(leaderboard.roundRobin.length).toBe(2);
      expect(leaderboard.roundRobin[0].wins).toBe(1);
    }
  });

  it('should generate event analytics', async () => {
    await prisma.match.create({
      data: {
        eventId: event.id,
        round: 1,
        matchNumber: 1,
        playerAId: players[0].id,
        playerBId: players[1].id,
        winnerId: players[0].id,
        status: MatchStatus.COMPLETED,
        score: { sets: [{ a: 21, b: 19 }, { a: 21, b: 15 }] },
      },
    });

    const analytics = await leaderboardService.getEventAnalytics(event.id);

    expect(analytics).toBeDefined();
    expect(analytics.totalMatches).toBe(1);
    expect(analytics.completedMatches).toBe(1);
  });
});
