"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.ScheduleEngine = void 0;
const db_1 = require("../lib/db");
const date_fns_1 = require("date-fns");
const client_1 = require("@prisma/client");
class ScheduleEngine {
    constructor() {
        this.DEFAULT_CONFIG = {
            restTimeMinutes: 20,
            matchDurationMinutes: 45,
            changeoverMinutes: 5
        };
    }
    generateSchedule(eventId, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const event = yield db_1.prisma.event.findUnique({
                where: { id: eventId },
                include: {
                    tournament: {
                        include: { courts: true }
                    }
                }
            });
            if (!event) {
                throw new Error('Event not found');
            }
            if (!event.tournament.courts || event.tournament.courts.length === 0) {
                throw new Error('No courts available for this tournament');
            }
            const config = {
                restTimeMinutes: (options === null || options === void 0 ? void 0 : options.restTime) || this.DEFAULT_CONFIG.restTimeMinutes,
                matchDurationMinutes: (options === null || options === void 0 ? void 0 : options.matchDuration) || this.DEFAULT_CONFIG.matchDurationMinutes,
                changeoverMinutes: (options === null || options === void 0 ? void 0 : options.changeover) || this.DEFAULT_CONFIG.changeoverMinutes
            };
            const startTime = (options === null || options === void 0 ? void 0 : options.startTime) || new Date();
            const allMatches = yield db_1.prisma.match.findMany({
                where: { eventId },
                include: {
                    previousMatches: {
                        select: { id: true, endTime: true }
                    },
                    playerA: {
                        select: { id: true, name: true }
                    },
                    playerB: {
                        select: { id: true, name: true }
                    }
                },
                orderBy: { round: 'asc' }
            });
            const courtFreeTime = {};
            event.tournament.courts.forEach((court) => {
                courtFreeTime[court.id] = new Date(startTime);
            });
            const playerFreeTime = {};
            const playerMatches = {};
            const scheduleUpdates = [];
            const readyMatches = [];
            for (const match of allMatches) {
                if (match.status === client_1.MatchStatus.COMPLETED && match.endTime) {
                    const endTime = new Date(match.endTime);
                    if (match.playerAId) {
                        playerFreeTime[match.playerAId] = endTime;
                        if (!playerMatches[match.playerAId])
                            playerMatches[match.playerAId] = [];
                        playerMatches[match.playerAId].push({ matchId: match.id, endTime });
                    }
                    if (match.playerBId) {
                        playerFreeTime[match.playerBId] = endTime;
                        if (!playerMatches[match.playerBId])
                            playerMatches[match.playerBId] = [];
                        playerMatches[match.playerBId].push({ matchId: match.id, endTime });
                    }
                    continue;
                }
                const isReady = this.isMatchReady(match, playerFreeTime, config.restTimeMinutes);
                if (isReady) {
                    readyMatches.push(match);
                }
            }
            readyMatches.sort((a, b) => {
                const aDeps = a.previousMatches.length;
                const bDeps = b.previousMatches.length;
                if (aDeps !== bDeps)
                    return aDeps - bDeps;
                return a.round - b.round;
            });
            for (const match of readyMatches) {
                let dependencyTime = new Date(startTime);
                if (match.previousMatches.length > 0) {
                    const parentEndTimes = match.previousMatches
                        .map((p) => p.endTime ? new Date(p.endTime).getTime() : 0)
                        .filter((t) => t > 0);
                    if (parentEndTimes.length > 0) {
                        dependencyTime = new Date(Math.max(...parentEndTimes));
                    }
                }
                const pA_Free = match.playerAId ? (playerFreeTime[match.playerAId] || new Date(startTime)) : new Date(startTime);
                const pB_Free = match.playerBId ? (playerFreeTime[match.playerBId] || new Date(startTime)) : new Date(startTime);
                const playersReadyTime = new Date(Math.max(pA_Free.getTime() + config.restTimeMinutes * 60000, pB_Free.getTime() + config.restTimeMinutes * 60000));
                let possibleStart = new Date(Math.max(dependencyTime.getTime(), playersReadyTime.getTime()));
                let bestCourt = event.tournament.courts[0];
                let minStartTime = new Date(8640000000000000);
                for (const court of event.tournament.courts) {
                    const courtReady = courtFreeTime[court.id];
                    const actualStart = new Date(Math.max(courtReady.getTime(), possibleStart.getTime()));
                    if ((0, date_fns_1.isBefore)(actualStart, minStartTime)) {
                        minStartTime = actualStart;
                        bestCourt = court;
                    }
                }
                const matchStartTime = minStartTime;
                const matchEndTime = (0, date_fns_1.addMinutes)(matchStartTime, config.matchDurationMinutes);
                courtFreeTime[bestCourt.id] = (0, date_fns_1.addMinutes)(matchEndTime, config.changeoverMinutes);
                if (match.playerAId) {
                    playerFreeTime[match.playerAId] = matchEndTime;
                    if (!playerMatches[match.playerAId])
                        playerMatches[match.playerAId] = [];
                    playerMatches[match.playerAId].push({ matchId: match.id, endTime: matchEndTime });
                }
                if (match.playerBId) {
                    playerFreeTime[match.playerBId] = matchEndTime;
                    if (!playerMatches[match.playerBId])
                        playerMatches[match.playerBId] = [];
                    playerMatches[match.playerBId].push({ matchId: match.id, endTime: matchEndTime });
                }
                scheduleUpdates.push(db_1.prisma.scheduleBlock.upsert({
                    where: { matchId: match.id },
                    update: { courtId: bestCourt.id, startTime: matchStartTime, endTime: matchEndTime },
                    create: { matchId: match.id, courtId: bestCourt.id, startTime: matchStartTime, endTime: matchEndTime }
                }));
                scheduleUpdates.push(db_1.prisma.match.update({
                    where: { id: match.id },
                    data: { status: client_1.MatchStatus.SCHEDULED, startTime: matchStartTime, endTime: matchEndTime }
                }));
            }
            yield db_1.prisma.$transaction(scheduleUpdates);
            return {
                scheduled: scheduleUpdates.length / 2,
                totalMatches: allMatches.length
            };
        });
    }
    isMatchReady(match, playerFreeTime, restTime) {
        if (match.previousMatches.length === 0)
            return true;
        for (const prevMatch of match.previousMatches) {
            if (!prevMatch.endTime)
                return false;
            const endTime = new Date(prevMatch.endTime);
            const now = new Date();
            if ((0, date_fns_1.isAfter)(endTime, now))
                return false;
        }
        return true;
    }
    rescheduleMatch(matchId, newStartTime, courtId) {
        return __awaiter(this, void 0, void 0, function* () {
            const match = yield db_1.prisma.match.findUnique({
                where: { id: matchId },
                include: { schedule: true, event: { include: { tournament: { include: { courts: true } } } } }
            });
            if (!match) {
                throw new Error('Match not found');
            }
            const matchDuration = 45;
            const newEndTime = (0, date_fns_1.addMinutes)(newStartTime, matchDuration);
            yield db_1.prisma.$transaction([
                db_1.prisma.scheduleBlock.upsert({
                    where: { matchId },
                    update: { courtId, startTime: newStartTime, endTime: newEndTime },
                    create: { matchId, courtId, startTime: newStartTime, endTime: newEndTime }
                }),
                db_1.prisma.match.update({
                    where: { id: matchId },
                    data: { startTime: newStartTime, endTime: newEndTime }
                })
            ]);
            return { success: true };
        });
    }
    handleWithdrawal(matchId, withdrawingPlayerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const match = yield db_1.prisma.match.findUnique({
                where: { id: matchId },
                include: { nextMatch: true }
            });
            if (!match) {
                throw new Error('Match not found');
            }
            const winnerId = match.playerAId === withdrawingPlayerId ? match.playerBId : match.playerAId;
            if (!winnerId) {
                throw new Error('Cannot determine winner');
            }
            yield db_1.prisma.match.update({
                where: { id: matchId },
                data: {
                    winnerId,
                    status: client_1.MatchStatus.COMPLETED,
                    endTime: new Date(),
                    score: { note: 'Walkover', withdrawingPlayer: withdrawingPlayerId }
                }
            });
            if (match.nextMatchId) {
                const { FixtureEngine } = yield Promise.resolve().then(() => __importStar(require('./FixtureEngineEnhanced')));
                const fixtureEngine = new FixtureEngine();
                yield fixtureEngine.propagateWinner(matchId, winnerId);
            }
            return { success: true, winnerId };
        });
    }
    getSchedulingMetrics(eventId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const event = yield db_1.prisma.event.findUnique({
                where: { id: eventId },
                include: {
                    tournament: { include: { courts: true } },
                    matches: {
                        include: {
                            schedule: { include: { court: true } },
                            playerA: true,
                            playerB: true
                        }
                    }
                }
            });
            if (!event) {
                throw new Error('Event not found');
            }
            const courtUtilization = {};
            const restTimeViolations = [];
            let sameClubMatchCount = 0;
            const startTime = ((_a = event.matches[0]) === null || _a === void 0 ? void 0 : _a.startTime) ? new Date(event.matches[0].startTime) : new Date();
            const endTime = event.matches.reduce((latest, m) => {
                if (m.endTime) {
                    const et = new Date(m.endTime);
                    return !latest || (0, date_fns_1.isAfter)(et, latest) ? et : latest;
                }
                return latest;
            }, null) || new Date();
            const totalTime = endTime.getTime() - startTime.getTime();
            for (const court of event.tournament.courts) {
                const courtMatches = event.matches.filter((m) => { var _a; return ((_a = m.schedule) === null || _a === void 0 ? void 0 : _a.courtId) === court.id && m.startTime && m.endTime; });
                let busyTime = 0;
                for (const m of courtMatches) {
                    if (m.endTime && m.startTime) {
                        const duration = new Date(m.endTime).getTime() - new Date(m.startTime).getTime();
                        busyTime += duration;
                    }
                }
                courtUtilization[court.id] = {
                    busy: busyTime,
                    total: totalTime,
                    percentage: totalTime > 0 ? (busyTime / totalTime) * 100 : 0
                };
            }
            const playerMatchTimes = {};
            for (const match of event.matches) {
                if (((_b = match.playerA) === null || _b === void 0 ? void 0 : _b.clubId) && ((_c = match.playerB) === null || _c === void 0 ? void 0 : _c.clubId) && match.playerA.clubId === match.playerB.clubId) {
                    sameClubMatchCount++;
                }
                if (match.endTime && match.playerAId) {
                    if (!playerMatchTimes[match.playerAId])
                        playerMatchTimes[match.playerAId] = [];
                    playerMatchTimes[match.playerAId].push({ matchId: match.id, endTime: new Date(match.endTime) });
                }
                if (match.endTime && match.playerBId) {
                    if (!playerMatchTimes[match.playerBId])
                        playerMatchTimes[match.playerBId] = [];
                    playerMatchTimes[match.playerBId].push({ matchId: match.id, endTime: new Date(match.endTime) });
                }
            }
            for (const [playerId, matches] of Object.entries(playerMatchTimes)) {
                matches.sort((a, b) => a.endTime.getTime() - b.endTime.getTime());
                for (let i = 1; i < matches.length; i++) {
                    const nextMatch = event.matches.find((m) => (m.playerAId === playerId || m.playerBId === playerId) &&
                        m.id !== matches[i - 1].matchId &&
                        m.startTime);
                    if (nextMatch && nextMatch.startTime) {
                        const restTime = (new Date(nextMatch.startTime).getTime() - matches[i - 1].endTime.getTime()) / 60000;
                        if (restTime < 20) {
                            restTimeViolations.push({
                                matchId: nextMatch.id,
                                playerId,
                                restTime: Math.round(restTime)
                            });
                        }
                    }
                }
            }
            return {
                courtUtilization,
                restTimeViolations,
                sameClubMatchCount
            };
        });
    }
}
exports.ScheduleEngine = ScheduleEngine;
