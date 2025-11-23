import { Router } from 'express';
import { getEventAnalytics } from '../controllers/AnalyticsController';
import { requireAuth, requireRole } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/events/:id/analytics', requireAuth, requireRole(Role.ADMIN, Role.ORGANIZER), getEventAnalytics);

export default router;

