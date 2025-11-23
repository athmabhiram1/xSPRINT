import { Router } from 'express';
import {
  createEvent,
  getEventsByTournament,
  registerPlayerToEvent,
  getEventRegistrations,
  getAllEvents
} from '../controllers/EventController';
import {
  getEventStandings,
  getEventAnalytics
} from '../controllers/LeaderboardController';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Public: View all events
router.get('/', getAllEvents);

// Public: View events and registrations
router.get('/tournament/:tournamentId', getEventsByTournament);
router.get('/:eventId/registrations', getEventRegistrations);

// Public: View leaderboard/standings
router.get('/:eventId/standings', getEventStandings);

// Protected: Analytics (Admin/Organizer only)
router.get('/:eventId/analytics', requireAuth, requireRole(Role.ADMIN, Role.ORGANIZER), getEventAnalytics);

// Protected: Only ADMIN/ORGANIZER can create events and register players
router.post('/', requireAuth, requireRole(Role.ADMIN, Role.ORGANIZER), createEvent);
router.post('/register', requireAuth, requireRole(Role.ADMIN, Role.ORGANIZER), registerPlayerToEvent);

export default router;
