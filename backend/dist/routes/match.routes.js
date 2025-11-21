"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const MatchController_1 = require("../controllers/MatchController");
const router = (0, express_1.Router)();
// Public route to view matches
// router.get('/:id', getMatch);
// Umpire/Admin only route to submit results
// The code verification logic inside submitMatchResult acts as a second layer of security
// allowing temporary umpires without full accounts to score if they have the code.
router.post('/result', MatchController_1.submitMatchResult);
// Route to generate code (Admin only)
// router.post('/:id/code', protect, authorize('ADMIN'), generateMatchCode);
exports.default = router;
