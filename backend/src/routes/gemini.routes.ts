import { Router } from 'express';
import { getTournamentInsights } from '../controllers/GeminiController';

const router = Router();

// GET /api/ai/insights/:tournamentId
router.get('/insights/:tournamentId', getTournamentInsights);

export default router;
