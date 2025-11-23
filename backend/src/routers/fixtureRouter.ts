import { Router } from 'express';
import { generateFixtures } from '../controllers/FixtureController';
import { requireAuth, requireRole } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

router.post('/events/:id/fixtures/generate', requireAuth, requireRole(Role.ADMIN, Role.ORGANIZER), generateFixtures);

export default router;
