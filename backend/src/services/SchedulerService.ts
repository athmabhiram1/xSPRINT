// backend/src/services/SchedulerService.ts

import { PrismaClient, MatchStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class SchedulerService {

    /**
     * Assigns times and courts to matches for an event.
     * Uses a simple greedy algorithm: Assign next available match to next available court.
     */
    async scheduleMatches(eventId: string, startTimeISO: string, matchDurationMinutes: number = 30) {
        // 1. Fetch all PENDING matches for the event
        const matches = await prisma.match.findMany({
            where: {
                eventId,
                status: MatchStatus.PENDING
            },
            orderBy: [
                { round: 'asc' }, // Schedule earlier rounds first
                { matchNumber: 'asc' }
            ]
        });

        if (matches.length === 0) return { message: "No pending matches to schedule." };

        // 2. Fetch Courts for the tournament
        // We need the tournament ID first
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { tournament: { include: { courts: true } } }
        });

        if (!event || !event.tournament.courts || event.tournament.courts.length === 0) {
            throw new Error("No courts available for this tournament.");
        }

        const courts = event.tournament.courts;
        const numCourts = courts.length;

        // 3. Initialize Court Availability
        // Each court tracks when it becomes free. Initially, all free at start time.
        const courtAvailability = courts.map(court => ({
            courtId: court.id,
            nextFreeTime: new Date(startTimeISO).getTime()
        }));

        // Track when each player becomes free (to enforce rest times)
        const playerAvailability: Record<string, number> = {}; // playerId -> timestamp

        const scheduleUpdates = [];
        const REST_TIME_MS = 15 * 60 * 1000; // 15 minutes rest

        // 4. Assign Matches
        for (const match of matches) {
            const p1 = match.playerAId;
            const p2 = match.playerBId;

            // Determine earliest start time based on player availability
            let minStartTime = new Date(startTimeISO).getTime();

            if (p1 && playerAvailability[p1]) {
                minStartTime = Math.max(minStartTime, playerAvailability[p1] + REST_TIME_MS);
            }
            if (p2 && playerAvailability[p2]) {
                minStartTime = Math.max(minStartTime, playerAvailability[p2] + REST_TIME_MS);
            }

            // Find the court that is free earliest, BUT after minStartTime
            // We need a court where max(court.nextFreeTime, minStartTime) is minimized

            courtAvailability.sort((a, b) => {
                const startA = Math.max(a.nextFreeTime, minStartTime);
                const startB = Math.max(b.nextFreeTime, minStartTime);
                return startA - startB;
            });

            const bestCourt = courtAvailability[0];

            // The actual start time is the later of: court availability OR player availability
            const actualStartTime = Math.max(bestCourt.nextFreeTime, minStartTime);
            const actualEndTime = actualStartTime + (matchDurationMinutes * 60000);

            // Update Court Availability
            bestCourt.nextFreeTime = actualEndTime;

            // Update Player Availability
            if (p1) playerAvailability[p1] = actualEndTime;
            if (p2) playerAvailability[p2] = actualEndTime;

            // Prepare DB Update
            scheduleUpdates.push(
                prisma.match.update({
                    where: { id: match.id },
                    data: {
                        status: MatchStatus.SCHEDULED,
                        startTime: new Date(actualStartTime),
                        endTime: new Date(actualEndTime),
                        schedule: {
                            create: {
                                courtId: bestCourt.courtId,
                                startTime: new Date(actualStartTime),
                                endTime: new Date(actualEndTime)
                            }
                        }
                    }
                })
            );
        }

        // 5. Execute Updates Transactionally
        await prisma.$transaction(scheduleUpdates);

        // Return summary of scheduled matches
        return {
            success: true,
            scheduledCount: scheduleUpdates.length,
            lastMatchTime: new Date(Math.max(...courtAvailability.map(c => c.nextFreeTime)))
        };
    }
}
