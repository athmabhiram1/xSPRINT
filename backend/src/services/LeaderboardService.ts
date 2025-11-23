import prisma from '../lib/db';

// Type definitions
interface PlayerOrTeamSummary {
    id: string;
    name: string;
    club: string | null;
}

interface KnockoutStandings {
    champion: PlayerOrTeamSummary | null;
    runnerUp: PlayerOrTeamSummary | null;
    semifinalists: PlayerOrTeamSummary[];
}

interface RoundRobinStanding {
    player: PlayerOrTeamSummary;
    rank: number;
    wins: number;
    losses: number;
    matchesPlayed: number;
    pointsFor: number;
    pointsAgainst: number;
    pointDifferential: number;
}

interface EventLeaderboard {
    eventId: string;
    format: string;
    knockout?: KnockoutStandings;
    roundRobin?: RoundRobinStanding[];
}

export class LeaderboardService {
    /**
     * Get knockout tournament standings
     * Identifies champion, runner-up, and semi-finalists
     */
    async getKnockoutStandings(eventId: string): Promise<KnockoutStandings> {
        // Fetch all completed matches for this event, ordered by round descending
        const matches = await prisma.match.findMany({
            where: {
                eventId,
                status: 'COMPLETED',
                winnerId: { not: null }
            },
            include: {
                playerA: { include: { club: true } },
                playerB: { include: { club: true } },
                winner: { include: { club: true } }
            },
            orderBy: { round: 'desc' }
        });

        if (matches.length === 0) {
            return {
                champion: null,
                runnerUp: null,
                semifinalists: []
            };
        }

        // Find the highest round (final)
        const maxRound = Math.max(...matches.map(m => m.round));
        const finalMatch = matches.find(m => m.round === maxRound);

        let champion: PlayerOrTeamSummary | null = null;
        let runnerUp: PlayerOrTeamSummary | null = null;
        const semifinalists: PlayerOrTeamSummary[] = [];

        // Extract champion and runner-up from final
        if (finalMatch && finalMatch.winner) {
            champion = {
                id: finalMatch.winner.id,
                name: finalMatch.winner.name,
                club: finalMatch.winner.club?.name || null
            };

            // Runner-up is the loser of the final
            const loser = finalMatch.playerA?.id === finalMatch.winner.id
                ? finalMatch.playerB
                : finalMatch.playerA;

            if (loser) {
                runnerUp = {
                    id: loser.id,
                    name: loser.name,
                    club: loser.club?.name || null
                };
            }
        }

        // Find semi-finalists (losers of semi-final round)
        if (maxRound > 1) {
            const semiFinalRound = maxRound - 1;
            const semiFinalMatches = matches.filter(m => m.round === semiFinalRound);

            for (const match of semiFinalMatches) {
                if (match.winner) {
                    // The loser of this semi-final is a semi-finalist
                    const loser = match.playerA?.id === match.winner.id
                        ? match.playerB
                        : match.playerA;

                    if (loser && loser.id !== runnerUp?.id) {
                        semifinalists.push({
                            id: loser.id,
                            name: loser.name,
                            club: loser.club?.name || null
                        });
                    }
                }
            }
        }

        return {
            champion,
            runnerUp,
            semifinalists
        };
    }

