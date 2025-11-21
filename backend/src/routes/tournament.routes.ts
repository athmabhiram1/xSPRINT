import { Router } from 'express';
import { createTournament, getAllTournaments, getTournamentById } from '../controllers/TournamentController';

const router = Router();

router.post('/', createTournament);
router.get('/', getAllTournaments);
router.get('/:id', getTournamentById);

export default router;
