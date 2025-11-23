import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../lib/db';
import { FixtureEngine } from '../services/FixtureEngineEnhanced';
import { MatchStatus } from '@prisma/client';
import { nanoid } from 'nanoid';

describe('Fixture Engine', () => {
  let tournament: any;
  let event: any;
  let players: any[];

  beforeEach(async () => {
    await prisma.scheduleBlock.deleteMany({});
    await prisma.matchCodeUsage.deleteMany({});
    await prisma.matchCode.deleteMany({});
    await prisma.match.deleteMany({});
    await prisma.registration.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.court.deleteMany({});
    await prisma.tournament.deleteMany({});
    await prisma.player.deleteMany({});
    await prisma.club.deleteMany({});

    const testId = nanoid(8);
    const club1 = await prisma.club.create({ data: { name: `Club A ${testId}` } });
    const club2 = await prisma.club.create({ data: { name: `Club B ${testId}` } });

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
        type: 'KNOCKOUT',
      },
    });

    players = await Promise.all([
      prisma.player.create({ data: { name: `Player 1 ${testId}`, playerId: `P1-${testId}` } }),
      prisma.player.create({ data: { name: `Player 2 ${testId}`, playerId: `P2-${testId}`, clubId: club1.id } }),
      prisma.player.create({ data: { name: `Player 3 ${testId}`, playerId: `P3-${testId}`, clubId: club2.id } }),
      prisma.player.create({ data: { name: `Player 4 ${testId}`, playerId: `P4-${testId}`, clubId: club2.id } }),
    ]);

    for (let i = 0; i < players.length; i++) {
      await prisma.registration.create({
        data: {
          eventId: event.id,
          playerId: players[i].id,
          seed: i + 1,
        },
      });
    }
  });

  it('should generate knockout fixtures with correct match count', async () => {
    const engine = new FixtureEngine();
    const result = await engine.generateFixtures(event.id, 'knockout');

    expect(result.format).toBe('knockout');
    expect(result.matches.length).toBeGreaterThan(0);

    const matches = await prisma.match.findMany({ where: { eventId: event.id } });
    expect(matches.length).toBe(3);

    const round1Matches = matches.filter(m => m.round === 1);
    expect(round1Matches.length).toBe(2);
  });

  it('should minimize same-club matchups in round 1', async () => {
    const engine = new FixtureEngine();
    await engine.generateFixtures(event.id, 'knockout');

    const round1Matches = await prisma.match.findMany({
      where: { eventId: event.id, round: 1 },
      include: {
        playerA: { include: { club: true } },
        playerB: { include: { club: true } }
      }
    });

    let sameClubCount = 0;
    for (const match of round1Matches) {
      if (match.playerA?.clubId && match.playerB?.clubId &&
        match.playerA.clubId === match.playerB.clubId) {
        sameClubCount++;
      }
    }

    expect(sameClubCount).toBeLessThanOrEqual(1);
  });

  it('should generate round robin fixtures', async () => {
    const engine = new FixtureEngine();
    const result = await engine.generateFixtures(event.id, 'roundrobin');

    expect(result.format).toBe('roundrobin');
    expect(result.matches.length).toBeGreaterThan(0);

    const matches = await prisma.match.findMany({ where: { eventId: event.id } });
    expect(matches.length).toBeGreaterThan(0);
  });

  it('should handle BYE allocation correctly', async () => {
    const testId = nanoid(8);
    const player5 = await prisma.player.create({ data: { name: `Player 5 ${testId}`, playerId: `P5-${testId}` } });
    await prisma.registration.create({
      data: {
        eventId: event.id,
        playerId: player5.id,
        seed: 5,
      },
    });

    const engine = new FixtureEngine();
    const result = await engine.generateFixtures(event.id, 'knockout');

    expect(result.metrics).toBeDefined();

    const matches = await prisma.match.findMany({
      where: { eventId: event.id, round: 1 }
    });

    const byeMatches = matches.filter(m => !m.playerAId || !m.playerBId);
    expect(byeMatches.length).toBeGreaterThan(0);
  });

  it('should propagate winners correctly', async () => {
    const engine = new FixtureEngine();
    await engine.generateFixtures(event.id, 'knockout');

    const round1Matches = await prisma.match.findMany({
      where: { eventId: event.id, round: 1 },
    });

    const firstMatch = round1Matches[0];
    if (firstMatch.playerAId) {
      await engine.propagateWinner(firstMatch.id, firstMatch.playerAId);

      const nextMatch = await prisma.match.findUnique({
        where: { id: firstMatch.nextMatchId! },
      });

      expect(nextMatch?.playerAId).toBe(firstMatch.playerAId);
    }
  });
});
