import { Router } from 'express';
import { submitMatchResult } from '../controllers/MatchController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Public route to view matches
// router.get('/:id', getMatch);

// Umpire/Admin only route to submit results
// The code verification logic inside submitMatchResult acts as a second layer of security
// allowing temporary umpires without full accounts to score if they have the code.
router.post('/result', submitMatchResult);

// Route to generate code (Admin only)
// router.post('/:id/code', protect, authorize('ADMIN'), generateMatchCode);

export default router;
