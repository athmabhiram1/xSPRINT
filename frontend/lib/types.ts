/**
 * Tournament Types and Interfaces
 * Aligned with Prisma Schema
 */

export enum MatchStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED'
}

export enum NextMatchSlot {
  A = 'A',
  B = 'B'
}

export type TournamentFormat = 'knockout' | 'round_robin';

// API Request/Response Types
export interface CreateTournamentRequest {
  name: string;
  startTime?: Date;
  courts: string[];
}

export interface CreateEventRequest {
  tournamentId: string;
  name: string;
  format: TournamentFormat;
}

export interface RegisterPlayerRequest {
  fullName: string;
  clubId?: string;
  eventId: string;
}

export interface GenerateFixturesRequest {
  eventId: string;
}

export interface GenerateScheduleRequest {
  tournamentId: string;
  eventId: string;
}

export interface SubmitResultRequest {
  matchId: string;
  matchCode: string;
  winnerId: string;
  score?: string;
}

// Helper Types
export interface MatchWithDetails {
  id: string;
  round: number;
  indexInRound: number;
  playerA?: {
    id: string;
    fullName: string;
    club?: { name: string };
  } | null;
  playerB?: {
    id: string;
    fullName: string;
    club?: { name: string };
  } | null;
  winner?: {
    id: string;
    fullName: string;
  } | null;
  status: MatchStatus;
  court?: string | null;
  scheduledStart?: Date | null;
  actualStart?: Date | null;
  actualEnd?: Date | null;
}

export interface BracketNode {
  matchId: string;
  round: number;
  playerA: string | null;
  playerB: string | null;
  winner: string | null;
  nextMatchId: string | null;
}

export interface ClubGroup {
  clubId: string;
  playerIds: string[];
  density: number;
}
