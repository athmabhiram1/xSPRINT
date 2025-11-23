import { Response } from 'express';
import { LeaderboardService } from '../services/LeaderboardService';
import { asyncHandler } from '../middlewares/asyncHandler';
import { ok, fail } from '../utils/responseFormatter';
import { AuthRequest } from '../middlewares/auth';

const leaderboardService = new LeaderboardService();

export const getBasicLeaderboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json(fail('Event ID is required'));
  }

  try {
    const leaderboard = await leaderboardService.getEventLeaderboard(id);
    return res.json(ok(leaderboard));
  } catch (error: any) {
    if (error.message === 'Event not found') {
      return res.status(404).json(fail('Event not found'));
    }
    return res.status(500).json(fail('Failed to fetch leaderboard'));
  }
});

export const getDetailedLeaderboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json(fail('Event ID is required'));
  }

  try {
    const leaderboard = await leaderboardService.getEventLeaderboard(id);
    return res.json(ok(leaderboard));
  } catch (error: any) {
    if (error.message === 'Event not found') {
      return res.status(404).json(fail('Event not found'));
    }
    return res.status(500).json(fail('Failed to fetch detailed leaderboard'));
  }
});

// Export analytics function
export const getEventStandings = getBasicLeaderboard;
export const getEventAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json(fail('Event ID is required'));
  }

  try {
    const analytics = await leaderboardService.getEventAnalytics(id);
    return res.json(ok(analytics));
  } catch (error: any) {
    if (error.message === 'Event not found') {
      return res.status(404).json(fail('Event not found'));
    }
    return res.status(500).json(fail('Failed to fetch analytics'));
  }
});
