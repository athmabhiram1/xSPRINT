"use strict";
/**
 * Database Connection Test
 * Verifies NeonDB connection is working
 */
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
require("dotenv/config");
const db_1 = __importDefault(require("./lib/db"));
function testConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔌 Testing database connection...\n');
            // Test connection
            yield db_1.default.$connect();
            console.log('✅ Successfully connected to NeonDB!\n');
            // Count records in each table
            const clubCount = yield db_1.default.club.count();
            const playerCount = yield db_1.default.player.count();
            const tournamentCount = yield db_1.default.tournament.count();
            const eventCount = yield db_1.default.event.count();
            const matchCount = yield db_1.default.match.count();
            console.log('📊 Database Statistics:');
            console.log(`   - Clubs: ${clubCount}`);
            console.log(`   - Players: ${playerCount}`);
            console.log(`   - Tournaments: ${tournamentCount}`);
            console.log(`   - Events: ${eventCount}`);
            console.log(`   - Matches: ${matchCount}`);
            console.log('\n✨ Database is ready to use!\n');
        }
        catch (error) {
            console.error('❌ Database connection failed:');
            console.error(error);
            process.exit(1);
        }
        finally {
            yield db_1.default.$disconnect();
        }
    });
}
testConnection();
