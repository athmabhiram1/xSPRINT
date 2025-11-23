import { prisma } from '../lib/db';
import { MatchStatus, Event } from '@prisma/client';

interface FixtureOptions {
  eventId: string;
  type: 'KNOCKOUT' | 'ROUND_ROBIN';
}

export class FixtureService {
  /**
   * Generate fixtures for an event
   */
  static async generateFixtures(options: FixtureOptions) {
    const { eventId, type } = options;

    // 1. Fetch event and registrations
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          include: { player: true },
          orderBy: { seed: 'asc' }, // Respect seeds if present
        },
      },
    });

    if (!event) throw new Error('Event not found');
    if (event.registrations.length < 2) throw new Error('Not enough players to generate fixtures');

    // 2. Clear existing matches
    await prisma.match.deleteMany({
      where: { eventId },
    });

    // 3. Generate based on type
    if (type === 'KNOCKOUT') {
      return this.generateKnockout(event, event.registrations);
    } else if (type === 'ROUND_ROBIN') {
      return this.generateRoundRobin(event, event.registrations);
    } else {
      throw new Error('Invalid fixture type');
    }
  }

  /**
   * Generate Knockout Draw
   */
  private static async generateKnockout(event: any, registrations: any[]) {
    const players = registrations.map(r => r.player);
    const count = players.length;
    
    // Calculate bracket size (next power of 2)
    const size = Math.pow(2, Math.ceil(Math.log2(count)));
    const byes = size - count;

    // Distribute BYEs and Players
    // Simple seeding logic: Top seeds placed far apart
    // For now, we'll use a standard distribution or random if unseeded
    
    // Create array of size, filled with null
    const draw: any[] = new Array(size).fill(null);

    // Place seeds (simplified for now - just fill in order)
    // TODO: Implement proper seed separation (1 vs 2 in final, 1 vs 4 in semis, etc.)
    
    // Fill draw with players
    // If we have seeds, they are already sorted.
    // We need to place them strategically.
    // For MVP: Just fill the array, but handle BYEs.
    // BYEs usually go to top seeds first.
    
    // Better approach:
    // 1. Create first round matches.
    // 2. If player vs BYE, player advances automatically.
    
    // Let's use a standard pairing algorithm
    // 1 vs size, 2 vs size-1, etc? No, that's for round robin.
    // Knockout: 1 vs unseeded, 2 vs unseeded.
    
    // Let's just fill the slots.
    // If we have byes, they effectively mean some matches in round 1 don't exist or are auto-win.
    
    // Actual Logic:
    // Round 1 has 'size / 2' matches.
    // We need to create the full tree structure.
    
    const totalRounds = Math.log2(size);
    const matches: any[] = [];

    // Helper to create match
    const createMatch = async (round: number, matchNum: number, pA: any, pB: any, nextMatchId?: string) => {
      const isByeA = !pA; // Should not happen in this logic if we fill correctly
      const isByeB = !pB; // Should not happen

      // If it's a BYE (player vs null), auto-advance?
      // In a proper draw, BYEs are handled by not creating a match or creating a match with one player that is instantly completed.
      // We will create a match with status COMPLETED if one is BYE? 
      // Actually, usually BYEs mean you start in Round 2.
      
      // Let's stick to: Create all matches for the bracket.
      // Leaf nodes are Round 1.
      
      return prisma.match.create({
        data: {
          eventId: event.id,
          round,
          matchNumber: matchNum,
          playerAId: pA?.id,
          playerBId: pB?.id,
          status: (pA && pB) ? MatchStatus.PENDING : MatchStatus.COMPLETED, // If missing player, it's a bye/auto-win
          winnerId: (pA && !pB) ? pA.id : (!pA && pB) ? pB.id : undefined, // Auto win if bye
          nextMatchId,
        }
      });
    };

    // We need to build the tree from Final (Round N) down to Round 1?
    // Or Round 1 up?
    // Easier to build structure first, then populate players.
    
    // 1. Create the structure (empty matches)
    // Round N (Final) -> Round N-1 (Semis) ... -> Round 1
    
    const roundMatches: Record<number, any[]> = {};
    
    // Create Final
    const finalMatch = await prisma.match.create({
      data: { eventId: event.id, round: totalRounds, matchNumber: 1, status: MatchStatus.PENDING }
    });
    roundMatches[totalRounds] = [finalMatch];

    // Create previous rounds linking to next
    for (let r = totalRounds - 1; r >= 1; r--) {
      roundMatches[r] = [];
      const nextRoundMatches = roundMatches[r + 1];
      
      for (const nextMatch of nextRoundMatches) {
        // Create 2 matches feeding into nextMatch
        const m1 = await prisma.match.create({
          data: { eventId: event.id, round: r, matchNumber: nextMatch.matchNumber * 2 - 1, nextMatchId: nextMatch.id, status: MatchStatus.PENDING }
        });
        const m2 = await prisma.match.create({
          data: { eventId: event.id, round: r, matchNumber: nextMatch.matchNumber * 2, nextMatchId: nextMatch.id, status: MatchStatus.PENDING }
        });
        roundMatches[r].push(m1, m2);
      }
    }

    // 2. Place players in Round 1
    const round1Matches = roundMatches[1];
    // Sort matches by matchNumber to fill in order
    round1Matches.sort((a, b) => a.matchNumber - b.matchNumber);

    // We have 'size' slots in Round 1 (2 slots per match).
    // We have 'count' players.
    // We have 'byes' empty slots.
    
    // Standard seeding placement (simplified):
    // 1 at top, 2 at bottom, etc.
    // For now, just fill sequentially with the sorted registrations (seeds first).
    // If we have byes, we should give them to top seeds.
    // i.e. Top seeds get a "match" against "null" in Round 1?
    // Actually, if we built the full tree of size 2^N, Round 1 has size/2 matches.
    // Total slots = size.
    
    // Let's distribute players into the slots.
    // Slots: [Match1.A, Match1.B, Match2.A, Match2.B, ...]
    const slots: any[] = new Array(size).fill(null);
    
    // Place players.
    // If we want to support BYEs properly:
    // Top seeds get BYEs.
    // A BYE in Round 1 means the player is placed in the slot, and the opponent is NULL.
    // The match is auto-won.
    
    // Strategy:
    // 1. Place all registered players in the slots.
    // 2. Leave remaining slots null (these are the opponents of the byes).
    // But we need to ensure the nulls are paired with the top seeds.
    
    // Simple distribution for MVP:
    // Fill slots 0 to count-1 with players.
    // Slots count to size-1 are null.
    // This is BAD because top seeds might play each other.
    
    // Better:
    // 1. Take top 'byes' seeds. They get a bye.
    // 2. The rest play each other.
    // This changes the structure.
    
    // Let's stick to the "Full Binary Tree" approach.
    // We have 'size' leaf nodes.
    // We place players in leaf nodes.
    // If a node is empty, it's a BYE.
    
    // Seeding logic (Standard Tennis/Badminton):
    // Seed 1 -> Pos 0
    // Seed 2 -> Pos Size-1
    // Seed 3 -> Pos Size/2
    // Seed 4 -> Pos Size/2 - 1
    // ...
    
    // For this implementation, let's just fill sequentially for unseeded, but respect seeds if present.
    // We'll just fill the array with players then nulls.
    // BUT we must shuffle the nulls to be against the top seeds?
    // Actually, standard is:
    // Match 1: Seed 1 vs Bye
    // Match 2: ...
    
    // Let's just assign players to the matches we created.
    // We have round1Matches.
    
    let playerIdx = 0;
    
    // We need to be careful. If we have BYEs, we want them to be against the best players.
    // So we fill:
    // Match 1: Player 1 vs NULL (Bye)
    // Match 2: Player X vs Player Y
    
    // Let's try to fill the slots [0..size-1]
    // We place players.
    // If we have byes, we place them at specific indices?
    // No, we place players. If a slot is empty, it's a bye.
    
    // Let's just iterate through matches and fill.
    for (const match of round1Matches) {
      const pA = players[playerIdx++];
      const pB = players[playerIdx++];
      
      const updateData: any = {};
      if (pA) updateData.playerAId = pA.id;
      if (pB) updateData.playerBId = pB.id;
      
      // Auto-win logic
      if (pA && !pB) {
        updateData.winnerId = pA.id;
        updateData.status = MatchStatus.COMPLETED;
        updateData.score = { note: 'BYE' };
        // Propagate to next match immediately
        if (match.nextMatchId) {
           // We need to know if this match is A or B for the next match.
           // matchNumber is odd -> Player A of next match
           // matchNumber is even -> Player B of next match
           const isPlayerAInNext = match.matchNumber % 2 !== 0;
           await prisma.match.update({
             where: { id: match.nextMatchId },
             data: isPlayerAInNext ? { playerAId: pA.id } : { playerBId: pA.id }
           });
        }
      } else if (!pA && pB) {
         // Should not happen with sequential fill, but handle it
        updateData.winnerId = pB.id;
        updateData.status = MatchStatus.COMPLETED;
        updateData.score = { note: 'BYE' };
         if (match.nextMatchId) {
           const isPlayerAInNext = match.matchNumber % 2 !== 0;
           await prisma.match.update({
             where: { id: match.nextMatchId },
             data: isPlayerAInNext ? { playerAId: pB.id } : { playerBId: pB.id }
           });
        }
      } else if (!pA && !pB) {
        updateData.status = MatchStatus.COMPLETED; // Double bye?
      }

      await prisma.match.update({
        where: { id: match.id },
        data: updateData
      });
    }

    return { message: 'Knockout fixtures generated', totalMatches: matches.length };
  }

  /**
   * Generate Round Robin (Berger Tables)
   */
  private static async generateRoundRobin(event: any, registrations: any[]) {
    let players = registrations.map(r => r.player);
    
    // If odd number of players, add a dummy "BYE" player
    if (players.length % 2 !== 0) {
      players.push(null); // Null represents a BYE
    }

    const n = players.length;
    const rounds = n - 1;
    const matchesPerRound = n / 2;

    const matches = [];

    // Berger Table Algorithm
    // Fixed position for one player, rotate others
    // Indices: 0 to n-1
    let indices = Array.from({ length: n }, (_, i) => i);

    for (let r = 0; r < rounds; r++) {
      for (let i = 0; i < matchesPerRound; i++) {
        const p1Idx = indices[i];
        const p2Idx = indices[n - 1 - i];

        const p1 = players[p1Idx];
        const p2 = players[p2Idx];

        // If either is null, it's a BYE round for the other player
        if (p1 && p2) {
          matches.push({
            eventId: event.id,
            round: r + 1,
            matchNumber: i + 1,
            playerAId: p1.id,
            playerBId: p2.id,
            status: MatchStatus.PENDING,
          });
        }
      }

      // Rotate indices (keep index 0 fixed, rotate 1 to n-1)
      // [0, 1, 2, 3] -> [0, 3, 1, 2]
      const fixed = indices[0];
      const rotating = indices.slice(1);
      const last = rotating.pop();
      if (last !== undefined) rotating.unshift(last);
      indices = [fixed, ...rotating];
    }

    // Bulk create matches
    // Prisma createMany is supported
    await prisma.match.createMany({
      data: matches
    });

    return { message: 'Round Robin fixtures generated', totalMatches: matches.length };
  }
}
