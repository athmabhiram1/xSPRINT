/**
 * Smart Scheduling Engine
 * Assigns matches to courts with time slots
 */

import { MatchStatus } from './types';

export interface ScheduleConfig {
  totalCourts: number;
  tournamentStartTime: Date;
  matchDurationMinutes: number;
  relaxationBufferMinutes: number;
}

export interface PlayerAvailability {
  playerId: string;
  nextAvailableTime: Date;
}

export interface CourtSchedule {
  courtNumber: number;
  nextAvailableTime: Date;
}

export interface MatchScheduleItem {
  matchId: string;
  courtNumber: number;
  scheduledStart: Date;
  playerAId: string | null;
  playerBId: string | null;
}

/**
 * Calculate when a court will be free
 */
export function calculateCourtAvailability(
  currentTime: Date,
  matchDurationMinutes: number
): Date {
  return new Date(currentTime.getTime() + matchDurationMinutes * 60000);
}

/**
 * Calculate when a player will be available after rest period
 */
export function calculatePlayerAvailability(
  matchEndTime: Date,
  relaxationBufferMinutes: number
): Date {
  return new Date(matchEndTime.getTime() + relaxationBufferMinutes * 60000);
}

/**
 * Find next available court
 */
export function findNextAvailableCourt(
  courts: CourtSchedule[],
  requestedTime: Date
): { court: number; time: Date } {
  // Find court that's free earliest
  let earliestCourt = courts[0];
  
  for (const court of courts) {
    if (court.nextAvailableTime <= requestedTime) {
      return { court: court.courtNumber, time: requestedTime };
    }
    if (court.nextAvailableTime < earliestCourt.nextAvailableTime) {
      earliestCourt = court;
    }
  }
  
  return { 
    court: earliestCourt.courtNumber, 
    time: earliestCourt.nextAvailableTime 
  };
}

/**
 * Check if players are available at given time
 */
export function arePlayersAvailable(
  playerAId: string | null,
  playerBId: string | null,
  requestedTime: Date,
  playerAvailability: Map<string, Date>
): boolean {
  if (playerAId) {
    const playerATime = playerAvailability.get(playerAId);
    if (playerATime && playerATime > requestedTime) {
      return false;
    }
  }
  
  if (playerBId) {
    const playerBTime = playerAvailability.get(playerBId);
    if (playerBTime && playerBTime > requestedTime) {
      return false;
    }
  }
  
  return true;
}

/**
 * Schedule matches across multiple courts
 */
export function scheduleMatches(
  matches: Array<{
    id: string;
    playerAId: string | null;
    playerBId: string | null;
    round: number;
  }>,
  config: ScheduleConfig
): MatchScheduleItem[] {
  const schedule: MatchScheduleItem[] = [];
  
  // Initialize court availability
  const courts: CourtSchedule[] = Array.from({ length: config.totalCourts }, (_, i) => ({
    courtNumber: i + 1,
    nextAvailableTime: config.tournamentStartTime
  }));
  
  // Track player availability
  const playerAvailability = new Map<string, Date>();
  
  // Sort matches by round (earlier rounds first)
  const sortedMatches = [...matches].sort((a, b) => a.round - b.round);
  
  for (const match of sortedMatches) {
    // Skip if players are not yet determined
    if (!match.playerAId && !match.playerBId) {
      continue;
    }
    
    // Skip BYE matches
    if (!match.playerAId || !match.playerBId) {
      continue;
    }
    
    // Get earliest time both players are available
    let earliestPlayerTime = config.tournamentStartTime;
    
    if (match.playerAId) {
      const playerATime = playerAvailability.get(match.playerAId);
      if (playerATime && playerATime > earliestPlayerTime) {
        earliestPlayerTime = playerATime;
      }
    }
    
    if (match.playerBId) {
      const playerBTime = playerAvailability.get(match.playerBId);
      if (playerBTime && playerBTime > earliestPlayerTime) {
        earliestPlayerTime = playerBTime;
      }
    }
    
    // Find next available court
    const { court, time } = findNextAvailableCourt(courts, earliestPlayerTime);
    
    // Schedule the match
    const scheduledTime = time > earliestPlayerTime ? time : earliestPlayerTime;
    
    schedule.push({
      matchId: match.id,
      courtNumber: court,
      scheduledStart: scheduledTime,
      playerAId: match.playerAId,
      playerBId: match.playerBId
    });
    
    // Update court availability
    const courtIndex = court - 1;
    courts[courtIndex].nextAvailableTime = calculateCourtAvailability(
      scheduledTime,
      config.matchDurationMinutes
    );
    
    // Update player availability
    const matchEndTime = courts[courtIndex].nextAvailableTime;
    const playerNextAvailable = calculatePlayerAvailability(
      matchEndTime,
      config.relaxationBufferMinutes
    );
    
    if (match.playerAId) {
      playerAvailability.set(match.playerAId, playerNextAvailable);
    }
    if (match.playerBId) {
      playerAvailability.set(match.playerBId, playerNextAvailable);
    }
  }
  
  return schedule;
}

/**
 * Recalculate schedule after a delay
 */
export function recalculateSchedule(
  delayedMatchId: string,
  actualEndTime: Date,
  remainingMatches: Array<{
    id: string;
    playerAId: string | null;
    playerBId: string | null;
    scheduledStart: Date | null;
    court: number | null;
  }>,
  config: ScheduleConfig
): MatchScheduleItem[] {
  // Find matches that need rescheduling
  const affectedMatches = remainingMatches.filter(m => {
    if (!m.scheduledStart || !m.court) return false;
    // If match involves same players or same court after the delayed match
    return m.scheduledStart > actualEndTime;
  });
  
  // Reschedule affected matches
  return scheduleMatches(
    affectedMatches.map(m => ({
      id: m.id,
      playerAId: m.playerAId,
      playerBId: m.playerBId,
      round: 1 // Will be sorted properly
    })),
    config
  );
}
