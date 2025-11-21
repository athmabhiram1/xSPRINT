"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = require("body-parser");
// Import Routes (Placeholders for now)
// import authRoutes from './routes/auth.routes';
const fixture_routes_1 = __importDefault(require("./routes/fixture.routes"));
const match_routes_1 = __importDefault(require("./routes/match.routes"));
const player_routes_1 = __importDefault(require("./routes/player.routes"));
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)());
exports.app.use((0, body_parser_1.json)());
// Health Check
exports.app.get('/api/health', (req, res) => {
    res.json({ status: 'UP', timestamp: new Date() });
});
// Routes Registration
// app.use('/api/auth', authRoutes);
exports.app.use('/api/fixtures', fixture_routes_1.default);
exports.app.use('/api/matches', match_routes_1.default);
exports.app.use('/api/players', player_routes_1.default);
// Global Error Handler
exports.app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', details: err.message });
});
