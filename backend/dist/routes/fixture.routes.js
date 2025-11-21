"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const FixtureController_1 = require("../controllers/FixtureController");
const router = (0, express_1.Router)();
// Generate fixture/bracket for an event
router.post('/:eventId/generate', FixtureController_1.generateFixture);
// Get fixture/bracket for an event
router.get('/:eventId', FixtureController_1.getFixture);
exports.default = router;
