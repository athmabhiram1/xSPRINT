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
const db_1 = __importDefault(require("../lib/db"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
class MatchCodeService {
    // Generate a 6-digit code, hash it, store it
    generateCodeForMatch(matchId) {
        return __awaiter(this, void 0, void 0, function* () {
            const rawCode = crypto_1.default.randomInt(100000, 999999).toString();
            const salt = yield bcryptjs_1.default.genSalt(10);
            const hashedCode = yield bcryptjs_1.default.hash(rawCode, salt);
            // Store in DB (Upsert to handle regeneration)
            yield db_1.default.matchCode.upsert({
                where: { matchId },
                update: {
                    codeHash: hashedCode,
                    isActive: true,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours validity
                },
                create: {
                    matchId,
                    codeHash: hashedCode,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
                }
            });
            return rawCode; // Return raw code to Admin/Umpire ONLY ONCE
        });
    }
    // Verify code for scoring access
    verifyCode(matchId, inputCode) {
        return __awaiter(this, void 0, void 0, function* () {
            const record = yield db_1.default.matchCode.findUnique({
                where: { matchId }
            });
            if (!record || !record.isActive)
                return false;
            if (new Date() > record.expiresAt)
                return false;
            const isValid = yield bcryptjs_1.default.compare(inputCode, record.codeHash);
            return isValid;
        });
    }
    // Invalidate code after match completion
    invalidateCode(matchId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_1.default.matchCode.update({
                where: { matchId },
                data: { isActive: false }
            });
        });
    }
}
exports.MatchCodeService = MatchCodeService;
