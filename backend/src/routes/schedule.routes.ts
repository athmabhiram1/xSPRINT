import { Router } from 'express';
import { generateSchedule, rescheduleMatch, withdrawMatch } from '../controllers/ScheduleController';
import { requireAuth, requireRole } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

// Auto-generate schedule for an event
router.post('/events/:id/generate', requireAuth, requireRole(Role.ADMIN, Role.ORGANIZER), generateSchedule);

// Reschedule a match
router.patch('/matches/:id/reschedule', requireAuth, requireRole(Role.ADMIN, Role.ORGANIZER), rescheduleMatch);

// Handle player withdrawal
router.post('/matches/:id/withdraw', requireAuth, requireRole(Role.ADMIN, Role.ORGANIZER), withdrawMatch);

export default router;
