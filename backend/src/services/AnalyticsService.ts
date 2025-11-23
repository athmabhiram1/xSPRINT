import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Analytics Service
 * Provides fixture analysis and schedule quality metrics
 */

interface SameClubClash {
    matchId: string;
    matchNumber: number;
    playerAName: string;
    playerBName: string;
    clubName: string;
    round: number;
}

interface FixtureAnalysis {
    eventId: string;
    eventName: string;
    totalMatches: number;
    sameClubClashes: SameClubClash[];
    sameClubClashCount: number;
    byeDistribution: {
        round: number;
        byeCount: number;
    }[];
    fairnessScore: number;
    generatedAt: string;
}

interface CourtUtilization {
    courtName: string;
    totalSlots: number;
    usedSlots: number;
    utilizationPercent: number;
}

interface RestTimeIssue {
    playerId: string;
    playerName: string;
    previousMatchId: string;
    nextMatchId: string;
    actualRestMinutes: number;
    requiredRestMinutes: number;
}

interface ScheduleQuality {
    eventId: string;
    eventName: string;
    courts: CourtUtilization[];
    averageUtilization: number;
    restTimeIssues: RestTimeIssue[];
    backToBackMatches: number;
    totalIdleMinutes: number;
    scheduleScore: number;
    generatedAt: string;
}

