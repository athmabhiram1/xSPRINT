import { Router } from 'express';
import {
  createPlayer,
  getAllPlayers,
  getPlayerById,
  updatePlayer,
  deletePlayer,
} from '../controllers/PlayerController';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Public: View players
router.get('/', getAllPlayers);
router.get('/:id', getPlayerById);

// Protected: Only ADMIN/ORGANIZER can create/modify players
router.post('/', requireAuth, requireRole(Role.ADMIN, Role.ORGANIZER), createPlayer);
router.put('/:id', requireAuth, requireRole(Role.ADMIN, Role.ORGANIZER), updatePlayer);
router.delete('/:id', requireAuth, requireRole(Role.ADMIN, Role.ORGANIZER), deletePlayer);

export default router;
