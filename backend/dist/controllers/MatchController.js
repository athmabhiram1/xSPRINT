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
exports.submitMatchResult = void 0;
const db_1 = __importDefault(require("../lib/db"));
const MatchCodeService_1 = require("../services/MatchCodeService");
const FixtureEngine_1 = require("../services/FixtureEngine");
const server_1 = require("../server");
const codeService = new MatchCodeService_1.MatchCodeService();
const fixtureEngine = new FixtureEngine_1.FixtureEngine();
const submitMatchResult = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { matchId, code, score, winnerId } = req.body;
    try {
        // 1. Security Check: Verify Code
        const isValid = yield codeService.verifyCode(matchId, code);
        if (!isValid) {
            return res.status(403).json({ error: "Invalid or expired match code" });
        }
        // 2. Fetch Match
        const match = yield db_1.default.match.findUnique({ where: { id: matchId } });
        if (!match)
            return res.status(404).json({ error: "Match not found" });
        if (match.status === 'COMPLETED') {
            return res.status(400).json({ error: "Match already completed" });
        }
        // 3. Transaction: Update Match & Invalidate Code
        yield db_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Update Match
            yield tx.match.update({
                where: { id: matchId },
                data: {
                    score,
                    winnerId,
                    status: 'COMPLETED',
                    endTime: new Date() // Set actual end time
                }
            });
            // Invalidate Code (Rule #2)
            yield tx.matchCode.update({
                where: { matchId },
                data: { isActive: false }
            });
        }));
        // 4. Post-Transaction: Propagate & Realtime
        yield fixtureEngine.propagateWinner(matchId, winnerId);
        // 5. Realtime Emit
        server_1.socketIo.to(`match_${matchId}`).emit('MATCH_UPDATED', { matchId, status: 'COMPLETED', winnerId, score });
        server_1.socketIo.emit('LEADERBOARD_UPDATED', { eventId: match.eventId });
        res.json({ success: true, message: "Match completed and processed" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error processing result" });
    }
});
exports.submitMatchResult = submitMatchResult;
