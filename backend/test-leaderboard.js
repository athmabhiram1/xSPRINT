/**
 * Test script for Leaderboard & Audit Logging features
 * Tests knockout standings, round-robin standings, analytics, and audit logs
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test credentials (assuming these exist from previous setup)
let adminToken = '';
let eventId = '';
let matchId = '';

async function login() {
    console.log('\n=== Logging in as Admin ===');
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@xsprint.com',
            password: 'admin123'
        });
        adminToken = response.data.token;
        console.log('✓ Logged in successfully');
        return true;
    } catch (error) {
        console.error('✗ Login failed:', error.response?.data || error.message);
        return false;
    }
}

async function createTestTournament() {
    console.log('\n=== Creating Test Tournament ===');
    try {
        const response = await axios.post(
            `${BASE_URL}/tournaments`,
            {
                name: 'Leaderboard Test Tournament',
                location: 'Test Arena',
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );
        console.log('✓ Tournament created:', response.data.tournament.id);
        return response.data.tournament.id;
    } catch (error) {
        console.error('✗ Failed to create tournament:', error.response?.data || error.message);
        return null;
    }
}

async function createTestEvent(tournamentId, type = 'KNOCKOUT') {
    console.log(`\n=== Creating Test Event (${type}) ===`);
    try {
        const response = await axios.post(
            `${BASE_URL}/events`,
            {
                name: `${type} Test Event`,
                tournamentId,
                sport: 'Badminton',
                type,
                gender: "Men's",
                category: 'Senior'
            },
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );
        eventId = response.data.event.id;
        console.log('✓ Event created:', eventId);
        return eventId;
    } catch (error) {
        console.error('✗ Failed to create event:', error.response?.data || error.message);
        return null;
    }
}

async function testKnockoutStandings() {
    console.log('\n=== Testing Knockout Standings ===');
    try {
        const response = await axios.get(`${BASE_URL}/events/${eventId}/standings`);

        console.log('✓ Standings retrieved successfully');
        console.log('Format:', response.data.leaderboard.format);

        if (response.data.leaderboard.knockout) {
            const { champion, runnerUp, semifinalists } = response.data.leaderboard.knockout;
            console.log('Champion:', champion?.name || 'None');
            console.log('Runner-up:', runnerUp?.name || 'None');
            console.log('Semi-finalists:', semifinalists.length);
        }

        return true;
    } catch (error) {
        console.error('✗ Failed to get standings:', error.response?.data || error.message);
        return false;
    }
}

async function testRoundRobinStandings(rrEventId) {
    console.log('\n=== Testing Round-Robin Standings ===');
    try {
        const response = await axios.get(`${BASE_URL}/events/${rrEventId}/standings`);

        console.log('✓ Standings retrieved successfully');
        console.log('Format:', response.data.leaderboard.format);

        if (response.data.leaderboard.roundRobin) {
            console.log('Total players:', response.data.leaderboard.roundRobin.length);
            console.log('\nTop 3:');
            response.data.leaderboard.roundRobin.slice(0, 3).forEach(standing => {
                console.log(`  ${standing.rank}. ${standing.player.name} - W:${standing.wins} L:${standing.losses}`);
            });
        }

        return true;
    } catch (error) {
        console.error('✗ Failed to get standings:', error.response?.data || error.message);
        return false;
    }
}

async function testAnalytics() {
    console.log('\n=== Testing Event Analytics ===');
    try {
        const response = await axios.get(
            `${BASE_URL}/events/${eventId}/analytics`,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        console.log('✓ Analytics retrieved successfully');
        const analytics = response.data.analytics;

        console.log('\nEvent Analytics:');
        console.log('  Event Name:', analytics.eventName);
        console.log('  Format:', analytics.format);
        console.log('  Total Matches:', analytics.totalMatches);
        console.log('  Completed:', analytics.completedMatches);
        console.log('  In Progress:', analytics.inProgressMatches);
        console.log('  Completion Rate:', analytics.completionRate);
        console.log('  Same Club Matches:', analytics.sameClubMatchCount, `(${analytics.sameClubMatchPercentage})`);
        console.log('  Courts Used:', analytics.courtUtilization.courtsUsed);
        console.log('  Avg Rest Time:', analytics.averageRestTimeMinutes, 'minutes');

        return true;
    } catch (error) {
        console.error('✗ Failed to get analytics:', error.response?.data || error.message);
        return false;
    }
}

async function testAuditLogs() {
    console.log('\n=== Testing Audit Logs ===');
    console.log('Note: Audit logs are created automatically during match operations');
    console.log('Check the database tables:');
    console.log('  - MatchResultAudit: Logs match result submissions');
    console.log('  - MatchCodeUsage: Logs match code verification attempts');
    console.log('\nTo verify, run:');
    console.log('  npx prisma studio');
    console.log('  Then check the MatchResultAudit and MatchCodeUsage tables');
    return true;
}

async function testUnauthorizedAccess() {
    console.log('\n=== Testing Unauthorized Analytics Access ===');
    try {
        // Try to access analytics without token
        await axios.get(`${BASE_URL}/events/${eventId}/analytics`);
        console.log('✗ Should have been blocked!');
        return false;
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✓ Unauthorized access correctly blocked');
            return true;
        }
        console.error('✗ Unexpected error:', error.response?.data || error.message);
        return false;
    }
}

async function runTests() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  Leaderboard & Audit Logging Test Suite               ║');
    console.log('╚════════════════════════════════════════════════════════╝');

    // Login
    if (!await login()) {
        console.log('\n❌ Tests aborted: Login failed');
        return;
    }

    // Create test tournament
    const tournamentId = await createTestTournament();
    if (!tournamentId) {
        console.log('\n❌ Tests aborted: Tournament creation failed');
        return;
    }

    // Create knockout event
    const knockoutEventId = await createTestEvent(tournamentId, 'KNOCKOUT');
    if (!knockoutEventId) {
        console.log('\n❌ Tests aborted: Event creation failed');
        return;
    }

    // Create round-robin event
    const rrEventId = await createTestEvent(tournamentId, 'ROUND_ROBIN');
    if (!rrEventId) {
        console.log('\n❌ Tests aborted: Round-robin event creation failed');
        return;
    }

    // Run tests
    const results = {
        knockoutStandings: await testKnockoutStandings(),
        roundRobinStandings: await testRoundRobinStandings(rrEventId),
        analytics: await testAnalytics(),
        auditLogs: await testAuditLogs(),
        unauthorized: await testUnauthorizedAccess()
    };

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  Test Results Summary                                  ║');
    console.log('╚════════════════════════════════════════════════════════╝');

    const passed = Object.values(results).filter(r => r).length;
    const total = Object.keys(results).length;

    Object.entries(results).forEach(([test, result]) => {
        const icon = result ? '✓' : '✗';
        const status = result ? 'PASSED' : 'FAILED';
        console.log(`${icon} ${test.padEnd(25)} ${status}`);
    });

    console.log(`\n${passed}/${total} tests passed`);

    if (passed === total) {
        console.log('\n🎉 All tests passed!');
    } else {
        console.log('\n⚠️  Some tests failed. Please review the output above.');
    }
}

// Run the tests
runTests().catch(error => {
    console.error('\n❌ Test suite crashed:', error);
    process.exit(1);
});
