"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const MatchController_1 = require("../controllers/MatchController");
const auth_1 = require("../middlewares/auth");
const rate_limit_1 = require("../middleware/rate-limit");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Public route to view matches
router.get('/:id', MatchController_1.getMatch);
// Validate match code (rate limited, requires auth)
router.post('/validate-code', auth_1.requireAuth, rate_limit_1.rateLimitMatchCode, MatchController_1.validateMatchCode);
// Submit match result (Umpire/Admin only with auth check first)
router.post('/result', auth_1.requireAuth, (0, auth_1.requireRole)(client_1.Role.UMPIRE, client_1.Role.ADMIN), MatchController_1.submitMatchResult);
// Generate match code (Admin/Organizer only)
router.post('/:matchId/generate-code', auth_1.requireAuth, (0, auth_1.requireRole)(client_1.Role.ADMIN, client_1.Role.ORGANIZER), MatchController_1.generateMatchCode);
exports.default = router;