export class AnalyticsService {
    /**
     * Analyze fixture fairness
     */
    async getFixtureAnalysis(eventId: string): Promise<FixtureAnalysis> {
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                matches: {
                    include: {
                        playerA: { include: { club: true } },
                        playerB: { include: { club: true } },
                    },
                },
            },
        });

        if (!event) {
            throw new Error('Event not found');
        }

        // Find same-club clashes
        const sameClubClashes: SameClubClash[] = [];
        for (const match of event.matches) {
            if (
                match.playerA &&
                match.playerB &&
                match.playerA.clubId &&
                match.playerB.clubId &&
                match.playerA.clubId === match.playerB.clubId
            ) {
                sameClubClashes.push({
                    matchId: match.id,
                    matchNumber: match.matchNumber,
                    playerAName: match.playerA.name,
                    playerBName: match.playerB.name,
                    clubName: match.playerA.club?.name || 'Unknown',
                    round: match.round,
                });
            }
        }

        // Calculate BYE distribution by round
        const byeDistribution: { round: number; byeCount: number }[] = [];
        const roundsMap = new Map<number, number>();

        for (const match of event.matches) {
            if (!match.playerBId) {
                const count = roundsMap.get(match.round) || 0;
                roundsMap.set(match.round, count + 1);
            }
        }

        roundsMap.forEach((count, round) => {
            byeDistribution.push({ round, byeCount: count });
        });

        // Calculate fairness score (0-100)
        // Penalize early-round same-club clashes more heavily
        let fairnessScore = 100;
        for (const clash of sameClubClashes) {
            const penalty = clash.round === 1 ? 15 : clash.round === 2 ? 10 : 5;
            fairnessScore -= penalty;
        }
        fairnessScore = Math.max(0, fairnessScore);

        return {
            eventId: event.id,
            eventName: event.name,
            totalMatches: event.matches.length,
            sameClubClashes,
            sameClubClashCount: sameClubClashes.length,
            byeDistribution,
            fairnessScore,
            generatedAt: new Date().toISOString(),
        };
    }

    /**
     * Analyze schedule quality
     */
    async getScheduleQuality(eventId: string): Promise<ScheduleQuality> {
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                tournament: {
                    include: {
                        courts: true,
                    },
                },
                matches: {
                    include: {
                        playerA: true,
                        playerB: true,
                        schedule: {
                            include: {
                                court: true,
                            },
                        },
                    },
                    orderBy: { startTime: 'asc' },
                },
            },
        });

        if (!event) {
            throw new Error('Event not found');
        }

        const tournament = event.tournament;
        const courts = tournament.courts || [];
        const scheduledMatches = event.matches.filter((m) => m.startTime);

        // Calculate court utilization
        const courtUtilization: CourtUtilization[] = [];
        const matchDuration = 45; // minutes

        for (const court of courts) {
            const courtMatches = scheduledMatches.filter(
                (m) => m.schedule?.court?.name === court.name
            );
            const usedSlots = courtMatches.length;

            // Calculate total possible slots based on tournament duration
            const tournamentDays = Math.ceil(
                (tournament.endDate.getTime() - tournament.startDate.getTime()) /
                (1000 * 60 * 60 * 24)
            );
            const hoursPerDay = 10; // 9 AM to 7 PM
            const totalSlots = Math.floor(
                (tournamentDays * hoursPerDay * 60) / matchDuration
            );

            courtUtilization.push({
                courtName: court.name,
                totalSlots,
                usedSlots,
                utilizationPercent: Math.round((usedSlots / totalSlots) * 100),
            });
        }

        const averageUtilization =
            courtUtilization.reduce((sum, c) => sum + c.utilizationPercent, 0) /
            (courtUtilization.length || 1);

        // Find rest-time issues
        const restTimeIssues: RestTimeIssue[] = [];
        const requiredRestMinutes = 30; // Default rest time

        const playerMatches = new Map<string, typeof scheduledMatches>();
        for (const match of scheduledMatches) {
            if (match.playerAId) {
                const matches = playerMatches.get(match.playerAId) || [];
                matches.push(match);
                playerMatches.set(match.playerAId, matches);
            }
            if (match.playerBId) {
                const matches = playerMatches.get(match.playerBId) || [];
                matches.push(match);
                playerMatches.set(match.playerBId, matches);
            }
        }

        playerMatches.forEach((matches, playerId) => {
            const sortedMatches = matches.sort(
                (a, b) =>
                    (a.startTime?.getTime() || 0) - (b.startTime?.getTime() || 0)
            );

            for (let i = 0; i < sortedMatches.length - 1; i++) {
                const current = sortedMatches[i];
                const next = sortedMatches[i + 1];

                if (current.startTime && next.startTime) {
                    const restMinutes =
                        (next.startTime.getTime() -
                            current.startTime.getTime() -
                            matchDuration * 60 * 1000) /
                        (1000 * 60);

                    if (restMinutes < requiredRestMinutes) {
                        const player =
                            current.playerAId === playerId ? current.playerA : current.playerB;
                        restTimeIssues.push({
                            playerId,
                            playerName: player?.name || 'Unknown',
                            previousMatchId: current.id,
                            nextMatchId: next.id,
                            actualRestMinutes: Math.round(restMinutes),
                            requiredRestMinutes,
                        });
                    }
                }
            }
        });

        // Count back-to-back matches (rest < 15 minutes)
        const backToBackMatches = restTimeIssues.filter(
            (issue) => issue.actualRestMinutes < 15
        ).length;

        // Calculate total idle time (simplified)
        const totalIdleMinutes = courtUtilization.reduce((sum, court) => {
            const idleSlots = court.totalSlots - court.usedSlots;
            return sum + idleSlots * matchDuration;
        }, 0);

        // Calculate schedule score (0-100)
        let scheduleScore = 100;
        scheduleScore -= restTimeIssues.length * 5; // -5 per rest issue
        scheduleScore -= backToBackMatches * 10; // -10 per back-to-back
        scheduleScore -= Math.max(0, (100 - averageUtilization) / 2); // Penalize low utilization
        scheduleScore = Math.max(0, Math.min(100, scheduleScore));

        return {
            eventId: event.id,
            eventName: event.name,
            courts: courtUtilization,
            averageUtilization: Math.round(averageUtilization),
            restTimeIssues,
            backToBackMatches,
            totalIdleMinutes: Math.round(totalIdleMinutes),
            scheduleScore: Math.round(scheduleScore),
            generatedAt: new Date().toISOString(),
        };
    }
}

export const analyticsService = new AnalyticsService();
