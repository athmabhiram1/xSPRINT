import { Router } from 'express';
import {
    submitMatchResult,
    getMatch,
    validateMatchCode,
    generateMatchCode
} from '../controllers/MatchController';
import { requireAuth, requireRole } from '../middlewares/auth';
import { rateLimitMatchCode } from '../middleware/rate-limit';
import { Role } from '@prisma/client';

const router = Router();

// Public route to view matches
router.get('/:id', getMatch);

// Validate match code (rate limited, requires auth)
router.post('/validate-code', requireAuth, rateLimitMatchCode, validateMatchCode);

// Submit match result (Umpire/Admin only with auth check first)
router.post('/result', requireAuth, requireRole(Role.UMPIRE, Role.ADMIN), submitMatchResult);

// Generate match code (Admin/Organizer only)
router.post('/:matchId/generate-code', requireAuth, requireRole(Role.ADMIN, Role.ORGANIZER), generateMatchCode);

export default router;
