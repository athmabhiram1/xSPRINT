import { Router } from 'express';
import {
  createEvent,
  getAllEvents,
  getEventsByTournament,
  registerPlayerToEvent,
  getEventRegistrations
} from '../controllers/EventController';
import { requireAuth, requireRole } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

router.post('/', requireAuth, requireRole(Role.ADMIN, Role.ORGANIZER), createEvent);
router.get('/', getAllEvents);
router.get('/tournament/:tournamentId', getEventsByTournament);
router.post('/register', requireAuth, registerPlayerToEvent);
router.get('/:eventId/registrations', getEventRegistrations);

export default router;

