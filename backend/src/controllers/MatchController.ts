import { Request, Response } from 'express';
import prisma from '../lib/db';
import { MatchCodeService } from '../services/MatchCodeService';
import { FixtureEngine } from '../services/FixtureEngine';
import { socketIo } from '../server';

const codeService = new MatchCodeService();
const fixtureEngine = new FixtureEngine();

export const submitMatchResult = async (req: Request, res: Response) => {
  const { matchId, code, score, winnerId } = req.body;

  try {
    // 1. Security Check: Verify Code
    const isValid = await codeService.verifyCode(matchId, code);
    if (!isValid) {
      return res.status(403).json({ error: "Invalid or expired match code" });
    }

    // 2. Fetch Match
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return res.status(404).json({ error: "Match not found" });

    if (match.status === 'COMPLETED') {
      return res.status(400).json({ error: "Match already completed" });
    }

    // 3. Transaction: Update Match & Invalidate Code
    await prisma.$transaction(async (tx: any) => {
      // Update Match
      await tx.match.update({
        where: { id: matchId },
        data: {
          score,
          winnerId,
          status: 'COMPLETED',
          endTime: new Date() // Set actual end time
        }
      });

      // Invalidate Code (Rule #2)
      await tx.matchCode.update({
        where: { matchId },
        data: { isActive: false }
      });
    });

    // 4. Post-Transaction: Propagate & Realtime
    await fixtureEngine.propagateWinner(matchId, winnerId);

    // 5. Realtime Emit
    socketIo.to(`match_${matchId}`).emit('MATCH_UPDATED', { matchId, status: 'COMPLETED', winnerId, score });
    socketIo.emit('LEADERBOARD_UPDATED', { eventId: match.eventId });

    res.json({ success: true, message: "Match completed and processed" });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Server error processing result" });
  }
};
