import { Router } from 'express';
import {
  getBasicLeaderboard,
  getDetailedLeaderboard
} from '../controllers/LeaderboardController';
import { requireAuth, requireRole } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/events/:id/leaderboard/basic', getBasicLeaderboard);
router.get('/events/:id/leaderboard/detailed', requireAuth, requireRole(Role.ADMIN, Role.ORGANIZER), getDetailedLeaderboard);
router.get('/events/:id/standings', getBasicLeaderboard);

export default router;

