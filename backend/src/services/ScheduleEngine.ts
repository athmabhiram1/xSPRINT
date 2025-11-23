import { prisma } from '../lib/db';
import { addMinutes, isBefore, isAfter } from 'date-fns';
import { MatchStatus } from '@prisma/client';

interface SchedulingConfig {
  restTimeMinutes: number;
  matchDurationMinutes: number;
  changeoverMinutes: number;
}

interface SchedulingMetrics {
  courtUtilization: Record<string, { busy: number; total: number; percentage: number }>;
  restTimeViolations: Array<{ matchId: string; playerId: string; restTime: number }>;
  sameClubMatchCount: number;
}

export class ScheduleEngine {
  private readonly DEFAULT_CONFIG: SchedulingConfig = {
    restTimeMinutes: 20,
    matchDurationMinutes: 45,
    changeoverMinutes: 5
  };

  async generateSchedule(
    eventId: string,
    options?: {
      startTime?: Date;
      matchDuration?: number;
      restTime?: number;
      changeover?: number;
    }
  ) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tournament: {
          include: { courts: true }
        }
      }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (!event.tournament.courts || event.tournament.courts.length === 0) {
      throw new Error('No courts available for this tournament');
    }

    const config: SchedulingConfig = {
      restTimeMinutes: options?.restTime || this.DEFAULT_CONFIG.restTimeMinutes,
      matchDurationMinutes: options?.matchDuration || this.DEFAULT_CONFIG.matchDurationMinutes,
      changeoverMinutes: options?.changeover || this.DEFAULT_CONFIG.changeoverMinutes
    };

    const startTime = options?.startTime || new Date();

    const allMatches = await prisma.match.findMany({
      where: { eventId },
      include: {
        previousMatches: {
          select: { id: true, endTime: true }
        },
        playerA: {
          select: { id: true, name: true }
        },
        playerB: {
          select: { id: true, name: true }
        }
      },
      orderBy: { round: 'asc' }
    });

    const courtFreeTime: Record<string, Date> = {};
    event.tournament.courts.forEach((court: any) => {
      courtFreeTime[court.id] = new Date(startTime);
    });

    const playerFreeTime: Record<string, Date> = {};
    const playerMatches: Record<string, any[]> = {};

    const scheduleUpdates: any[] = [];
    const readyMatches: any[] = [];

    for (const match of allMatches) {
      if (match.status === MatchStatus.COMPLETED && match.endTime) {
        const endTime = new Date(match.endTime);
        if (match.playerAId) {
          playerFreeTime[match.playerAId] = endTime;
          if (!playerMatches[match.playerAId]) playerMatches[match.playerAId] = [];
          playerMatches[match.playerAId].push({ matchId: match.id, endTime });
        }
        if (match.playerBId) {
          playerFreeTime[match.playerBId] = endTime;
          if (!playerMatches[match.playerBId]) playerMatches[match.playerBId] = [];
          playerMatches[match.playerBId].push({ matchId: match.id, endTime });
        }
        continue;
      }

      const isReady = this.isMatchReady(match, playerFreeTime, config.restTimeMinutes);
      if (isReady) {
        readyMatches.push(match);
      }
    }

    readyMatches.sort((a, b) => {
      const aDeps = a.previousMatches.length;
      const bDeps = b.previousMatches.length;
      if (aDeps !== bDeps) return aDeps - bDeps;
      return a.round - b.round;
    });

    for (const match of readyMatches) {
      let dependencyTime = new Date(startTime);

      if (match.previousMatches.length > 0) {
        const parentEndTimes = match.previousMatches
          .map((p: any) => p.endTime ? new Date(p.endTime).getTime() : 0)
          .filter((t: number) => t > 0);

        if (parentEndTimes.length > 0) {
          dependencyTime = new Date(Math.max(...parentEndTimes));
        }
      }

      const pA_Free = match.playerAId ? (playerFreeTime[match.playerAId] || new Date(startTime)) : new Date(startTime);
      const pB_Free = match.playerBId ? (playerFreeTime[match.playerBId] || new Date(startTime)) : new Date(startTime);

      const playersReadyTime = new Date(Math.max(
        pA_Free.getTime() + config.restTimeMinutes * 60000,
        pB_Free.getTime() + config.restTimeMinutes * 60000
      ));

      let possibleStart = new Date(Math.max(dependencyTime.getTime(), playersReadyTime.getTime()));

      let bestCourt = event.tournament.courts[0];
      let minStartTime = new Date(8640000000000000);

      for (const court of event.tournament.courts) {
        const courtReady = courtFreeTime[court.id];
        const actualStart = new Date(Math.max(courtReady.getTime(), possibleStart.getTime()));

        if (isBefore(actualStart, minStartTime)) {
          minStartTime = actualStart;
          bestCourt = court;
        }
      }

      const matchStartTime = minStartTime;
      const matchEndTime = addMinutes(matchStartTime, config.matchDurationMinutes);

      courtFreeTime[bestCourt.id] = addMinutes(matchEndTime, config.changeoverMinutes);
      if (match.playerAId) {
        playerFreeTime[match.playerAId] = matchEndTime;
        if (!playerMatches[match.playerAId]) playerMatches[match.playerAId] = [];
        playerMatches[match.playerAId].push({ matchId: match.id, endTime: matchEndTime });
      }
      if (match.playerBId) {
        playerFreeTime[match.playerBId] = matchEndTime;
        if (!playerMatches[match.playerBId]) playerMatches[match.playerBId] = [];
        playerMatches[match.playerBId].push({ matchId: match.id, endTime: matchEndTime });
      }

      scheduleUpdates.push(
        prisma.scheduleBlock.upsert({
          where: { matchId: match.id },
          update: { courtId: bestCourt.id, startTime: matchStartTime, endTime: matchEndTime },
          create: { matchId: match.id, courtId: bestCourt.id, startTime: matchStartTime, endTime: matchEndTime }
        })
      );

      scheduleUpdates.push(
        prisma.match.update({
          where: { id: match.id },
          data: { status: MatchStatus.SCHEDULED, startTime: matchStartTime, endTime: matchEndTime }
        })
      );
    }

    await prisma.$transaction(scheduleUpdates);

    return {
      scheduled: scheduleUpdates.length / 2,
      totalMatches: allMatches.length
    };
  }

  private isMatchReady(match: any, playerFreeTime: Record<string, Date>, restTime: number): boolean {
    if (match.previousMatches.length === 0) return true;

    for (const prevMatch of match.previousMatches) {
      if (!prevMatch.endTime) return false;
      const endTime = new Date(prevMatch.endTime);
      const now = new Date();
      if (isAfter(endTime, now)) return false;
    }

    return true;
  }

  async rescheduleMatch(matchId: string, newStartTime: Date, courtId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { schedule: true, event: { include: { tournament: { include: { courts: true } } } } }
    });

    if (!match) {
      throw new Error('Match not found');
    }

    const matchDuration = 45;
    const newEndTime = addMinutes(newStartTime, matchDuration);

    await prisma.$transaction([
      prisma.scheduleBlock.upsert({
        where: { matchId },
        update: { courtId, startTime: newStartTime, endTime: newEndTime },
        create: { matchId, courtId, startTime: newStartTime, endTime: newEndTime }
      }),
      prisma.match.update({
        where: { id: matchId },
        data: { startTime: newStartTime, endTime: newEndTime }
      })
    ]);

    return { success: true };
  }

  async handleWithdrawal(matchId: string, withdrawingPlayerId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { nextMatch: true }
    });

    if (!match) {
      throw new Error('Match not found');
    }

    const winnerId = match.playerAId === withdrawingPlayerId ? match.playerBId : match.playerAId;

    if (!winnerId) {
      throw new Error('Cannot determine winner');
    }

    await prisma.match.update({
      where: { id: matchId },
      data: {
        winnerId,
        status: MatchStatus.COMPLETED,
        endTime: new Date(),
        score: { note: 'Walkover', withdrawingPlayer: withdrawingPlayerId }
      }
    });

    if (match.nextMatchId) {
      const { FixtureEngine } = await import('./FixtureEngineEnhanced');
      const fixtureEngine = new FixtureEngine();
      await fixtureEngine.propagateWinner(matchId, winnerId);
    }

    return { success: true, winnerId };
  }

  async getSchedulingMetrics(eventId: string): Promise<SchedulingMetrics> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tournament: { include: { courts: true } },
        matches: {
          include: {
            schedule: { include: { court: true } },
            playerA: true,
            playerB: true
          }
        }
      }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const courtUtilization: Record<string, { busy: number; total: number; percentage: number }> = {};
    const restTimeViolations: Array<{ matchId: string; playerId: string; restTime: number }> = [];
    let sameClubMatchCount = 0;

    const startTime = event.matches[0]?.startTime ? new Date(event.matches[0].startTime) : new Date();
    const endTime = event.matches.reduce((latest: Date | null, m: any) => {
      if (m.endTime) {
        const et = new Date(m.endTime);
        return !latest || isAfter(et, latest) ? et : latest;
      }
      return latest;
    }, null) || new Date();

    const totalTime = endTime.getTime() - startTime.getTime();

    for (const court of event.tournament.courts) {
      const courtMatches = event.matches.filter((m: any) =>
        m.schedule?.courtId === court.id && m.startTime && m.endTime
      );

      let busyTime = 0;
      for (const m of courtMatches) {
        if (m.endTime && m.startTime) {
          const duration = new Date(m.endTime).getTime() - new Date(m.startTime).getTime();
          busyTime += duration;
        }
      }

      courtUtilization[court.id] = {
        busy: busyTime,
        total: totalTime,
        percentage: totalTime > 0 ? (busyTime / totalTime) * 100 : 0
      };
    }

    const playerMatchTimes: Record<string, Array<{ matchId: string; endTime: Date }>> = {};

    for (const match of event.matches) {
      if (match.playerA?.clubId && match.playerB?.clubId && match.playerA.clubId === match.playerB.clubId) {
        sameClubMatchCount++;
      }

      if (match.endTime && match.playerAId) {
        if (!playerMatchTimes[match.playerAId]) playerMatchTimes[match.playerAId] = [];
        playerMatchTimes[match.playerAId].push({ matchId: match.id, endTime: new Date(match.endTime) });
      }
      if (match.endTime && match.playerBId) {
        if (!playerMatchTimes[match.playerBId]) playerMatchTimes[match.playerBId] = [];
        playerMatchTimes[match.playerBId].push({ matchId: match.id, endTime: new Date(match.endTime) });
      }
    }

    for (const [playerId, matches] of Object.entries(playerMatchTimes)) {
      matches.sort((a, b) => a.endTime.getTime() - b.endTime.getTime());

      for (let i = 1; i < matches.length; i++) {
        const nextMatch = event.matches.find((m: any) =>
          (m.playerAId === playerId || m.playerBId === playerId) &&
          m.id !== matches[i - 1].matchId &&
          m.startTime
        );


        if (nextMatch && nextMatch.startTime) {
          const restTime = (new Date(nextMatch.startTime).getTime() - matches[i - 1].endTime.getTime()) / 60000;
          if (restTime < 20) {
            restTimeViolations.push({
              matchId: nextMatch.id,
              playerId,
              restTime: Math.round(restTime)
            });
          }
        }
      }
    }

    return {
      courtUtilization,
      restTimeViolations,
      sameClubMatchCount
    };
  }
}
