/**
 * Fixture Generation Utilities
 * For tournament bracket creation
 */

import { ClubGroup } from './types';

/**
 * Calculate next power of 2
 */
export function nextPowerOfTwo(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * Calculate byes needed
 */
export function calculateByes(totalPlayers: number): number {
  const nextPower = nextPowerOfTwo(totalPlayers);
  return nextPower - totalPlayers;
}

/**
 * Group players by club
 */
export function groupPlayersByClub(
  players: Array<{ id: string; clubId: string | null }>
): ClubGroup[] {
  const clubMap = new Map<string, string[]>();
  
  players.forEach(player => {
    const clubId = player.clubId || 'INDEPENDENT';
    if (!clubMap.has(clubId)) {
      clubMap.set(clubId, []);
    }
    clubMap.get(clubId)!.push(player.id);
  });

  const totalSlots = nextPowerOfTwo(players.length);
  const clubs: ClubGroup[] = [];

  clubMap.forEach((playerIds, clubId) => {
    clubs.push({
      clubId,
      playerIds,
      density: playerIds.length / totalSlots
    });
  });

  return clubs.sort((a, b) => b.density - a.density);
}

/**
 * Distribute players to avoid same-club matchups
 */
export function distributePlayersWithClubAvoidance(
  clubs: ClubGroup[]
): string[] {
  const allPlayers = clubs.flatMap(c => c.playerIds);
  const totalSlots = nextPowerOfTwo(allPlayers.length);
  const slots: (string | null)[] = new Array(totalSlots).fill(null);

  // Recursively assign to bracket quadrants
  const assignToQuadrant = (
    players: string[],
    start: number,
    end: number
  ) => {
    if (players.length === 0) return;
    
    const mid = Math.floor((start + end) / 2);
    const half = Math.ceil(players.length / 2);
    
    // Place alternately in top and bottom halves
    let topIdx = start;
    let bottomIdx = mid + 1;
    
    for (let i = 0; i < players.length; i++) {
      if (i % 2 === 0) {
        while (topIdx <= mid && slots[topIdx] !== null) topIdx++;
        if (topIdx <= mid) slots[topIdx++] = players[i];
      } else {
        while (bottomIdx <= end && slots[bottomIdx] !== null) bottomIdx++;
        if (bottomIdx <= end) slots[bottomIdx++] = players[i];
      }
    }
  };

  // Process largest clubs first
  for (const club of clubs) {
    assignToQuadrant(club.playerIds, 0, totalSlots - 1);
  }

  // Fill remaining with BYEs
  for (let i = 0; i < slots.length; i++) {
    if (slots[i] === null) slots[i] = 'BYE';
  }

  return slots as string[];
}

/**
 * Create first round matches from seeding
 */
export function createFirstRoundMatches(
  seededPlayers: string[],
  eventId: string,
  tournamentId: string
) {
  const matches = [];
  const n = seededPlayers.length;
  
  for (let i = 0; i < n / 2; i++) {
    const playerA = seededPlayers[i * 2];
    const playerB = seededPlayers[i * 2 + 1];
    
    matches.push({
      eventId,
      tournamentId,
      round: 1,
      indexInRound: i,
      playerAId: playerA === 'BYE' ? null : playerA,
      playerBId: playerB === 'BYE' ? null : playerB,
      status: 'PENDING' as const
    });
  }
  
  return matches;
}

/**
 * Calculate total rounds needed
 */
export function calculateTotalRounds(totalPlayers: number): number {
  return Math.ceil(Math.log2(nextPowerOfTwo(totalPlayers)));
}
