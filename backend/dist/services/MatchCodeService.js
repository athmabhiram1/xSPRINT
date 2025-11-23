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
exports.MatchCodeService = void 0;
const db_1 = require("../lib/db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("@prisma/client");
class MatchCodeService {
    generateCodeForMatch(matchId, assignedUmpireId) {
        return __awaiter(this, void 0, void 0, function* () {
            const umpire = yield db_1.prisma.user.findUnique({
                where: { id: assignedUmpireId },
                select: { id: true, role: true, name: true, email: true },
            });
            if (!umpire) {
                throw new Error('Assigned umpire not found');
            }
            if (umpire.role !== client_1.Role.UMPIRE && umpire.role !== client_1.Role.ADMIN) {
                throw new Error(`User ${umpire.email} does not have UMPIRE or ADMIN role`);
            }
            const match = yield db_1.prisma.match.findUnique({
                where: { id: matchId },
                select: { id: true, status: true },
            });
            if (!match) {
                throw new Error('Match not found');
            }
            const rawCode = crypto_1.default.randomInt(100000, 999999).toString();
            const salt = yield bcryptjs_1.default.genSalt(10);
            const hashedCode = yield bcryptjs_1.default.hash(rawCode, salt);
            yield db_1.prisma.matchCode.upsert({
                where: { matchId },
                update: {
                    codeHash: hashedCode,
                    assignedUmpireId,
                    isActive: true,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                },
                create: {
                    matchId,
                    assignedUmpireId,
                    codeHash: hashedCode,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                },
            });
            return rawCode;
        });
    }
    verifyCode(matchId, inputCode, userId, ip) {
        return __awaiter(this, void 0, void 0, function* () {
            const record = yield db_1.prisma.matchCode.findUnique({
                where: { matchId },
                include: {
                    match: {
                        select: { status: true },
                    },
                    assignedUmpire: {
                        select: { id: true, name: true, role: true },
                    },
                },
            });
            if (!record) {
                yield this.logCodeUsage(matchId, userId, ip, false);
                return false;
            }
            if (record.match.status !== 'PENDING' && record.match.status !== 'SCHEDULED') {
                yield this.logCodeUsage(matchId, userId, ip, false);
                throw new Error('Cannot validate code for completed or inactive match');
            }
            if (!record.isActive) {
                yield this.logCodeUsage(matchId, userId, ip, false);
                return false;
            }
            if (new Date() > record.expiresAt) {
                yield this.logCodeUsage(matchId, userId, ip, false);
                return false;
            }
            const user = yield db_1.prisma.user.findUnique({
                where: { id: userId },
                select: { role: true },
            });
            if (!user) {
                yield this.logCodeUsage(matchId, userId, ip, false);
                return false;
            }
            if (user.role !== client_1.Role.ADMIN && record.assignedUmpireId !== userId) {
                yield this.logCodeUsage(matchId, userId, ip, false);
                return false;
            }
            const isValid = yield bcryptjs_1.default.compare(inputCode, record.codeHash);
            yield this.logCodeUsage(matchId, userId, ip, isValid);
            return isValid;
        });
    }
    invalidateCode(matchId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_1.prisma.matchCode.update({
                where: { matchId },
                data: {
                    isActive: false,
                    expiresAt: new Date(),
                },
            });
        });
    }
    validateUmpireAccess(userId, matchId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield db_1.prisma.user.findUnique({
                where: { id: userId },
                select: { role: true },
            });
            if (!user) {
                return false;
            }
            if (user.role === client_1.Role.ADMIN) {
                return true;
            }
            if (user.role === client_1.Role.UMPIRE) {
                const matchCode = yield db_1.prisma.matchCode.findUnique({
                    where: { matchId },
                    select: { assignedUmpireId: true },
                });
                return (matchCode === null || matchCode === void 0 ? void 0 : matchCode.assignedUmpireId) === userId;
            }
            return false;
        });
    }
    logCodeUsage(matchId, umpireId, ip, success) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_1.prisma.matchCodeUsage.create({
                data: {
                    matchId,
                    umpireId: umpireId || null,
                    ip: ip || null,
                    success,
                },
            });
        });
    }
}
exports.MatchCodeService = MatchCodeService;
