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
exports.scheduleFixture = exports.getFixture = exports.generateFixture = exports.rollbackFixtures = exports.getFairnessScore = exports.previewFixtures = exports.generateFixtures = void 0;
const FixtureEngineEnhanced_1 = require("../services/FixtureEngineEnhanced");
const asyncHandler_1 = require("../middlewares/asyncHandler");
const responseFormatter_1 = require("../utils/responseFormatter");
const validation_1 = require("../utils/validation");
const zod_1 = require("zod");
const cache_1 = require("../utils/cache");
const logger_1 = require("../utils/logger");
const fixtureEngine = new FixtureEngineEnhanced_1.FixtureEngine();
const eventIdParamSchema = zod_1.z.object({
    eventId: zod_1.z.string().uuid('Invalid event ID format'),
});
const fixturePreviewSchema = zod_1.z.object({
    format: zod_1.z.enum(['knockout', 'roundrobin', 'swiss', 'double_elimination', 'groups_then_playoff']),
    options: zod_1.z.object({
        swissRounds: zod_1.z.number().optional(),
        groups: zod_1.z.number().optional(),
        seedingStrategy: zod_1.z.enum(['registration_order', 'elo_rating', 'historical_performance', 'random', 'manual']).optional(),
        randomizeUnseeded: zod_1.z.boolean().optional(),
    }).optional(),
});
const rollbackSchema = zod_1.z.object({
    snapshotId: zod_1.z.string().optional(),
});
// Generate fixtures (existing endpoint, now with enhanced engine)
exports.generateFixtures = [
    (0, validation_1.validateParams)(eventIdParamSchema),
    (0, validation_1.validateBody)(validation_1.fixtureGenerationSchema),
    (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { eventId } = req.params;
        const { type, format } = req.body;
        const fixtureFormat = (type || format || 'knockout').toLowerCase();
        try {
            const result = yield fixtureEngine.generateFixtures(eventId, fixtureFormat);
            (0, cache_1.invalidateCache)(`event:${eventId}:*`);
            (0, cache_1.invalidateCache)(`fixtures:*`);
            (0, logger_1.logInfo)('Fixtures generated', { eventId, format: fixtureFormat, matchCount: result.matches.length });
            return res.json((0, responseFormatter_1.ok)(result));
        }
        catch (error) {
            (0, logger_1.logError)(error, { eventId, format: fixtureFormat });
            if (error.message.includes('not found')) {
                return res.status(404).json((0, responseFormatter_1.fail)(error.message));
            }
            if (error.message.includes('already scheduled') || error.message.includes('required')) {
                return res.status(400).json((0, responseFormatter_1.fail)(error.message));
            }
            throw error;
        }
    }))
];
// NEW: Preview fixtures without committing
exports.previewFixtures = [
    (0, validation_1.validateParams)(eventIdParamSchema),
    (0, validation_1.validateBody)(fixturePreviewSchema),
    (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { eventId } = req.params;
        const { format, options } = req.body;
        try {
            const preview = yield fixtureEngine.previewFixtures(eventId, format, Object.assign(Object.assign({}, options), { dryRun: true }));
            (0, logger_1.logInfo)('Fixtures previewed', {
                eventId,
                format,
                matchCount: preview.matches.length,
                fairnessScore: preview.fairnessScore
            });
            return res.json((0, responseFormatter_1.ok)(Object.assign(Object.assign({}, preview), { message: 'Preview generated successfully. Use POST /fixtures/generate to commit.' })));
        }
        catch (error) {
            (0, logger_1.logError)(error, { eventId, format });
            if (error.message.includes('not found')) {
                return res.status(404).json((0, responseFormatter_1.fail)(error.message));
            }
            if (error.message.includes('validation failed')) {
                return res.status(400).json((0, responseFormatter_1.fail)(error.message));
            }
            throw error;
        }
    }))
];
// NEW: Get fairness score for existing fixtures
exports.getFairnessScore = [
    (0, validation_1.validateParams)(eventIdParamSchema),
    (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { eventId } = req.params;
        try {
            const { calculateExistingFixtureFairness } = yield Promise.resolve().then(() => __importStar(require('../services/FixtureEngineEnhanced')));
            const fairnessScore = yield calculateExistingFixtureFairness(eventId);
            (0, logger_1.logInfo)('Fairness score calculated', { eventId, fairnessScore });
            return res.json((0, responseFormatter_1.ok)({
                eventId,
                fairnessScore,
                rating: fairnessScore >= 80 ? 'Excellent' :
                    fairnessScore >= 70 ? 'Good' :
                        fairnessScore >= 60 ? 'Fair' : 'Needs Improvement',
                recommendations: fairnessScore < 70 ? [
                    'Consider regenerating fixtures with higher optimization iterations',
                    'Review same-club matchups in early rounds',
                    'Check if seeding strategy can be improved'
                ] : []
            }));
        }
        catch (error) {
            (0, logger_1.logError)(error, { eventId });
            if (error.message.includes('not found')) {
                return res.status(404).json((0, responseFormatter_1.fail)(error.message));
            }
            throw error;
        }
    }))
];
// NEW: Rollback fixtures to previous state
exports.rollbackFixtures = [
    (0, validation_1.validateParams)(eventIdParamSchema),
    (0, validation_1.validateBody)(rollbackSchema),
    (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { eventId } = req.params;
        const { snapshotId } = req.body;
        try {
            const success = yield fixtureEngine.rollback(eventId, snapshotId);
            if (success) {
                (0, cache_1.invalidateCache)(`event:${eventId}:*`);
                (0, cache_1.invalidateCache)(`fixtures:*`);
                (0, logger_1.logInfo)('Fixtures rolled back', { eventId, snapshotId });
                return res.json((0, responseFormatter_1.ok)({
                    success: true,
                    message: 'Fixtures successfully rolled back to previous state',
                    eventId,
                    snapshotId
                }));
            }
            else {
                return res.status(400).json((0, responseFormatter_1.fail)('Rollback failed'));
            }
        }
        catch (error) {
            (0, logger_1.logError)(error, { eventId, snapshotId });
            if (error.message.includes('not found') || error.message.includes('No rollback snapshot')) {
                return res.status(404).json((0, responseFormatter_1.fail)(error.message));
            }
            if (error.message.includes('disabled')) {
                return res.status(400).json((0, responseFormatter_1.fail)('Rollback functionality is disabled'));
            }
            throw error;
        }
    }))
];
// Existing endpoints (kept for backward compatibility)
exports.generateFixture = exports.generateFixtures;
const getFixture = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Implementation for getting fixtures
    res.status(501).json((0, responseFormatter_1.fail)('Not implemented yet'));
});
exports.getFixture = getFixture;
const scheduleFixture = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Implementation for scheduling
    res.status(501).json((0, responseFormatter_1.fail)('Not implemented yet'));
});
exports.scheduleFixture = scheduleFixture;
