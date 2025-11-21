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
exports.FixtureEngine = void 0;
const db_1 = __importDefault(require("../lib/db"));
class FixtureEngine {
    /**
     * CRITICAL: Propagates a winner to the next round
     * Call this immediately after a match result is submitted.
     */
    propagateWinner(matchId, winnerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const match = yield db_1.default.match.findUnique({
                where: { id: matchId },
                include: { nextMatch: true }
            });
            if (!match || !match.nextMatchId) {
                return; // Grand final or invalid match
            }
            // Determine target slot in next match
            // If current match is odd numbered (1, 3, 5), it goes to Player A slot
            // If even (2, 4, 6), it goes to Player B slot
            const isPlayerA = match.matchNumber % 2 !== 0;
            const updateData = {};
            if (isPlayerA) {
                updateData.playerAId = winnerId;
            }
            else {
                updateData.playerBId = winnerId;
            }
            // Check if the next match is now ready (both players present)
            // We need to fetch the CURRENT state of the next match to see if the OTHER slot is filled
            const nextMatch = yield db_1.default.match.findUnique({
                where: { id: match.nextMatchId },
                select: { playerAId: true, playerBId: true }
            });
            const nextPlayerA = isPlayerA ? winnerId : nextMatch === null || nextMatch === void 0 ? void 0 : nextMatch.playerAId;
            const nextPlayerB = !isPlayerA ? winnerId : nextMatch === null || nextMatch === void 0 ? void 0 : nextMatch.playerBId;
            if (nextPlayerA && nextPlayerB) {
                updateData.status = 'READY'; // Ready for scheduling
            }
            // Update the next match
            yield db_1.default.match.update({
                where: { id: match.nextMatchId },
                data: updateData
            });
        });
    }
}
exports.FixtureEngine = FixtureEngine;
