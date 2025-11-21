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
exports.getFixture = exports.generateFixture = void 0;
const db_1 = __importDefault(require("../lib/db"));
/**
 * Generate bracket/fixture for an event
 * Creates all matches for a knockout tournament
 */
const generateFixture = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { eventId } = req.params;
    const { playerIds } = req.body;
    if (!Array.isArray(playerIds) || playerIds.length < 2) {
        return res.status(400).json({ error: 'At least 2 players are required' });
    }
    try {
        // Verify all players exist
        const players = yield db_1.default.player.findMany({
            where: { id: { in: playerIds } },
        });
        if (players.length !== playerIds.length) {
            return res.status(400).json({ error: 'One or more player IDs are invalid' });
        }
        // Check if event exists
        const event = yield db_1.default.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        // Calculate rounds needed for single elimination
        const numPlayers = playerIds.length;
        const totalRounds = Math.ceil(Math.log2(numPlayers));
        const totalMatches = Math.pow(2, totalRounds) - 1;
        // Create player registrations
        const registrations = yield Promise.all(playerIds.map((playerId, index) => db_1.default.registration.upsert({
            where: {
                eventId_playerId: {
                    eventId,
                    playerId,
                },
            },
            update: { seed: index + 1 },
            create: {
                eventId,
                playerId,
                seed: index + 1,
            },
        })));
        // Generate bracket structure
        const matches = [];
        let matchId = 1;
        // Round 1: Create initial matches with players
        const firstRoundMatches = Math.ceil(numPlayers / 2);
        for (let i = 0; i < firstRoundMatches; i++) {
            const playerAIndex = i * 2;
            const playerBIndex = i * 2 + 1;
            matches.push({
                eventId,
                round: 1,
                matchNumber: matchId++,
                playerAId: playerIds[playerAIndex] || null,
                playerBId: playerIds[playerBIndex] || null,
                status: playerIds[playerAIndex] && playerIds[playerBIndex] ? 'READY' : 'PENDING',
            });
        }
        // Generate subsequent rounds (empty matches waiting for winners)
        for (let round = 2; round <= totalRounds; round++) {
            const matchesInRound = Math.pow(2, totalRounds - round);
            for (let i = 0; i < matchesInRound; i++) {
                matches.push({
                    eventId,
                    round,
                    matchNumber: matchId++,
                    playerAId: null,
                    playerBId: null,
                    status: 'PENDING',
                });
            }
        }
        // Create all matches in database
        const createdMatches = yield Promise.all(matches.map((match) => db_1.default.match.create({ data: match })));
        // Link matches: Each match's winner goes to next round
        for (let i = 0; i < createdMatches.length; i++) {
            const currentMatch = createdMatches[i];
            if (currentMatch.round < totalRounds) {
                // Calculate which match this feeds into
                const nextMatchIndex = createdMatches.findIndex((m) => m.round === currentMatch.round + 1 && m.matchNumber === Math.ceil(currentMatch.matchNumber / 2));
                if (nextMatchIndex !== -1) {
                    yield db_1.default.match.update({
                        where: { id: currentMatch.id },
                        data: { nextMatchId: createdMatches[nextMatchIndex].id },
                    });
                }
            }
        }
        // Update event with round count
        yield db_1.default.event.update({
            where: { id: eventId },
            data: { rounds: totalRounds },
        });
        res.status(201).json({
            success: true,
            message: 'Fixture generated successfully',
            data: {
                eventId,
                totalRounds,
                totalMatches: createdMatches.length,
                matches: createdMatches,
            },
        });
    }
    catch (error) {
        console.error('Error generating fixture:', error);
        res.status(500).json({ error: 'Failed to generate fixture', details: error.message });
    }
});
exports.generateFixture = generateFixture;
/**
 * Get full bracket/fixture for an event
 */
const getFixture = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { eventId } = req.params;
    try {
        const matches = yield db_1.default.match.findMany({
            where: { eventId },
            include: {
                playerA: true,
                playerB: true,
                winner: true,
                umpire: true,
                schedule: {
                    include: {
                        court: true,
                    },
                },
            },
            orderBy: [{ round: 'asc' }, { matchNumber: 'asc' }],
        });
        if (matches.length === 0) {
            return res.status(404).json({ error: 'No fixture found for this event' });
        }
        // Group matches by round
        const groupedByRound = {};
        matches.forEach((match) => {
            if (!groupedByRound[match.round]) {
                groupedByRound[match.round] = [];
            }
            groupedByRound[match.round].push(match);
        });
        res.json({
            success: true,
            data: {
                eventId,
                totalMatches: matches.length,
                rounds: groupedByRound,
                flatMatches: matches,
            },
        });
    }
    catch (error) {
        console.error('Error fetching fixture:', error);
        res.status(500).json({ error: 'Failed to fetch fixture', details: error.message });
    }
});
exports.getFixture = getFixture;
