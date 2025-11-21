import { Router } from 'express';
import {
  createEvent,
  getEventsByTournament,
  registerPlayerToEvent,
  getEventRegistrations
} from '../controllers/EventController';

const router = Router();

router.post('/', createEvent);
router.get('/tournament/:tournamentId', getEventsByTournament);
router.post('/register', registerPlayerToEvent);
router.get('/:eventId/registrations', getEventRegistrations);

export default router;
