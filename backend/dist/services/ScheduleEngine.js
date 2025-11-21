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
exports.ScheduleEngine = void 0;
const db_1 = __importDefault(require("../lib/db"));
const date_fns_1 = require("date-fns");
class ScheduleEngine {
    constructor() {
        this.REST_TIME = 20; // Minutes
        this.MATCH_DURATION = 45; // Minutes
        this.CHANGEOVER = 5; // Minutes
    }
    /**
     * Re-evaluates schedule for an event.
     * Uses a simplified Critical Path Method (CPM) / Greedy approach.
     */
    generateSmartSchedule(eventId) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Fetch Resources & Matches
            const courts = yield db_1.default.court.findMany({ where: { tournament: { events: { some: { id: eventId } } } } });
            const allMatches = yield db_1.default.match.findMany({
                where: { eventId },
                include: { previousMatches: true },
                orderBy: { round: 'asc' } // Process Round 1, then Round 2...
            });
            // 2. Track Resource Availability (Time pointers)
            const courtFreeTime = {};
            courts.forEach((c) => courtFreeTime[c.id] = new Date()); // Start scheduling from NOW (or tournament start)
            const playerFreeTime = {};
            // 3. Dependency Graph Processing
            // We iterate rounds. A match cannot start until:
            // a) Both previousMatches are COMPLETED (or calculated end time passed)
            // b) Players have rested
            // c) A court is free
            const scheduleUpdates = [];
            for (const match of allMatches) {
                // If match is already completed, skip, but record player free time
                if (match.status === 'COMPLETED' && match.endTime) {
                    if (match.playerAId)
                        playerFreeTime[match.playerAId] = match.endTime;
                    if (match.playerBId)
                        playerFreeTime[match.playerBId] = match.endTime;
                    continue;
                }
                // Calculate Earliest Start Time (EST) based on Dependencies
                let dependencyTime = new Date(); // Default to now
                if (match.previousMatches.length > 0) {
                    const parentEndTimes = match.previousMatches.map((p) => p.endTime ? new Date(p.endTime).getTime() : 0);
                    dependencyTime = new Date(Math.max(...parentEndTimes));
                }
                // Calculate Player Constraints
                const pA_Free = match.playerAId ? (playerFreeTime[match.playerAId] || new Date()) : new Date();
                const pB_Free = match.playerBId ? (playerFreeTime[match.playerBId] || new Date()) : new Date();
                // Players are ready after their last match + REST
                const playersReadyTime = new Date(Math.max(pA_Free.getTime() + this.REST_TIME * 60000, pB_Free.getTime() + this.REST_TIME * 60000));
                // The match can technically start at:
                let possibleStart = new Date(Math.max(dependencyTime.getTime(), playersReadyTime.getTime()));
                // Find Best Court (Earliest available slot after possibleStart)
                let bestCourt = courts[0];
                let minStartTime = new Date(8640000000000000); // Max date
                for (const court of courts) {
                    const courtReady = courtFreeTime[court.id];
                    const actualStart = new Date(Math.max(courtReady.getTime(), possibleStart.getTime()));
                    if ((0, date_fns_1.isBefore)(actualStart, minStartTime)) {
                        minStartTime = actualStart;
                        bestCourt = court;
                    }
                }
                // Assign Schedule
                const startTime = minStartTime;
                const endTime = (0, date_fns_1.addMinutes)(startTime, this.MATCH_DURATION);
                // Update Trackers
                courtFreeTime[bestCourt.id] = (0, date_fns_1.addMinutes)(endTime, this.CHANGEOVER);
                if (match.playerAId)
                    playerFreeTime[match.playerAId] = endTime;
                if (match.playerBId)
                    playerFreeTime[match.playerBId] = endTime;
                // Push to update queue
                scheduleUpdates.push(db_1.default.scheduleBlock.upsert({
                    where: { matchId: match.id },
                    update: { courtId: bestCourt.id, startTime, endTime },
                    create: { matchId: match.id, courtId: bestCourt.id, startTime, endTime }
                }));
                scheduleUpdates.push(db_1.default.match.update({
                    where: { id: match.id },
                    data: { status: 'SCHEDULED', startTime, endTime }
                }));
            }
            // Execute Transaction
            yield db_1.default.$transaction(scheduleUpdates);
            return { success: true, scheduled: scheduleUpdates.length / 2 };
        });
    }
}
exports.ScheduleEngine = ScheduleEngine;
