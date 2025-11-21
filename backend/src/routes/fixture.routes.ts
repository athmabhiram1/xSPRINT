import { Router } from 'express';
import { generateFixture, getFixture } from '../controllers/FixtureController';

const router = Router();

// Generate fixture/bracket for an event
router.post('/:eventId/generate', generateFixture);

// Get fixture/bracket for an event
router.get('/:eventId', getFixture);

export default router;
