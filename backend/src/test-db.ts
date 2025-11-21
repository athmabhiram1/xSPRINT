/**
 * Database Connection Test
 * Verifies NeonDB connection is working
 */

import 'dotenv/config';
import prisma from './lib/db';

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...\n');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Successfully connected to NeonDB!\n');
    
    // Count records in each table
    const clubCount = await prisma.club.count();
    const playerCount = await prisma.player.count();
    const tournamentCount = await prisma.tournament.count();
    const eventCount = await prisma.event.count();
    const matchCount = await prisma.match.count();
    
    console.log('📊 Database Statistics:');
    console.log(`   - Clubs: ${clubCount}`);
    console.log(`   - Players: ${playerCount}`);
    console.log(`   - Tournaments: ${tournamentCount}`);
    console.log(`   - Events: ${eventCount}`);
    console.log(`   - Matches: ${matchCount}`);
    console.log('\n✨ Database is ready to use!\n');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
