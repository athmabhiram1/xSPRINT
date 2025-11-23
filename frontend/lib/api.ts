/**
 * API Client Functions
 * Convenience wrappers for API calls
 */

/**
 * API Client Functions
 * Convenience wrappers for API calls
 */

import { apiFetchResponse as fetchApi } from './apiClient';

// Types
export interface Tournament {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  image?: string;
  status: string;
  events?: any[];
  courts?: any[];
}

export interface Event {
  id: string;
  name: string;
  sport: string;
  type: string;
  category?: string;
  gender?: string;
  status: string;
  registrations?: any[];
}

export interface Club {
  id: string;
  name: string;
  code?: string;
  description?: string;
  location?: string;
}

export interface Player {
  id: string;
  name: string;
  email?: string;
  gender?: string;
  category?: string;
  weight?: string;
  clubId?: string;
  club?: Club;
}

export interface Match {
  id: string;
  round: number;
  matchCode: string;
  status: string;
  startTime?: string;
  endTime?: string;
  playerA?: { id: string; name: string; club?: { name: string } };
  playerB?: { id: string; name: string; club?: { name: string } };
  winnerId?: string;
  playerAId?: string;
  playerBId?: string;
  score?: any;
  schedule?: { court: { name: string } };
}

// Tournament APIs
export async function createTournament(data: {
  name: string;
  startTime?: string;
  courts: any[];
  [key: string]: any;
}) {
  return fetchApi('/api/tournaments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getTournaments(params?: {
  includeEvents?: boolean;
  includeCourts?: boolean;
  includeRegistrations?: boolean;
}) {
  const queryParams = new URLSearchParams();
  if (params?.includeEvents) queryParams.append('includeEvents', 'true');
  if (params?.includeCourts) queryParams.append('includeCourts', 'true');
  if (params?.includeRegistrations) queryParams.append('includeRegistrations', 'true');

  const query = queryParams.toString();
  return fetchApi(`/api/tournaments${query ? `?${query}` : ''}`);
}

export async function getTournament(id: string) {
  return fetchApi(`/api/tournaments/${id}`);
}

// Event APIs
export async function createEvent(data: {
  tournamentId: string;
  name: string;
  format: string;
}) {
  return fetchApi('/api/events', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getEventsByTournament(tournamentId: string) {
  const response = await fetchApi(`/api/events/tournament/${tournamentId}`);
  // Backend now returns { success: true, data: [...] }
  // Normalize to { success: true, events: [...] } for backward compatibility
  if (response?.success && response?.data) {
    return { success: true, events: response.data };
  }
  // Handle error case - return empty array
  return { success: false, events: [] };
}

export async function getFixturesByEvent(eventId: string) {
  return fetchApi(`/api/fixtures/event/${eventId}`);
}

// Club APIs
export async function createClub(data: { name: string; description?: string;[key: string]: any }) {
  return fetchApi('/api/clubs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getClubs() {
  return fetchApi('/api/clubs');
}

// Player APIs
export async function getPlayers() {
  return fetchApi('/api/players');
}

export async function createPlayer(data: Partial<Player>) {
  return fetchApi('/api/players', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function registerPlayer(data: {
  fullName?: string;
  clubId?: string;
  eventId: string;
  playerId?: string;
  [key: string]: any;
}) {
  return fetchApi('/api/players/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export const registerPlayerToEvent = registerPlayer;

// Fixture APIs
export async function generateFixtures(
  eventId: string,
  format: 'knockout' | 'roundrobin' = 'knockout',
  options?: { sameClubAvoidance?: boolean; randomizeUnseeded?: boolean; previewOnly?: boolean; }
) {
  return fetchApi(`/api/events/${eventId}/fixtures/generate`, {
    method: 'POST',
    body: JSON.stringify({ type: format, format, ...options }),
  });
}

// Schedule APIs
export async function generateSchedule(eventId: string, options?: { startTime?: string; matchDuration?: number; restTime?: number }) {
  return fetchApi(`/api/schedule/events/${eventId}/generate`, {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
}

// Match APIs
export async function submitResult(data: {
  matchId: string;
  matchCode?: string;
  code?: string;
  winnerId: string;
  score?: any;
}) {
  const payload = { ...data, matchCode: data.matchCode || data.code };
  return fetchApi('/api/matches/submit-result', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export const submitMatchResult = submitResult;

export async function generateMatchCode(matchId: string, assignedUmpire: string) {
  return fetchApi('/api/matches/generate-code', {
    method: 'POST',
    body: JSON.stringify({ matchId, assignedUmpire }),
  });
}

export async function validateMatchCode(matchId: string, code: string) {
  return fetchApi('/api/matches/validate-code', {
    method: 'POST',
    body: JSON.stringify({ matchId, code }),
  });
}

// Helper functions
export function formatMatchTime(date: Date | string | null | undefined): string {
  if (!date) return 'TBD';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'TBD';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function getMatchStatus(status: string): {
  label: string;
  color: string;
} {
  const statusMap: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Pending', color: 'gray' },
    SCHEDULED: { label: 'Scheduled', color: 'blue' },
    LIVE: { label: 'Live', color: 'green' },
    COMPLETED: { label: 'Completed', color: 'purple' }
  };

  return statusMap[status] || { label: status, color: 'gray' };
}

export function getRoundName(round: number, totalRounds: number): string {
  const roundsFromFinal = totalRounds - round;

  if (roundsFromFinal === 0) return 'Final';
  if (roundsFromFinal === 1) return 'Semi-Finals';
  if (roundsFromFinal === 2) return 'Quarter-Finals';

  return `Round ${round}`;
}

export function getSportEmoji(sport: string): string {
  const emojis: Record<string, string> = {
    Badminton: '🏸',
    Basketball: '🏀',
    Cricket: '🏏',
    Football: '⚽',
    Chess: '♟️',
    Pickleball: '🏓',
    Tennis: '🎾',
    Volleyball: '🏐',
  };
  return emojis[sport] || '🏆';
}
