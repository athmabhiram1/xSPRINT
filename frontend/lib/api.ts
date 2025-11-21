/**
 * API Client Functions
 * Convenience wrappers for API calls
 */

// Tournament APIs
export async function createTournament(data: {
  name: string;
  startTime?: string;
  courts: string[];
}) {
  const response = await fetch('/api/tournaments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function getTournaments() {
  const response = await fetch('/api/tournaments');
  return response.json();
}

export async function getTournament(id: string) {
  const response = await fetch(`/api/tournaments/${id}`);
  return response.json();
}

// Event APIs
export async function createEvent(data: {
  tournamentId: string;
  name: string;
  format: string;
}) {
  const response = await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

// Club APIs
export async function createClub(data: { name: string }) {
  const response = await fetch('/api/clubs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function getClubs() {
  const response = await fetch('/api/clubs');
  return response.json();
}

// Player APIs
export async function registerPlayer(data: {
  fullName: string;
  clubId?: string;
  eventId: string;
}) {
  const response = await fetch('/api/players/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

// Fixture APIs
export async function generateFixtures(eventId: string) {
  const response = await fetch('/api/fixtures/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId }),
  });
  return response.json();
}

// Schedule APIs
export async function generateSchedule(tournamentId: string, eventId: string) {
  const response = await fetch('/api/schedule/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tournamentId, eventId }),
  });
  return response.json();
}

// Match APIs
export async function submitResult(data: {
  matchId: string;
  matchCode: string;
  winnerId: string;
  score?: string;
}) {
  const response = await fetch('/api/matches/submit-result', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function generateMatchCode(matchId: string, assignedUmpire: string) {
  const response = await fetch('/api/matches/generate-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchId, assignedUmpire }),
  });
  return response.json();
}

// Helper functions
export function formatMatchTime(date: Date | string | null): string {
  if (!date) return 'TBD';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

export function formatDate(date: Date | string | null): string {
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
