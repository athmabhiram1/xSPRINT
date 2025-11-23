"use strict";
// backend/src/services/FixtureEngine.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixtureEngine = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class FixtureEngine {
    /**
     * MAIN ENTRY POINT
     * Supports: KNOCKOUT (mandatory) + ROUND ROBIN
     */
    generateFixtures(eventId_1) {
        return __awaiter(this, arguments, void 0, function* (eventId, format = 'KNOCKOUT') {
            // Clear old matches (avoid duplicates)
            yield prisma.match.deleteMany({ where: { eventId } });
            // Fetch player registrations
            const registrations = yield prisma.registration.findMany({
                where: { eventId },
                include: { player: true },
                orderBy: { seed: 'asc' } // Important: Get seeded players first
            });
            if (registrations.length < 2) {
                throw new Error("At least 2 players required.");
            }
            const players = registrations.map(r => ({
                id: r.player.id,
                clubId: r.player.clubId,
                seed: r.seed
            }));
            // Delegate based on format
            if (format === 'ROUND_ROBIN') {
                return this.generateRoundRobin(eventId, players);
            }
            return this.generateKnockout(eventId, players);
        });
    }
    // ============================================================
    // 🟨 ROUND ROBIN FIXTURE GENERATION (Berger Algorithm)
    // ============================================================
    generateRoundRobin(eventId, players) {
        return __awaiter(this, void 0, void 0, function* () {
            let numPlayers = players.length;
            const isOdd = numPlayers % 2 !== 0;
            // If odd, add a BYE player
            if (isOdd) {
                players.push({ id: "BYE", clubId: null, seed: null });
                numPlayers++;
            }
            const totalRounds = numPlayers - 1;
            const half = numPlayers / 2;
            const rounds = [];
            let rotation = [...players];
            for (let round = 0; round < totalRounds; round++) {
                const matches = [];
                for (let i = 0; i < half; i++) {
                    const p1 = rotation[i];
                    const p2 = rotation[numPlayers - 1 - i];
                    if (p1.id !== "BYE" && p2.id !== "BYE") {
                        matches.push({
                            eventId,
                            round: round + 1,
                            matchNumber: i + 1,
                            playerAId: p1.id,
                            playerBId: p2.id,
                            status: client_1.MatchStatus.PENDING
                        });
                    }
                }
                rounds.push({ round: round + 1, matches });
                // Rotate players except first
                const fixed = rotation[0];
                const rotating = rotation.slice(1);
                rotating.unshift(rotating.pop());
                rotation = [fixed, ...rotating];
            }
            // Bulk insert matches
            const allMatches = rounds.flatMap(r => r.matches);
            yield prisma.match.createMany({ data: allMatches });
            return {
                type: "ROUND_ROBIN",
                totalRounds,
                totalMatches: allMatches.length
            };
        });
    }
    // ============================================================
    // 🟥 KNOCKOUT FIXTURE GENERATION (Advanced Seeding)
    // ============================================================
    generateKnockout(eventId, players) {
        return __awaiter(this, void 0, void 0, function* () {
            const totalPlayers = players.length;
            // 1. Determine Bracket Size (Power of 2)
            const bracketSize = Math.pow(2, Math.ceil(Math.log2(totalPlayers)));
            const totalRounds = Math.log2(bracketSize);
            // 2. Sort Players by Seed (Registered order is already seeded usually, but ensure it)
            // Players without seeds are treated as lowest seeds
            const sortedPlayers = [...players].sort((a, b) => {
                const seedA = a.seed || 9999;
                const seedB = b.seed || 9999;
                return seedA - seedB;
            });
            // 3. Generate Seeding Positions (Standard Bracket Mapping)
            // e.g. for 8: [1, 8, 4, 5, 3, 6, 2, 7] -> Matches: (1v8), (4v5), (3v6), (2v7)
            const seedOrder = this.getSeedingOrder(bracketSize);
            // 4. Map Players to Positions
            // The 'seedOrder' gives us the seed number that should be in that position (1-indexed)
            // We map this to our actual sorted players list.
            // If seed N > totalPlayers, it's a BYE.
            const bracketSlots = seedOrder.map(seedNum => {
                if (seedNum <= totalPlayers) {
                    return sortedPlayers[seedNum - 1]; // 0-indexed access
                }
                return null; // BYE
            });
            // 5. Create Matches (Bottom-Up or Top-Down? We'll do Round 1 first, then build up)
            // Actually, standard storage is easier if we build the structure first.
            // Let's generate matches for all rounds.
            const matchMap = {}; // round -> matchIndex -> matchId
            // We iterate from Final (Round = totalRounds) down to Round 1
            // But to link IDs, we need to create them.
            // Let's create them in order: Final -> Semis -> Quarters -> ... -> Round 1
            // Wait, to link `nextMatchId`, we need the parent created first.
            // So: Final (Round N) created first. Then Semis (Round N-1) pointing to Final.
            for (let round = totalRounds; round >= 1; round--) {
                const numMatchesInRound = Math.pow(2, totalRounds - round);
                matchMap[round] = {};
                for (let m = 0; m < numMatchesInRound; m++) {
                    // Determine Next Match ID (Parent)
                    let nextMatchId = null;
                    if (round < totalRounds) {
                        const parentMatchIndex = Math.floor(m / 2);
                        nextMatchId = matchMap[round + 1][parentMatchIndex];
                    }
                    // Determine Players (Only for Round 1)
                    let playerAId = null;
                    let playerBId = null;
                    let status = client_1.MatchStatus.PENDING;
                    let winnerId = null;
                    if (round === 1) {
                        const p1 = bracketSlots[m * 2];
                        const p2 = bracketSlots[m * 2 + 1];
                        playerAId = p1 ? p1.id : null;
                        playerBId = p2 ? p2.id : null;
                        // Handle BYEs immediately
                        if (p1 && !p2) {
                            // P1 gets a BYE -> Auto Win
                            winnerId = p1.id;
                            status = client_1.MatchStatus.COMPLETED;
                        }
                        else if (!p1 && p2) {
                            // P2 gets a BYE -> Auto Win
                            winnerId = p2.id;
                            status = client_1.MatchStatus.COMPLETED;
                        }
                        else if (!p1 && !p2) {
                            // Double BYE (shouldn't happen with proper seeding but possible)
                            status = client_1.MatchStatus.CANCELLED;
                        }
                    }
                    // Create Match in DB
                    const match = yield prisma.match.create({
                        data: {
                            eventId,
                            round,
                            matchNumber: m + 1,
                            nextMatchId,
                            playerAId,
                            playerBId,
                            winnerId,
                            status
                        }
                    });
                    matchMap[round][m] = match.id;
                    // Propagate Auto-Wins (BYEs)
                    if (winnerId && nextMatchId) {
                        yield this.propagateWinner(match.id, winnerId);
                    }
                }
            }
            return {
                type: "KNOCKOUT",
                totalRounds,
                totalMatches: Object.values(matchMap).flat().length
            };
        });
    }
    /**
     * Returns the standard seeding order for a bracket of size N (power of 2).
     * e.g. N=4 -> [1, 4, 2, 3] (Matches: 1v4, 2v3)
     * e.g. N=8 -> [1, 8, 4, 5, 2, 7, 3, 6]
     */
    getSeedingOrder(size) {
        if (size === 2)
            return [1, 2];
        const previous = this.getSeedingOrder(size / 2);
        const current = [];
        // For each seed in the previous round, we pair it with (Size + 1 - Seed)
        // The pattern for standard bracket is:
        // Match 1: Seed X vs Seed Y
        // In the array, we want pairs to be adjacent: [1, 8, 4, 5, ...]
        // Wait, the array represents the slots from top to bottom.
        // Slot 0: Seed 1
        // Slot 1: Seed 8
        // Slot 2: Seed 4
        // Slot 3: Seed 5
        // ...
        for (let i = 0; i < previous.length; i++) {
            const seed = previous[i];
            // In the new larger bracket, the match that contained 'seed' splits into two slots.
            // But wait, the recursive method usually generates the *matches* order.
            // Let's stick to the standard "Snake" generation or simple folding.
            // Standard algorithm:
            // Round 1 (size 2): [1, 2]
            // Round 2 (size 4): 1 plays 4, 2 plays 3 -> [1, 4, 2, 3]
            // Round 3 (size 8): 1->(1,8), 4->(4,5), 2->(2,7), 3->(3,6) -> [1, 8, 4, 5, 2, 7, 3, 6]
            current.push(seed);
            current.push(size + 1 - seed);
        }
        return current;
    }
    // ============================================================
    // 🟧 PROPAGATE WINNER TO NEXT MATCH
    // ============================================================
    propagateWinner(matchId, winnerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const match = yield prisma.match.findUnique({
                where: { id: matchId },
                include: { nextMatch: true }
            });
            if (!match || !match.nextMatchId)
                return;
            // Determine if this match was the "Top" (Odd) or "Bottom" (Even) feeder for the next match
            // Match Number 1 & 2 feed into Next Match 1
            // Match Number 3 & 4 feed into Next Match 2
            // If matchNumber is Odd (1, 3, 5), it goes to Slot A (playerAId)
            // If matchNumber is Even (2, 4, 6), it goes to Slot B (playerBId)
            const isTopFeeder = match.matchNumber % 2 !== 0;
            const update = isTopFeeder
                ? { playerAId: winnerId }
                : { playerBId: winnerId };
            // Check if both players are now present in the next match to update status
            const nextMatch = yield prisma.match.findUnique({
                where: { id: match.nextMatchId }
            });
            const existingOpponent = isTopFeeder ? nextMatch === null || nextMatch === void 0 ? void 0 : nextMatch.playerBId : nextMatch === null || nextMatch === void 0 ? void 0 : nextMatch.playerAId;
            if (existingOpponent) {
                update.status = client_1.MatchStatus.PENDING; // Ready to play
            }
            yield prisma.match.update({
                where: { id: match.nextMatchId },
                data: update
            });
        });
    }
}
exports.FixtureEngine = FixtureEngine;
