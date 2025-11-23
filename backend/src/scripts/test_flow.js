const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function runTest() {
    console.log('🚀 Starting Backend Test Flow...');

    // Helper to safely parse JSON
    const safeJson = async (res) => {
        const text = await res.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            throw new Error(`Invalid JSON (${res.status} ${res.statusText}): ${text.substring(0, 500)}`);
        }
    };

    try {
        // 1. Create Tournament
        console.log('\n1. Creating Tournament...');
        const tournamentRes = await fetch(`${API_URL}/tournaments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: `Test Tournament ${Date.now()}`,
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 86400000 * 2).toISOString(),
                location: 'Test Location',
                courts: [{ name: 'Court 1' }, { name: 'Court 2' }]
            })
        });
        const tournamentData = await safeJson(tournamentRes);
        if (!tournamentData.success) throw new Error(`Failed to create tournament: ${JSON.stringify(tournamentData)}`);
        const tournamentId = tournamentData.tournament.id;
        console.log(`✅ Tournament Created: ${tournamentId}`);

        // 2. Create Event
        console.log('\n2. Creating Event...');
        const eventRes = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tournamentId,
                name: 'Men Singles',
                sport: 'BADMINTON',
                type: 'KNOCKOUT',
                gender: 'MALE',
                category: 'OPEN'
            })
        });
        const eventData = await safeJson(eventRes);
        if (!eventData.success) throw new Error(`Failed to create event: ${JSON.stringify(eventData)}`);
        const eventId = eventData.event.id;
        console.log(`✅ Event Created: ${eventId}`);

        // 3. Create Players & Register
        console.log('\n3. Creating & Registering Players...');
        const playerIds = [];
        for (let i = 1; i <= 4; i++) {
            const playerRes = await fetch(`${API_URL}/players`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `Test Player ${i}`,
                    email: `player${i}_${Date.now()}@test.com`,
                    gender: 'MALE',
                    category: 'OPEN'
                })
            });
            const playerData = await safeJson(playerRes);
            if (!playerData.success) throw new Error(`Failed to create player ${i}: ${JSON.stringify(playerData)}`);
            const playerId = playerData.player.id;
            playerIds.push(playerId);

            const regRes = await fetch(`${API_URL}/events/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId,
                    playerId,
                    seed: i
                })
            });
            const regData = await safeJson(regRes);
            if (!regData.success) throw new Error(`Failed to register player ${i}: ${JSON.stringify(regData)}`);
        }
        console.log(`✅ 4 Players Registered`);

        // 4. Generate Fixtures
        console.log('\n4. Generating Fixtures...');
        // Corrected URL: /api/fixtures/generate/:eventId
        const fixtureRes = await fetch(`${API_URL}/fixtures/generate/${eventId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        const fixtureData = await safeJson(fixtureRes);
        if (!fixtureData.success) throw new Error(`Failed to generate fixtures: ${JSON.stringify(fixtureData)}`);
        console.log(`✅ Fixtures Generated: ${fixtureData.data.matches.length} matches`);

        // 5. Schedule Matches
        console.log('\n5. Scheduling Matches...');
        // Corrected URL: /api/fixtures/schedule/:eventId
        const scheduleRes = await fetch(`${API_URL}/fixtures/schedule/${eventId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
                matchDuration: 30
            })
        });
        const scheduleData = await safeJson(scheduleRes);
        if (!scheduleData.success) throw new Error(`Failed to schedule matches: ${JSON.stringify(scheduleData)}`);
        console.log(`✅ Matches Scheduled`);

        // 6. Get a Match and Validate Code
        console.log('\n6. Testing Match Code & Result...');
        // Get the first match
        const matchesRes = await fetch(`${API_URL}/fixtures/event/${eventId}`);
        const matchesData = await safeJson(matchesRes);

        // Find a match in round 1
        const match = matchesData.data.flatMatches.find(m => m.round === 1);
        if (!match) throw new Error('No match found in round 1');

        console.log(`Testing with Match ID: ${match.id}`);

        // Fetch the code from DB directly (cheating for test)
        // Since code generation might not be automatic, we create one for testing
        console.log('Setting up match code for testing...');

        // Manually update hash to '123456' for testing
        const hashedCode = await bcrypt.hash('123456', 10);

        await prisma.matchCode.upsert({
            where: { matchId: match.id },
            update: { codeHash: hashedCode, expiresAt: new Date(Date.now() + 3600000), isActive: true },
            create: {
                matchId: match.id,
                codeHash: hashedCode,
                expiresAt: new Date(Date.now() + 3600000),
                isActive: true
            }
        });
        console.log('✅ Manually set match code to "123456" for testing');

        console.log('Attempting validation with invalid code...');
        const invalidValRes = await fetch(`${API_URL}/matches/validate-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matchId: match.id, code: '000000' })
        });
        const invalidValData = await safeJson(invalidValRes);
        if (invalidValData.success) throw new Error('Validation should have failed!');
        console.log('✅ Invalid code rejected');

        // Now validate with '123456'
        const validValRes = await fetch(`${API_URL}/matches/validate-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matchId: match.id, code: '123456' })
        });
        const validValData = await safeJson(validValRes);
        if (!validValData.success) throw new Error(`Validation failed with correct code: ${JSON.stringify(validValData)}`);
        console.log('✅ Valid code accepted');

        // 7. Submit Result
        console.log('\n7. Submitting Result...');
        const resultRes = await fetch(`${API_URL}/matches/result`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                matchId: match.id,
                code: '123456',
                winnerId: match.playerAId, // Player A wins
                score: { sets: [{ a: 21, b: 19 }, { a: 21, b: 15 }] }
            })
        });
        const resultData = await safeJson(resultRes);
        if (!resultData.success) throw new Error(`Failed to submit result: ${JSON.stringify(resultData)}`);
        console.log('✅ Result submitted successfully');

        // Verify match status
        const finalMatch = await prisma.match.findUnique({
            where: { id: match.id }
        });
        if (finalMatch.status !== 'COMPLETED') throw new Error('Match status not updated to COMPLETED');
        console.log('✅ Match status verified as COMPLETED');

        console.log('\n🎉 ALL TESTS PASSED!');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
