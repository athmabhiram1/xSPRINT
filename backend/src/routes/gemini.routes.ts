import { Router } from 'express';
import { getTournamentInsights, chatWithAI, analyzeMatch } from '../controllers/GeminiController';

const router = Router();

// GET /api/ai/insights/:tournamentId
router.get('/insights/:tournamentId', getTournamentInsights);

// POST /api/ai/chat
router.post('/chat', chatWithAI);

// POST /api/ai/analyze-match
router.post('/analyze-match', analyzeMatch);

export default router;
