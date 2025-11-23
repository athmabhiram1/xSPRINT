const fetch = require('node-fetch');
const API_BASE = 'http://localhost:5000/api';

async function testAI() {
    console.log('🤖 Testing AI Insights Endpoint...');

    // 1. Create a dummy tournament first (needed for ID)
    console.log('   Creating temporary tournament...');
    const tournamentRes = await fetch(`${API_BASE}/tournaments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'AI Test Tournament',
            location: 'Virtual Arena',
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
            courts: [{ name: 'Court 1' }]
        })
    });

    const tournamentData = await tournamentRes.json();
    if (!tournamentData.success) {
        console.error('❌ Failed to create tournament for testing');
        return;
    }

    const tournamentId = tournamentData.tournament.id;
    console.log(`   Tournament created: ${tournamentId}`);

    // 2. Test AI Endpoint
    console.log(`   Fetching insights for ${tournamentId}...`);
    const aiRes = await fetch(`${API_BASE}/ai/insights/${tournamentId}`);
    const aiData = await aiRes.json();

    if (aiData.success) {
        console.log('✅ AI Insights fetched successfully!');
        console.log('   Summary:', aiData.data.summary);
        console.log('   Key Stats:', aiData.data.keyStats);
    } else {
        console.error('❌ Failed to fetch insights:', aiData);
    }
}

testAI().catch(console.error);
