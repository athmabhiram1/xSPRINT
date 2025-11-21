import { Router } from 'express';
import { createClub, getAllClubs } from '../controllers/ClubController';

const router = Router();

router.post('/', createClub);
router.get('/', getAllClubs);

export default router;
