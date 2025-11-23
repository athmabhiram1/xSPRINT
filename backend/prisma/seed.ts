import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Production-Grade Test Data Seeder
 * Creates a complete demo tournament with clubs, players, fixtures, schedule, and results
 */

// Sample data
const CLUBS = [
    { name: 'Bangalore Smashers', location: 'Bangalore, Karnataka' },
    { name: 'Chennai Racers', location: 'Chennai, Tamil Nadu' },
    { name: 'Delhi Strikers', location: 'Delhi, NCR' },
    { name: 'Hyderabad Warriors', location: 'Hyderabad, Telangana' },
    { name: 'Mumbai Titans', location: 'Mumbai, Maharashtra' },
    { name: 'Pune Panthers', location: 'Pune, Maharashtra' },
];

const PLAYER_NAMES = [
    'Arjun Kumar', 'Rahul Sharma', 'Vikram Singh', 'Aditya Patel',
    'Rohan Gupta', 'Karthik Reddy', 'Siddharth Rao', 'Nikhil Verma',
    'Aarav Mehta', 'Ishaan Joshi', 'Vivek Nair', 'Pranav Iyer',
    'Arnav Desai', 'Dhruv Malhotra', 'Kabir Kapoor', 'Yash Agarwal',
    'Shubham Pandey', 'Ankit Mishra', 'Varun Saxena', 'Harsh Tiwari',
    'Manish Dubey', 'Gaurav Jain', 'Abhishek Sinha', 'Rishabh Bansal',
];

