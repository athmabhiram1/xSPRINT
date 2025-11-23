import { Router } from 'express';
import { createTournament, getAllTournaments, getTournamentById } from '../controllers/TournamentController';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Public: View tournaments
router.get('/', getAllTournaments);
router.get('/:id', getTournamentById);

// Protected: Only ADMIN/ORGANIZER can create tournaments
router.post('/', requireAuth, requireRole(Role.ADMIN, Role.ORGANIZER), createTournament);

export default router;
