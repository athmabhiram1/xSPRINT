// backend/src/services/FixtureEngine.ts

import { PrismaClient, MatchStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Type for internal player representation
interface PlayerEntry {
  id: string;
  clubId: string | null;
  seed: number | null;
}

export class FixtureEngine {

  /**
   * MAIN ENTRY POINT
   * Supports: KNOCKOUT (mandatory) + ROUND ROBIN
   */
  async generateFixtures(eventId: string, format: 'KNOCKOUT' | 'ROUND_ROBIN' = 'KNOCKOUT') {
    // Clear old matches (avoid duplicates)
    await prisma.match.deleteMany({ where: { eventId } });

    // Fetch player registrations
    const registrations = await prisma.registration.findMany({
      where: { eventId },
      include: { player: true },
      orderBy: { seed: 'asc' }
    });

    if (registrations.length < 2) {
      throw new Error("At least 2 players required.");
    }

    const players: PlayerEntry[] = registrations.map(r => ({
      id: r.player.id,
      clubId: r.player.clubId,
      seed: r.seed
    }));

    // Delegate based on format
    if (format === 'ROUND_ROBIN') {
      return this.generateRoundRobin(eventId, players);
    }
    return this.generateKnockout(eventId, players);
  }

  // ============================================================
  // 🟨 ROUND ROBIN FIXTURE GENERATION (Berger Algorithm)
  // ============================================================
  private async generateRoundRobin(eventId: string, players: PlayerEntry[]) {
    let numPlayers = players.length;
    const isOdd = numPlayers % 2 !== 0;

    // If odd, add a BYE player
    if (isOdd) {
      players.push({ id: "BYE", clubId: null, seed: null });
      numPlayers++;
    }

    const totalRounds = numPlayers - 1;
    const half = numPlayers / 2;
    const rounds: any[] = [];
    let rotation = [...players];

    for (let round = 0; round < totalRounds; round++) {
      const matches = [];

      for (let i = 0; i < half; i++) {
        const p1 = rotation[i];
        const p2 = rotation[numPlayers - 1 - i];

        if (p1.id !== "BYE" && p2.id !== "BYE") {
          matches.push({
            eventId,
            round: round + 1,
            matchNumber: i + 1,
            playerAId: p1.id,
            playerBId: p2.id,
            status: MatchStatus.PENDING
          });
        }
      }

      rounds.push({ round: round + 1, matches });

      // Rotate players except first
      const fixed = rotation[0];
      const rotating = rotation.slice(1);
      rotating.unshift(rotating.pop()!);
      rotation = [fixed, ...rotating];
    }

    // Bulk insert matches
    const allMatches = rounds.flatMap(r => r.matches);
    await prisma.match.createMany({ data: allMatches });

    return {
      type: "ROUND_ROBIN",
      totalRounds,
      totalMatches: allMatches.length
    };
  }

  // ============================================================
  // 🟥 KNOCKOUT FIXTURE GENERATION
  // ============================================================
  private async generateKnockout(eventId: string, players: (PlayerEntry | null)[]) {
    const totalPlayers = players.length;

    // Power-of-2 bracket size
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(totalPlayers)));
    const totalRounds = Math.log2(bracketSize);

    // Pad with BYEs
    while (players.length < bracketSize) {
      players.push(null);
    }

    // Smart seeding + club avoidance
    players = this.distributeWithClubAvoidance(players);

    // Top-down match generation storage
    const matchMap: Record<number, Record<number, string>> = {};

    // FINAL → SEMI → QUARTER → ROUND 1
    for (let round = totalRounds; round >= 1; round--) {
      const matchCount = Math.pow(2, totalRounds - round);
      matchMap[round] = {};

      for (let m = 0; m < matchCount; m++) {
        let nextMatchId: string | null = null;

        if (round < totalRounds) {
          const parentIdx = Math.floor(m / 2);
          nextMatchId = matchMap[round + 1][parentIdx];
        }

        let playerAId: string | null = null;
        let playerBId: string | null = null;
        let status: MatchStatus = MatchStatus.PENDING;
        let winnerId: string | null = null;

        // Round 1 gets real players
        if (round === 1) {
          const p1 = players[m * 2];
          const p2 = players[m * 2 + 1];

          playerAId = p1 ? p1.id : null;
          playerBId = p2 ? p2.id : null;

          if (p1 && !p2) {
            winnerId = p1.id;
            status = MatchStatus.COMPLETED;
          } else if (!p1 && p2) {
            winnerId = p2.id;
            status = MatchStatus.COMPLETED;
          } else if (!p1 && !p2) {
            status = MatchStatus.CANCELLED;
          }
        }

        const match = await prisma.match.create({
          data: {
            eventId,
            round,
            matchNumber: m + 1,
            nextMatchId,
            playerAId,
            playerBId,
            winnerId,
            status
          }
        });

        matchMap[round][m] = match.id;

        if (winnerId && nextMatchId) {
          await this.propagateWinner(match.id, winnerId);
        }
      }
    }

    return {
      type: "KNOCKOUT",
      totalRounds,
      totalMatches: Object.values(matchMap).flat().length
    };
  }

  // ============================================================
  // 🟦 CLUB AVOIDANCE SEEDING
  // ============================================================
  private distributeWithClubAvoidance(players: (PlayerEntry | null)[]): (PlayerEntry | null)[] {
    const real = players.filter(p => p !== null) as PlayerEntry[];
    const byes = players.length - real.length;

    // Sort by club → seed
    real.sort((a, b) => {
      if (a.clubId !== b.clubId) {
        return (a.clubId || "").localeCompare(b.clubId || "");
      }
      return (a.seed || 999) - (b.seed || 999);
    });

    // Interleave (top-bottom zigzag)
    const result: (PlayerEntry | null)[] = [];
    let L = 0, R = real.length - 1;
    while (L <= R) {
      if (L === R) result.push(real[L]);
      else {
        result.push(real[L]);
        result.push(real[R]);
      }
      L++;
      R--;
    }

    // Add byes
    for (let i = 0; i < byes; i++) result.push(null);

    return result;
  }

  // ============================================================
  // 🟧 PROPAGATE WINNER TO NEXT MATCH
  // ============================================================
  async propagateWinner(matchId: string, winnerId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { nextMatch: true }
    });

    if (!match || !match.nextMatchId) return;

    const targetSlotA = match.matchNumber % 2 !== 0;

    const update: any = targetSlotA
      ? { playerAId: winnerId }
      : { playerBId: winnerId };

    const nm = await prisma.match.findUnique({
      where: { id: match.nextMatchId }
    });

    const slotA = targetSlotA ? winnerId : nm?.playerAId;
    const slotB = !targetSlotA ? winnerId : nm?.playerBId;

    if (slotA && slotB) {
      update.status = MatchStatus.PENDING;
    }

    await prisma.match.update({
      where: { id: match.nextMatchId },
      data: update
    });
  }
}
