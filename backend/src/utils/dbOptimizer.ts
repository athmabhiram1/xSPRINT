import { Prisma } from '@prisma/client';

/**
 * Optimize Prisma queries to avoid N+1 problems
 */
export class DbOptimizer {
  /**
   * Batch fetch players with clubs in a single query
   */
  static async batchFetchPlayersWithClubs(playerIds: string[]) {
    if (playerIds.length === 0) return [];
    
    return Prisma.validator<Prisma.PlayerFindManyArgs>()({
      where: { id: { in: playerIds } },
      include: { club: true }
    });
  }

  /**
   * Optimize match queries with all necessary relations
   */
  static getMatchWithRelations() {
    return {
      include: {
        playerA: { include: { club: true } },
        playerB: { include: { club: true } },
        winner: true,
        schedule: { include: { court: true } },
        event: { select: { id: true, name: true, type: true } }
      }
    };
  }

  /**
   * Get optimized event query with counts
   */
  static getEventWithCounts() {
    return {
      include: {
        _count: {
          select: {
            registrations: true,
            matches: true
          }
        },
        tournament: {
          select: {
            name: true,
            startDate: true,
            endDate: true
          }
        }
      }
    };
  }
}

