import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../lib/db';
import { MatchCodeService } from '../services/MatchCodeService';
import { Role, MatchStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

describe('Match Code Service', () => {
  let tournament: any;
  let event: any;
  let match: any;
  let umpire: any;

  beforeEach(async () => {
    await prisma.matchCodeUsage.deleteMany({});
    await prisma.matchCode.deleteMany({});
    await prisma.scheduleBlock.deleteMany({});
    await prisma.match.deleteMany({});
    await prisma.registration.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.court.deleteMany({});
    await prisma.tournament.deleteMany({});
    await prisma.user.deleteMany({});
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
        type: 'KNOCKOUT',
      },
    });

    const player1 = await prisma.player.create({ data: { name: `P1 ${testId}`, playerId: `P1-${testId}` } });
    const player2 = await prisma.player.create({ data: { name: `P2 ${testId}`, playerId: `P2-${testId}` } });

    match = await prisma.match.create({
      data: {
        eventId: event.id,
        round: 1,
        matchNumber: 1,
        playerAId: player1.id,
        playerBId: player2.id,
        status: MatchStatus.PENDING,
      },
    });

    umpire = await prisma.user.create({
      data: {
        name: `Umpire ${testId}`,
        email: `umpire-${testId}@test.com`,
        passwordHash: await bcrypt.hash('password', 10),
        role: Role.UMPIRE,
      },
    });
  });

  it('should generate 6-digit match code', async () => {
    const service = new MatchCodeService();
    const code = await service.generateCodeForMatch(match.id, umpire.id);

    expect(code).toBeDefined();
    expect(code.length).toBe(6);
    expect(Number(code)).toBeGreaterThan(0);

    const matchCode = await prisma.matchCode.findUnique({
      where: { matchId: match.id },
    });

    expect(matchCode).toBeDefined();
    expect(matchCode?.assignedUmpireId).toBe(umpire.id);
  });

  it('should verify correct code', async () => {
    const service = new MatchCodeService();
    const code = await service.generateCodeForMatch(match.id, umpire.id);

    const isValid = await service.verifyCode(match.id, code, umpire.id);

    expect(isValid).toBe(true);
  });

  it('should reject incorrect code', async () => {
    const service = new MatchCodeService();
    await service.generateCodeForMatch(match.id, umpire.id);

    const isValid = await service.verifyCode(match.id, '000000', umpire.id);

    expect(isValid).toBe(false);
  });

  it('should reject code after match completion', async () => {
    const service = new MatchCodeService();
    const code = await service.generateCodeForMatch(match.id, umpire.id);

    await prisma.match.update({
      where: { id: match.id },
      data: { status: MatchStatus.COMPLETED },
    });

    await expect(
      service.verifyCode(match.id, code, umpire.id)
    ).rejects.toThrow();
  });

  it('should only allow assigned umpire to verify', async () => {
    const testId = nanoid(8);
    const otherUmpire = await prisma.user.create({
      data: {
        name: `Other Umpire ${testId}`,
        email: `other-${testId}@test.com`,
        passwordHash: await bcrypt.hash('password', 10),
        role: Role.UMPIRE,
      },
    });

    const service = new MatchCodeService();
    const code = await service.generateCodeForMatch(match.id, umpire.id);

    const isValid = await service.verifyCode(match.id, code, otherUmpire.id);

    expect(isValid).toBe(false);
  });
});
