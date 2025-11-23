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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMatch = exports.generateMatchCode = exports.validateMatchCode = exports.submitMatchResult = void 0;
const db_1 = require("../lib/db");
const client_1 = require("@prisma/client");
const FixtureEngineEnhanced_1 = require("../services/FixtureEngineEnhanced");
const MatchCodeService_1 = require("../services/MatchCodeService");
const asyncHandler_1 = require("../middlewares/asyncHandler");
const responseFormatter_1 = require("../utils/responseFormatter");
const validation_1 = require("../utils/validation");
const cache_1 = require("../utils/cache");
const logger_1 = require("../utils/logger");
const codeService = new MatchCodeService_1.MatchCodeService();
const fixtureEngine = new FixtureEngineEnhanced_1.FixtureEngine();
exports.submitMatchResult = [
    (0, validation_1.validateBody)(validation_1.matchResultSchema),
    (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { matchId, matchCode, score, winnerId } = req.body;
        if (!req.user) {
            return res.status(401).json((0, responseFormatter_1.fail)('Authentication required'));
        }
        const match = yield db_1.prisma.match.findUnique({
            where: { id: matchId },
            select: { id: true, status: true, eventId: true }
        });
        if (!match) {
            return res.status(404).json((0, responseFormatter_1.fail)('Match not found'));
        }
        if (match.status === client_1.MatchStatus.COMPLETED) {
            return res.status(400).json((0, responseFormatter_1.fail)('Match already completed'));
        }
        if (match.status !== client_1.MatchStatus.PENDING && match.status !== client_1.MatchStatus.SCHEDULED) {
            return res.status(400).json((0, responseFormatter_1.fail)('Invalid match status'));
        }
        const isValid = yield codeService.verifyCode(matchId, matchCode, req.user.id, req.ip);
        if (!isValid) {
            return res.status(403).json((0, responseFormatter_1.fail)('Invalid or expired match code'));
        }
        yield db_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            yield tx.match.update({
                where: { id: matchId },
                data: {
                    score,
                    winnerId,
                    status: client_1.MatchStatus.COMPLETED,
                    endTime: new Date(),
                }
            });
            yield tx.matchCode.update({
                where: { matchId },
                data: { isActive: false, expiresAt: new Date() }
            });
            yield tx.matchResultAudit.create({
                data: {
                    matchId,
                    actorId: req.user.id,
                    action: 'SUBMIT_RESULT',
                    payload: {
                        winnerId,
                        score,
                        timestamp: new Date().toISOString(),
                        ip: req.ip
                    }
                }
            });
        }));
        yield fixtureEngine.propagateWinner(matchId, winnerId);
        (0, cache_1.invalidateCache)(`match:${matchId}:*`);
        (0, cache_1.invalidateCache)(`event:${match.eventId}:*`);
        (0, cache_1.invalidateCache)(`leaderboard:*`);
        (0, logger_1.logInfo)('Match result submitted', { matchId, winnerId, eventId: match.eventId, userId: req.user.id });
        return res.json((0, responseFormatter_1.ok)({ success: true }));
    }))
];
exports.validateMatchCode = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { matchId, code } = req.body;
    if (!matchId || !code) {
        return res.status(400).json((0, responseFormatter_1.fail)('Match ID and code are required'));
    }
    if (!req.user) {
        return res.status(401).json((0, responseFormatter_1.fail)('Authentication required'));
    }
    const isValid = yield codeService.verifyCode(matchId, code, req.user.id, req.ip);
    if (!isValid) {
        return res.status(403).json((0, responseFormatter_1.fail)('Invalid or expired match code'));
    }
    const match = yield db_1.prisma.match.findUnique({
        where: { id: matchId },
        include: {
            playerA: { include: { club: true } },
            playerB: { include: { club: true } },
            winner: true,
            schedule: { include: { court: true } },
            event: true
        }
    });
    if (!match) {
        return res.status(404).json((0, responseFormatter_1.fail)('Match not found'));
    }
    return res.json((0, responseFormatter_1.ok)(match));
}));
exports.generateMatchCode = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { assignedUmpireId } = req.body;
    if (!id || !assignedUmpireId) {
        return res.status(400).json((0, responseFormatter_1.fail)('Match ID and assignedUmpireId are required'));
    }
    const rawCode = yield codeService.generateCodeForMatch(id, assignedUmpireId);
    const umpire = yield db_1.prisma.user.findUnique({
        where: { id: assignedUmpireId },
        select: { id: true, name: true, email: true, role: true }
    });
    const matchCode = yield db_1.prisma.matchCode.findUnique({
        where: { matchId: id },
        select: { expiresAt: true }
    });
    return res.json((0, responseFormatter_1.ok)({
        matchCode: rawCode,
        assignedUmpire: umpire,
        expiresAt: matchCode === null || matchCode === void 0 ? void 0 : matchCode.expiresAt
    }));
}));
exports.getMatch = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const match = yield db_1.prisma.match.findUnique({
        where: { id },
        include: {
            playerA: { include: { club: true } },
            playerB: { include: { club: true } },
            winner: true,
            schedule: { include: { court: true } },
            event: true
        }
    });
    if (!match) {
        return res.status(404).json((0, responseFormatter_1.fail)('Match not found'));
    }
    return res.json((0, responseFormatter_1.ok)(match));
}));
