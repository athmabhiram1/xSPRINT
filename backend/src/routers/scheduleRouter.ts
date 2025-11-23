import { Router } from 'express';
import {
  generateSchedule,
  rescheduleMatch,
  withdrawMatch
} from '../controllers/ScheduleController';
import { requireAuth, requireRole } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

router.post('/events/:id/generate', requireAuth, requireRole(Role.ADMIN, Role.ORGANIZER), generateSchedule);
router.post('/matches/:id/reschedule', requireAuth, requireRole(Role.ADMIN, Role.ORGANIZER), rescheduleMatch);
router.post('/matches/:id/withdraw', requireAuth, withdrawMatch);

export default router;

