const fetch = require('node-fetch');

async function testRegistration() {
    try {
        // First create tournament
        const tournamentRes = await fetch('http://localhost:5000/api/tournaments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Tournament',
                location: 'Test Location',
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 86400000).toISOString(),
                courts: [{ name: 'Court 1' }]
            })
        });
        const tournament = await tournamentRes.json();
        console.log('Tournament:', tournament);

        // Create event
        const eventRes = await fetch('http://localhost:5000/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tournamentId: tournament.tournament.id,
                name: 'Test Event',
                sport: 'Badminton',
                type: 'KNOCKOUT'
            })
        });
        const event = await eventRes.json();
        console.log('Event:', event);

        // Create player
        const playerRes = await fetch('http://localhost:5000/api/players', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Player',
                email: 'test@test.com',
                gender: 'Male'
            })
        });
        const player = await playerRes.json();
        console.log('Player:', player);

        // Register player
        const regRes = await fetch('http://localhost:5000/api/events/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventId: event.event.id,
                playerId: player.player.id,
                seed: 1
            })
        });
        const registration = await regRes.json();
        console.log('Registration:', registration);

    } catch (error) {
        console.error('Error:', error);
    }
}

testRegistration();