async function main() {
    console.log('🌱 Starting seed...\n');

    // Clean existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Cleaning existing data...');
    await prisma.matchCodeUsage.deleteMany();
    await prisma.matchResultAudit.deleteMany();
    await prisma.matchCode.deleteMany();
    await prisma.scheduleBlock.deleteMany();
    await prisma.match.deleteMany();
    await prisma.registration.deleteMany();
    await prisma.event.deleteMany();
    await prisma.court.deleteMany();
    await prisma.tournament.deleteMany();
    await prisma.playerStats.deleteMany();
    await prisma.player.deleteMany();
    await prisma.club.deleteMany();
    await prisma.user.deleteMany();

    // 1. Create Admin User
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
        data: {
            name: 'Admin User',
            email: 'admin@xsprint.com',
            passwordHash: hashedPassword,
            role: 'ADMIN',
        },
    });
    console.log(`   ✓ Admin created: ${admin.email}`);

    // Create Umpire User
    const umpirePassword = await bcrypt.hash('umpire123', 10);
    const umpire = await prisma.user.create({
        data: {
            name: 'John Umpire',
            email: 'umpire@xsprint.com',
            passwordHash: umpirePassword,
            role: 'UMPIRE',
        },
    });
    console.log(`   ✓ Umpire created: ${umpire.email}\n`);

    // 2. Create Clubs
    console.log('🏢 Creating clubs...');
    const clubs = [];
    for (const clubData of CLUBS) {
        const club = await prisma.club.create({
            data: clubData,
        });
        clubs.push(club);
        console.log(`   ✓ ${club.name}`);
    }
    console.log('');

    // 3. Create Players (distributed across clubs)
    console.log('👥 Creating players...');
    const players = [];
    for (let i = 0; i < PLAYER_NAMES.length; i++) {
        const club = clubs[i % clubs.length]; // Distribute evenly
        const player = await prisma.player.create({
            data: {
                name: PLAYER_NAMES[i],
                clubId: club.id,
                email: `${PLAYER_NAMES[i].toLowerCase().replace(' ', '.')}@example.com`,
                gender: 'MALE',
                category: 'U21',
            },
        });
        players.push(player);
        console.log(`   ✓ ${player.name} (${club.name})`);
    }
    console.log('');

    // 4. Create Tournament
    console.log('🏆 Creating tournament...');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7); // Start in 7 days
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 3); // 3-day tournament

    const tournament = await prisma.tournament.create({
        data: {
            name: 'xSprint Demo Open 2025',
            location: 'Bangalore Sports Complex',
            startDate,
            endDate,
        },
    });
    console.log(`   ✓ ${tournament.name}\n`);

    // 5. Create Courts
    console.log('🏟️  Creating courts...');
    const courtNames = ['Court 1', 'Court 2', 'Court 3', 'Court 4'];
    const courts = [];
    for (const courtName of courtNames) {
        const court = await prisma.court.create({
            data: {
                name: courtName,
                tournamentId: tournament.id,
            },
        });
        courts.push(court);
        console.log(`   ✓ ${court.name}`);
    }
    console.log('');

    // 6. Create Event
    console.log('🎯 Creating event...');
    const event = await prisma.event.create({
        data: {
            tournamentId: tournament.id,
            name: "Men's Singles U21",
            sport: 'Badminton',
            type: 'KNOCKOUT',
            category: 'U21',
            gender: 'MALE',
        },
    });
    console.log(`   ✓ ${event.name}\n`);

    // 7. Register Players (take first 16 for knockout)
    console.log('📝 Registering players...');
    const registeredPlayers = players.slice(0, 16);
    for (let i = 0; i < registeredPlayers.length; i++) {
        await prisma.registration.create({
            data: {
                eventId: event.id,
                playerId: registeredPlayers[i].id,
                seed: i + 1,
            },
        });
    }
    console.log(`   ✓ ${registeredPlayers.length} players registered\n`);

    // 8. Generate Fixtures (Knockout bracket)
    console.log('🎲 Generating fixtures...');
    const rounds = Math.ceil(Math.log2(registeredPlayers.length));
    let matchNumber = 1;
    const matches = [];

    // Round 1 - Create all first-round matches
    for (let i = 0; i < registeredPlayers.length; i += 2) {
        const match = await prisma.match.create({
            data: {
                eventId: event.id,
                matchNumber,
                round: 1,
                playerAId: registeredPlayers[i].id,
                playerBId: registeredPlayers[i + 1]?.id || null,
                status: 'SCHEDULED',
                umpireId: umpire.id,
            },
        });
        matches.push(match);
        matchNumber++;
    }
    console.log(`   ✓ Round 1: ${matches.length} matches created`);

    // Create placeholder matches for subsequent rounds
    let previousRoundMatches = matches.length;
    for (let round = 2; round <= rounds; round++) {
        const matchesInRound = Math.ceil(previousRoundMatches / 2);
        for (let i = 0; i < matchesInRound; i++) {
            const match = await prisma.match.create({
                data: {
                    eventId: event.id,
                    matchNumber,
                    round,
                    status: 'PENDING',
                },
            });
            matchNumber++;
        }
        console.log(`   ✓ Round ${round}: ${matchesInRound} matches created`);
        previousRoundMatches = matchesInRound;
    }
    console.log('');

    // 9. Generate Schedule
    console.log('📅 Generating schedule...');
    const scheduledMatches = await prisma.match.findMany({
        where: { eventId: event.id, round: 1 },
    });

    let currentTime = new Date(startDate);
    currentTime.setHours(9, 0, 0, 0); // Start at 9 AM

    for (let i = 0; i < scheduledMatches.length; i++) {
        const court = courts[i % courts.length];
        const startTime = new Date(currentTime);
        const endTime = new Date(currentTime.getTime() + 45 * 60 * 1000); // 45 min match

        await prisma.scheduleBlock.create({
            data: {
                matchId: scheduledMatches[i].id,
                courtId: court.id,
                startTime,
                endTime,
            },
        });

        // Update match with denormalized times
        await prisma.match.update({
            where: { id: scheduledMatches[i].id },
            data: {
                startTime,
                endTime,
            },
        });

        // Increment time by 45 minutes for next match on same court
        if ((i + 1) % courts.length === 0) {
            currentTime = new Date(currentTime.getTime() + 45 * 60 * 1000);
        }
    }
    console.log(`   ✓ ${scheduledMatches.length} matches scheduled across ${courts.length} courts\n`);

    // 10. Simulate Some Completed Matches
    console.log('🎮 Simulating completed matches...');
    const matchesToComplete = scheduledMatches.slice(0, 6);

    for (const match of matchesToComplete) {
        const winner = Math.random() > 0.5 ? match.playerAId : match.playerBId;
        const score = {
            sets: [
                { a: 21, b: Math.floor(Math.random() * 15) + 5 },
                { a: 21, b: Math.floor(Math.random() * 15) + 5 },
            ],
        };

        await prisma.match.update({
            where: { id: match.id },
            data: {
                status: 'COMPLETED',
                winnerId: winner,
                score,
            },
        });
    }
    console.log(`   ✓ ${matchesToComplete.length} matches completed with results\n`);

    // Summary
    console.log('✅ Seed completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • ${clubs.length} clubs created`);
    console.log(`   • ${players.length} players created`);
    console.log(`   • 1 tournament created`);
    console.log(`   • ${courts.length} courts created`);
    console.log(`   • 1 event created`);
    console.log(`   • ${registeredPlayers.length} players registered`);
    console.log(`   • ${matchNumber - 1} matches generated`);
    console.log(`   • ${scheduledMatches.length} matches scheduled`);
    console.log(`   • ${matchesToComplete.length} matches completed\n`);

    console.log('🔑 Login Credentials:');
    console.log(`   Admin: admin@xsprint.com / admin123`);
    console.log(`   Umpire: umpire@xsprint.com / umpire123\n`);

    console.log('🚀 Next Steps:');
    console.log(`   1. Start backend: npm run dev`);
    console.log(`   2. Start frontend: cd ../frontend && npm run dev`);
    console.log(`   3. Login and explore the demo!\n`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
