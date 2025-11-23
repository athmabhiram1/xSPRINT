import { Router } from 'express';
import { createClub, getAllClubs } from '../controllers/ClubController';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Public: View clubs
router.get('/', getAllClubs);

// Protected: Only ADMIN/ORGANIZER can create clubs
router.post('/', requireAuth, requireRole(Role.ADMIN, Role.ORGANIZER), createClub);

export default router;
