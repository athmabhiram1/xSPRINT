"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const FixtureController_1 = require("../controllers/FixtureController");
const router = (0, express_1.Router)();
// Generate fixture/bracket for an event
router.post('/generate/:eventId', FixtureController_1.generateFixture);
// NEW: Preview fixtures without committing to database
router.post('/preview/:eventId', FixtureController_1.previewFixtures);
// NEW: Get fairness score for existing fixtures
router.get('/fairness-score/:eventId', FixtureController_1.getFairnessScore);
// NEW: Rollback fixtures to previous state
router.post('/rollback/:eventId', FixtureController_1.rollbackFixtures);
// Schedule matches for an event
router.post('/schedule/:eventId', FixtureController_1.scheduleFixture);
// Get fixture/bracket for an event
router.get('/event/:eventId', FixtureController_1.getFixture);
exports.default = router;
