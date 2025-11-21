import prisma from '../lib/db';
import { addMinutes, isBefore, max } from 'date-fns';

export class ScheduleEngine {
  private REST_TIME = 20; // Minutes
  private MATCH_DURATION = 45; // Minutes
  private CHANGEOVER = 5; // Minutes

  /**
   * Re-evaluates schedule for an event.
   * Uses a simplified Critical Path Method (CPM) / Greedy approach.
   */
  async generateSmartSchedule(eventId: string) {
    // 1. Fetch Resources & Matches
    const courts = await prisma.court.findMany({ where: { tournament: { events: { some: { id: eventId } } } } });
    const allMatches = await prisma.match.findMany({
      where: { eventId },
      include: { previousMatches: true },
      orderBy: { round: 'asc' } // Process Round 1, then Round 2...
    });

    // 2. Track Resource Availability (Time pointers)
    const courtFreeTime: Record<string, Date> = {};
    courts.forEach((c: any) => courtFreeTime[c.id] = new Date()); // Start scheduling from NOW (or tournament start)

    const playerFreeTime: Record<string, Date> = {};

    // 3. Dependency Graph Processing
    // We iterate rounds. A match cannot start until:
    // a) Both previousMatches are COMPLETED (or calculated end time passed)
    // b) Players have rested
    // c) A court is free

    const scheduleUpdates: any[] = [];

    for (const match of allMatches) {
      // If match is already completed, skip, but record player free time
      if (match.status === 'COMPLETED' && match.endTime) {
        if (match.playerAId) playerFreeTime[match.playerAId] = match.endTime;
        if (match.playerBId) playerFreeTime[match.playerBId] = match.endTime;
        continue;
      }

      // Calculate Earliest Start Time (EST) based on Dependencies
      let dependencyTime = new Date(); // Default to now
      
      if (match.previousMatches.length > 0) {
        const parentEndTimes = match.previousMatches.map((p: any) => p.endTime ? new Date(p.endTime).getTime() : 0);
        dependencyTime = new Date(Math.max(...parentEndTimes));
      }

      // Calculate Player Constraints
      const pA_Free = match.playerAId ? (playerFreeTime[match.playerAId] || new Date()) : new Date();
      const pB_Free = match.playerBId ? (playerFreeTime[match.playerBId] || new Date()) : new Date();
      
      // Players are ready after their last match + REST
      const playersReadyTime = new Date(Math.max(
        pA_Free.getTime() + this.REST_TIME * 60000, 
        pB_Free.getTime() + this.REST_TIME * 60000
      ));

      // The match can technically start at:
      let possibleStart = new Date(Math.max(dependencyTime.getTime(), playersReadyTime.getTime()));

      // Find Best Court (Earliest available slot after possibleStart)
      let bestCourt = courts[0];
      let minStartTime = new Date(8640000000000000); // Max date

      for (const court of courts) {
        const courtReady = courtFreeTime[court.id];
        const actualStart = new Date(Math.max(courtReady.getTime(), possibleStart.getTime()));

        if (isBefore(actualStart, minStartTime)) {
          minStartTime = actualStart;
          bestCourt = court;
        }
      }

      // Assign Schedule
      const startTime = minStartTime;
      const endTime = addMinutes(startTime, this.MATCH_DURATION);

      // Update Trackers
      courtFreeTime[bestCourt.id] = addMinutes(endTime, this.CHANGEOVER);
      if (match.playerAId) playerFreeTime[match.playerAId] = endTime;
      if (match.playerBId) playerFreeTime[match.playerBId] = endTime;

      // Push to update queue
      scheduleUpdates.push(
        prisma.scheduleBlock.upsert({
          where: { matchId: match.id },
          update: { courtId: bestCourt.id, startTime, endTime },
          create: { matchId: match.id, courtId: bestCourt.id, startTime, endTime }
        })
      );
      
      scheduleUpdates.push(
        prisma.match.update({
          where: { id: match.id },
          data: { status: 'SCHEDULED', startTime, endTime }
        })
      );
    }

    // Execute Transaction
    await prisma.$transaction(scheduleUpdates);
    return { success: true, scheduled: scheduleUpdates.length / 2 };
  }
}
