import { Router } from 'express';
import {
    generateFixture,
    getFixture,
    scheduleFixture,
    previewFixtures,
    getFairnessScore,
    rollbackFixtures
} from '../controllers/FixtureController';

const router = Router();

// Generate fixture/bracket for an event
router.post('/generate/:eventId', generateFixture);

// NEW: Preview fixtures without committing to database
router.post('/preview/:eventId', previewFixtures);

// NEW: Get fairness score for existing fixtures
router.get('/fairness-score/:eventId', getFairnessScore);

// NEW: Rollback fixtures to previous state
router.post('/rollback/:eventId', rollbackFixtures);

// Schedule matches for an event
router.post('/schedule/:eventId', scheduleFixture);

// Get fixture/bracket for an event
router.get('/event/:eventId', getFixture);

export default router;