    /**
     * Get round-robin standings
     * Computes wins, losses, points, and applies tie-breakers
     */
    async getRoundRobinStandings(eventId: string): Promise<RoundRobinStanding[]> {
        // Fetch all matches for this event
        const matches = await prisma.match.findMany({
            where: { eventId },
            include: {
                playerA: { include: { club: true } },
                playerB: { include: { club: true } },
                winner: { include: { club: true } }
            }
        });

        // Get all registered players for this event
        const registrations = await prisma.registration.findMany({
            where: { eventId },
            include: {
                player: { include: { club: true } }
            }
        });

        // Build standings map
        const standingsMap = new Map<string, RoundRobinStanding>();

        // Initialize all registered players
        for (const reg of registrations) {
            standingsMap.set(reg.player.id, {
                player: {
                    id: reg.player.id,
                    name: reg.player.name,
                    club: reg.player.club?.name || null
                },
                rank: 0,
                wins: 0,
                losses: 0,
                matchesPlayed: 0,
                pointsFor: 0,
                pointsAgainst: 0,
                pointDifferential: 0
            });
        }

        // Process completed matches
        for (const match of matches) {
            if (match.status !== 'COMPLETED' || !match.winnerId) continue;

            const playerAId = match.playerA?.id;
            const playerBId = match.playerB?.id;

            if (!playerAId || !playerBId) continue;

            const standingA = standingsMap.get(playerAId);
            const standingB = standingsMap.get(playerBId);

            if (!standingA || !standingB) continue;

            // Update matches played
            standingA.matchesPlayed++;
            standingB.matchesPlayed++;

            // Determine winner and loser
            const isAWinner = match.winnerId === playerAId;
            const winner = isAWinner ? standingA : standingB;
            const loser = isAWinner ? standingB : standingA;

            winner.wins++;
            loser.losses++;

            // Extract points from score if available
            if (match.score && typeof match.score === 'object') {
                const score = match.score as any;

                // Try to extract points from various score formats
                if (score.sets && Array.isArray(score.sets)) {
                    let playerAPoints = 0;
                    let playerBPoints = 0;

                    for (const set of score.sets) {
                        playerAPoints += set.a || 0;
                        playerBPoints += set.b || 0;
                    }

                    standingA.pointsFor += playerAPoints;
                    standingA.pointsAgainst += playerBPoints;
                    standingB.pointsFor += playerBPoints;
                    standingB.pointsAgainst += playerAPoints;
                } else if (score.playerA !== undefined && score.playerB !== undefined) {
                    standingA.pointsFor += score.playerA || 0;
                    standingA.pointsAgainst += score.playerB || 0;
                    standingB.pointsFor += score.playerB || 0;
                    standingB.pointsAgainst += score.playerA || 0;
                }
            }
        }

        // Calculate point differentials
        for (const standing of standingsMap.values()) {
            standing.pointDifferential = standing.pointsFor - standing.pointsAgainst;
        }

        // Convert to array and sort
        const standings = Array.from(standingsMap.values());

        // Sort by: wins (desc), then point differential (desc), then points for (desc)
        standings.sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            if (b.pointDifferential !== a.pointDifferential) {
                return b.pointDifferential - a.pointDifferential;
            }
            return b.pointsFor - a.pointsFor;
        });

        // Assign ranks
        standings.forEach((standing, index) => {
            standing.rank = index + 1;
        });

        return standings;
    }

    /**
     * Get event leaderboard (unified wrapper)
     * Detects format and returns appropriate standings
     * CACHED for 10 seconds
     */
    async getEventLeaderboard(eventId: string): Promise<EventLeaderboard> {
        // Import cache service
        const { cacheService } = await import('./CacheService');

        // Check cache first
        const cacheKey = `leaderboard:${eventId}`;
        const cached = cacheService.get<EventLeaderboard>(cacheKey);
        if (cached) {
            return cached;
        }

        // Fetch event to determine format
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { id: true, type: true }
        });

        if (!event) {
            throw new Error('Event not found');
        }

        const format = event.type || 'KNOCKOUT';
        const result: EventLeaderboard = {
            eventId,
            format
        };

        if (format === 'ROUND_ROBIN') {
            result.roundRobin = await this.getRoundRobinStandings(eventId);
        } else {
            // Default to knockout
            result.knockout = await this.getKnockoutStandings(eventId);
        }

        // Cache the result
        cacheService.set(cacheKey, result, 10);

        return result;
    }

    /**
     * Get event analytics (for admin/organizer)
     */
    async getEventAnalytics(eventId: string) {
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                matches: {
                    include: {
                        playerA: { include: { club: true } },
                        playerB: { include: { club: true } },
                        schedule: { include: { court: true } }
                    }
                },
                registrations: true
            }
        });

        if (!event) {
            throw new Error('Event not found');
        }

        const totalMatches = event.matches.length;
        const completedMatches = event.matches.filter(m => m.status === 'COMPLETED').length;
        const inProgressMatches = event.matches.filter(m => m.status === 'ONGOING').length;
        const scheduledMatches = event.matches.filter(m => m.status === 'SCHEDULED').length;

        // Count same-club matches
        const sameClubMatchCount = event.matches.filter(m => {
            return m.playerA?.clubId && m.playerB?.clubId &&
                m.playerA.clubId === m.playerB.clubId;
        }).length;

        // Court utilization
        const courtsUsed = new Set(
            event.matches
                .filter(m => m.schedule?.courtId)
                .map(m => m.schedule!.courtId)
        ).size;

        const scheduledSlotsUsed = event.matches.filter(m => m.schedule).length;

        // Average rest time (simplified - just check time between matches for each player)
        // This is a basic approximation
        const averageRestTimePerPlayer = this.calculateAverageRestTime(event.matches);

        return {
            eventId,
            eventName: event.name,
            format: event.type,
            totalMatches,
            completedMatches,
            inProgressMatches,
            scheduledMatches,
            pendingMatches: totalMatches - completedMatches - inProgressMatches - scheduledMatches,
            completionRate: totalMatches > 0 ? (completedMatches / totalMatches * 100).toFixed(2) + '%' : '0%',
            sameClubMatchCount,
            sameClubMatchPercentage: totalMatches > 0 ? (sameClubMatchCount / totalMatches * 100).toFixed(2) + '%' : '0%',
            courtUtilization: {
                courtsUsed,
                scheduledSlotsUsed,
                utilizationRate: totalMatches > 0 ? (scheduledSlotsUsed / totalMatches * 100).toFixed(2) + '%' : '0%'
            },
            averageRestTimeMinutes: averageRestTimePerPlayer,
            totalRegistrations: event.registrations.length
        };
    }

    /**
     * Calculate average rest time between matches for players
     * Returns average in minutes
     */
    private calculateAverageRestTime(matches: any[]): number {
        const scheduledMatches = matches
            .filter(m => m.schedule?.startTime && m.schedule?.endTime)
            .sort((a, b) => a.schedule!.startTime.getTime() - b.schedule!.startTime.getTime());

        if (scheduledMatches.length < 2) {
            return 0;
        }

        const playerRestTimes = new Map<string, number[]>();

        // For each player, calculate rest times between consecutive matches
        for (let i = 0; i < scheduledMatches.length; i++) {
            const match = scheduledMatches[i];
            const playerIds = [match.playerA?.id, match.playerB?.id].filter(Boolean);

            for (const playerId of playerIds) {
                if (!playerId) continue;

                // Find next match for this player
                for (let j = i + 1; j < scheduledMatches.length; j++) {
                    const nextMatch = scheduledMatches[j];
                    if (nextMatch.playerA?.id === playerId || nextMatch.playerB?.id === playerId) {
                        // Calculate rest time
                        const restTime = nextMatch.schedule!.startTime.getTime() - match.schedule!.endTime.getTime();
                        const restMinutes = restTime / (1000 * 60);

                        if (!playerRestTimes.has(playerId)) {
                            playerRestTimes.set(playerId, []);
                        }
                        playerRestTimes.get(playerId)!.push(restMinutes);
                        break; // Only consider immediate next match
                    }
                }
            }
        }

        // Calculate overall average
        let totalRestTime = 0;
        let totalRestPeriods = 0;

        for (const restTimes of playerRestTimes.values()) {
            totalRestTime += restTimes.reduce((sum, time) => sum + time, 0);
            totalRestPeriods += restTimes.length;
        }

        return totalRestPeriods > 0 ? Math.round(totalRestTime / totalRestPeriods) : 0;
    }
}
