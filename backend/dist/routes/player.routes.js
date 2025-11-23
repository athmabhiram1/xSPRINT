"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PlayerController_1 = require("../controllers/PlayerController");
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Public: View players
router.get('/', PlayerController_1.getAllPlayers);
router.get('/:id', PlayerController_1.getPlayerById);
// Protected: Only ADMIN/ORGANIZER can create/modify players
router.post('/', auth_1.requireAuth, (0, auth_1.requireRole)(client_1.Role.ADMIN, client_1.Role.ORGANIZER), PlayerController_1.createPlayer);
router.put('/:id', auth_1.requireAuth, (0, auth_1.requireRole)(client_1.Role.ADMIN, client_1.Role.ORGANIZER), PlayerController_1.updatePlayer);
router.delete('/:id', auth_1.requireAuth, (0, auth_1.requireRole)(client_1.Role.ADMIN, client_1.Role.ORGANIZER), PlayerController_1.deletePlayer);
exports.default = router;
