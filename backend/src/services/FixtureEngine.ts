import prisma from '../lib/db';

export class FixtureEngine {
  /**
   * CRITICAL: Propagates a winner to the next round
   * Call this immediately after a match result is submitted.
   */
  async propagateWinner(matchId: string, winnerId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { nextMatch: true }
    });

    if (!match || !match.nextMatchId) {
      return; // Grand final or invalid match
    }

    // Determine target slot in next match
    // If current match is odd numbered (1, 3, 5), it goes to Player A slot
    // If even (2, 4, 6), it goes to Player B slot
    const isPlayerA = match.matchNumber % 2 !== 0;

    const updateData: any = {};
    if (isPlayerA) {
      updateData.playerAId = winnerId;
    } else {
      updateData.playerBId = winnerId;
    }

    // Check if the next match is now ready (both players present)
    // We need to fetch the CURRENT state of the next match to see if the OTHER slot is filled
    const nextMatch = await prisma.match.findUnique({
      where: { id: match.nextMatchId },
      select: { playerAId: true, playerBId: true }
    });

    const nextPlayerA = isPlayerA ? winnerId : nextMatch?.playerAId;
    const nextPlayerB = !isPlayerA ? winnerId : nextMatch?.playerBId;

    if (nextPlayerA && nextPlayerB) {
      updateData.status = 'READY'; // Ready for scheduling
    }

    // Update the next match
    await prisma.match.update({
      where: { id: match.nextMatchId },
      data: updateData
    });
  }
}