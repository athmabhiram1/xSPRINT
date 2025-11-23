"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePlayer = exports.updatePlayer = exports.getPlayerById = exports.getAllPlayers = exports.createPlayer = void 0;
const db_1 = __importDefault(require("../lib/db"));
// Create a new player with unique ID and details
const createPlayer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, gender, weight, category, description, clubId } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Player name is required' });
    }
    try {
        const player = yield db_1.default.player.create({
            data: {
                name,
                email,
                gender,
                weight,
                category,
                description,
                clubId,
            },
        });
        res.status(201).json({
            success: true,
            message: 'Player created successfully',
            player,
        });
    }
    catch (error) {
        console.error('Error creating player:', error);
        res.status(500).json({ error: 'Failed to create player', details: error.message });
    }
});
exports.createPlayer = createPlayer;
// Get all players
const getAllPlayers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const players = yield db_1.default.player.findMany({
            include: {
                club: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.json({ success: true, players });
    }
    catch (error) {
        console.error('Error fetching players:', error);
        res.status(500).json({ error: 'Failed to fetch players', details: error.message });
    }
});
exports.getAllPlayers = getAllPlayers;
// Get a single player by ID
const getPlayerById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const player = yield db_1.default.player.findUnique({
            where: { id },
            include: {
                club: true,
                registrations: {
                    include: {
                        event: true,
                    },
                },
            },
        });
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }
        res.json({ success: true, player });
    }
    catch (error) {
        console.error('Error fetching player:', error);
        res.status(500).json({ error: 'Failed to fetch player', details: error.message });
    }
});
exports.getPlayerById = getPlayerById;
// Update player details
const updatePlayer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, email, gender, weight, category, description, clubId } = req.body;
    try {
        const player = yield db_1.default.player.update({
            where: { id },
            data: {
                name,
                email,
                gender,
                weight,
                category,
                description,
                clubId,
            },
        });
        res.json({
            success: true,
            message: 'Player updated successfully',
            player,
        });
    }
    catch (error) {
        console.error('Error updating player:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Player not found' });
        }
        res.status(500).json({ error: 'Failed to update player', details: error.message });
    }
});
exports.updatePlayer = updatePlayer;
// Delete a player
const deletePlayer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield db_1.default.player.delete({
            where: { id },
        });
        res.json({
            success: true,
            message: 'Player deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting player:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Player not found' });
        }
        res.status(500).json({ error: 'Failed to delete player', details: error.message });
    }
});
exports.deletePlayer = deletePlayer;
