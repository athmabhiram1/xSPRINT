"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const body_parser_1 = require("body-parser");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const security_1 = require("./middleware/security");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = require("./middlewares/auth");
const requestLogger_1 = require("./middlewares/requestLogger");
const performance_1 = require("./middlewares/performance");
const authRouter_1 = __importDefault(require("./routers/authRouter"));
const eventRouter_1 = __importDefault(require("./routers/eventRouter"));
const fixtureRouter_1 = __importDefault(require("./routers/fixtureRouter"));
const scheduleRouter_1 = __importDefault(require("./routers/scheduleRouter"));
const leaderboardRouter_1 = __importDefault(require("./routers/leaderboardRouter"));
const matchRouter_1 = __importDefault(require("./routers/matchRouter"));
const analyticsRouter_1 = __importDefault(require("./routers/analyticsRouter"));
exports.app = (0, express_1.default)();
(0, security_1.applySecurityMiddleware)(exports.app);
exports.app.use(performance_1.performanceMonitor);
exports.app.use(requestLogger_1.requestLogger);
exports.app.use((0, body_parser_1.json)({ limit: '10mb' }));
exports.app.use((0, cookie_parser_1.default)());
exports.app.use(auth_1.authenticate);
exports.app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'UP',
            timestamp: new Date().toISOString(),
            uptime: Math.floor(process.uptime()),
        },
    });
});
exports.app.use('/api/auth', security_1.authRateLimiter, authRouter_1.default);
exports.app.use('/api/events', eventRouter_1.default);
exports.app.use('/api', fixtureRouter_1.default);
exports.app.use('/api', leaderboardRouter_1.default);
exports.app.use('/api', analyticsRouter_1.default);
exports.app.use('/api/schedule', scheduleRouter_1.default);
exports.app.use('/api/matches', matchRouter_1.default);
exports.app.use(errorHandler_1.notFoundHandler);
exports.app.use(errorHandler_1.errorHandler);
