import { Router } from 'express';
import {
  submitMatchResult,
  validateMatchCode,
  generateMatchCode,
  getMatch
} from '../controllers/MatchController';
import { requireAuth, requireRole } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/:id', getMatch);
router.post('/:id/code/generate', requireAuth, requireRole(Role.ADMIN, Role.ORGANIZER), generateMatchCode);
router.post('/code/validate', requireAuth, validateMatchCode);
router.post('/result', requireAuth, submitMatchResult);

export default router;

