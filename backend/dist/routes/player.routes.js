"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PlayerController_1 = require("../controllers/PlayerController");
const router = (0, express_1.Router)();
// Player CRUD routes
router.post('/', PlayerController_1.createPlayer);
router.get('/', PlayerController_1.getAllPlayers);
router.get('/:id', PlayerController_1.getPlayerById);
router.put('/:id', PlayerController_1.updatePlayer);
router.delete('/:id', PlayerController_1.deletePlayer);
exports.default = router;
