/**
 * Comprehensive xSPRINT Backend Testing Suite
 * Run with: node test-fresh.js
 * 
 * This script tests all features with unique data each run to avoid conflicts
 */

const API_BASE = 'http://localhost:5000/api';
const timestamp = Date.now();

// Helper function to make HTTP requests
async function apiRequest(method, endpoint, data = null) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      console.error(`❌ ${method} ${endpoint} - Status ${response.status}:`, result);
      return { success: false, status: response.status, data: result };
    }

    console.log(`✅ ${method} ${endpoint}`);
    return { success: true, status: response.status, data: result };
  } catch (error) {
    console.error(`❌ ${method} ${endpoint} - Error:`, error.message);
    return { success: false, status: 0, error: error.message };
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 xSPRINT COMPREHENSIVE BACKEND TEST SUITE');
  console.log('='.repeat(60) + '\n');

  let testsPassed = 0;
  let testsFailed = 0;

  // ============================================================
  // TEST 1: CREATE CLUBS (with unique names)
  // ============================================================
  console.log('\n📋 TEST 1: Creating Clubs...');
  const club1Res = await apiRequest('POST', '/clubs', {
    name: `Club A - ${timestamp}`
  });
  
  const club2Res = await apiRequest('POST', '/clubs', {
    name: `Club B - ${timestamp}`
  });

  if (!club1Res.success || !club2Res.success) {
    console.error('⛔ Failed to create clubs');
    testsFailed += 2;
    return;
  }

  const club1 = club1Res.data.club || club1Res.data;
  const club2 = club2Res.data.club || club2Res.data;
  console.log(`   ✓ Club 1: ${club1.name} (${club1.id})`);
  console.log(`   ✓ Club 2: ${club2.name} (${club2.id})`);
  testsPassed += 2;

  // ============================================================
  // TEST 2: GET ALL CLUBS
  // ============================================================
  console.log('\n📋 TEST 2: Fetching All Clubs...');
  const clubsRes = await apiRequest('GET', '/clubs');
  if (clubsRes.success) {
    const clubs = clubsRes.data.clubs || clubsRes.data || [];
    console.log(`   ✓ Total clubs in system: ${clubs.length}`);
    testsPassed++;
  } else {
    testsFailed++;
  }

  // ============================================================
  // TEST 3: CREATE TOURNAMENT
  // ============================================================
  console.log('\n🏆 TEST 3: Creating Tournament...');
  const tournamentRes = await apiRequest('POST', '/tournaments', {
    name: `National Championship ${timestamp}`,
    location: 'Sports Complex Arena',
    startDate: new Date('2025-12-01T09:00:00Z').toISOString(),
    endDate: new Date('2025-12-05T18:00:00Z').toISOString(),
    courts: [
      { name: 'Court 1' },
      { name: 'Court 2' },
      { name: 'Court 3' }
    ]
  });

  if (!tournamentRes.success) {
    console.error('⛔ Failed to create tournament');
    testsFailed++;
    return;
  }

  const tournament = tournamentRes.data.tournament || tournamentRes.data;
  console.log(`   ✓ Tournament: ${tournament.name} (${tournament.id})`);
  testsPassed++;

  // ============================================================
  // TEST 4: CREATE EVENTS
  // ============================================================
  console.log('\n🎯 TEST 4: Creating Events...');
  const mensSinglesRes = await apiRequest('POST', '/events', {
    tournamentId: tournament.id,
    name: "Men's Singles - Knockout",
    sport: 'Badminton',
    type: 'KNOCKOUT',
    gender: "Men's",
    category: 'Senior'
  });

  const womensDoublesRes = await apiRequest('POST', '/events', {
    tournamentId: tournament.id,
    name: "Women's Doubles - Round Robin",
    sport: 'Badminton',
    type: 'ROUND_ROBIN',
    gender: "Women's",
    category: 'Senior'
  });

  if (!mensSinglesRes.success || !womensDoublesRes.success) {
    console.error('⛔ Failed to create events');
    testsFailed += 2;
    return;
  }

  const mensSingles = mensSinglesRes.data.event || mensSinglesRes.data;
  const womensDoubles = womensDoublesRes.data.event || womensDoublesRes.data;
  console.log(`   ✓ Event 1: ${mensSingles.name} (${mensSingles.id})`);
  console.log(`   ✓ Event 2: ${womensDoubles.name} (${womensDoubles.id})`);
  testsPassed += 2;

  // ============================================================
  // TEST 5: CREATE PLAYERS
  // ============================================================
  console.log('\n👥 TEST 5: Creating Players...');
  const playersData = [
    { name: 'John Smith', email: `john.${timestamp}@test.com`, gender: 'Male', weight: '75kg', category: 'Senior', clubId: club1.id },
    { name: 'Mike Johnson', email: `mike.${timestamp}@test.com`, gender: 'Male', weight: '80kg', category: 'Senior', clubId: club1.id },
    { name: 'Sarah Williams', email: `sarah.${timestamp}@test.com`, gender: 'Female', weight: '60kg', category: 'Senior', clubId: club2.id },
    { name: 'Emma Davis', email: `emma.${timestamp}@test.com`, gender: 'Female', weight: '58kg', category: 'Senior', clubId: club2.id },
    { name: 'Chris Brown', email: `chris.${timestamp}@test.com`, gender: 'Male', weight: '72kg', category: 'Senior' },
    { name: 'Alex Taylor', email: `alex.${timestamp}@test.com`, gender: 'Male', weight: '78kg', category: 'Senior' },
    { name: 'Lisa Anderson', email: `lisa.${timestamp}@test.com`, gender: 'Female', weight: '62kg', category: 'Senior' },
    { name: 'David Wilson', email: `david.${timestamp}@test.com`, gender: 'Male', weight: '85kg', category: 'Senior' }
  ];

  const players = [];
  for (const playerData of playersData) {
    const playerRes = await apiRequest('POST', '/players', playerData);
    if (playerRes.success) {
      players.push(playerRes.data.player || playerRes.data);
    }
  }

  console.log(`   ✓ Created ${players.length} players`);
  if (players.length < playersData.length) {
    console.warn(`   ⚠ Only ${players.length}/${playersData.length} players created`);
  }
  testsPassed += Math.min(players.length, 8);

  // ============================================================
  // TEST 6: GET ALL PLAYERS
  // ============================================================
  console.log('\n👥 TEST 6: Fetching All Players...');
  const allPlayersRes = await apiRequest('GET', '/players');
  if (allPlayersRes.success) {
    const allPlayers = allPlayersRes.data.players || allPlayersRes.data || [];
    console.log(`   ✓ Total players in system: ${allPlayers.length}`);
    testsPassed++;
  } else {
    testsFailed++;
  }

  // ============================================================
  // TEST 7: REGISTER PLAYERS TO MEN'S SINGLES (KNOCKOUT)
  // ============================================================
  console.log('\n📝 TEST 7: Registering Players to Men\'s Singles (Knockout)...');
  const malePlayers = players.filter(p => p.gender === 'Male');
  let maleRegistrations = 0;

  for (let i = 0; i < Math.min(5, malePlayers.length); i++) {
    const regRes = await apiRequest('POST', '/events/register', {
      eventId: mensSingles.id,
      playerId: malePlayers[i].id,
      seed: i < 4 ? i + 1 : undefined
    });
    if (regRes.success) {
      maleRegistrations++;
    }
  }

  console.log(`   ✓ Registered ${maleRegistrations} male players`);
  testsPassed += maleRegistrations;

  // ============================================================
  // TEST 8: GET EVENT REGISTRATIONS
  // ============================================================
  console.log('\n📝 TEST 8: Fetching Event Registrations...');
  const registrationsRes = await apiRequest('GET', `/events/${mensSingles.id}/registrations`);
  if (registrationsRes.success) {
    const registrations = registrationsRes.data.registrations || [];
    console.log(`   ✓ Men's Singles registrations: ${registrations.length} players`);
    testsPassed++;
  } else {
    testsFailed++;
  }

  // ============================================================
  // TEST 9: GENERATE KNOCKOUT FIXTURES
  // ============================================================
  console.log('\n🎲 TEST 9: Generating Knockout Fixtures...');
  const knockoutFixturesRes = await apiRequest('POST', `/fixtures/generate/${mensSingles.id}`, {
    type: 'KNOCKOUT'
  });

  let knockoutMatches = [];
  if (knockoutFixturesRes.success) {
    knockoutMatches = knockoutFixturesRes.data.data?.matches || [];
    console.log(`   ✓ Generated ${knockoutMatches.length} matches in knockout format`);
    console.log(`   ✓ Total rounds: ${knockoutFixturesRes.data.data?.totalRounds || 'N/A'}`);
    testsPassed++;
  } else {
    console.error('   ❌ Failed to generate knockout fixtures');
    testsFailed++;
  }

  // ============================================================
  // TEST 10: REGISTER PLAYERS TO WOMEN'S DOUBLES (ROUND ROBIN)
  // ============================================================
  console.log('\n📝 TEST 10: Registering Players to Women\'s Doubles (Round Robin)...');
  const femalePlayers = players.filter(p => p.gender === 'Female');
  let femaleRegistrations = 0;

  for (let i = 0; i < Math.min(4, femalePlayers.length); i++) {
    const regRes = await apiRequest('POST', '/events/register', {
      eventId: womensDoubles.id,
      playerId: femalePlayers[i].id
    });
    if (regRes.success) {
      femaleRegistrations++;
    }
  }

  console.log(`   ✓ Registered ${femaleRegistrations} female players`);
  testsPassed += femaleRegistrations;

  // ============================================================
  // TEST 11: GENERATE ROUND ROBIN FIXTURES
  // ============================================================
  console.log('\n🎲 TEST 11: Generating Round Robin Fixtures...');
  const roundRobinFixturesRes = await apiRequest('POST', `/fixtures/generate/${womensDoubles.id}`, {
    type: 'ROUND_ROBIN'
  });

  let roundRobinMatches = [];
  if (roundRobinFixturesRes.success) {
    roundRobinMatches = roundRobinFixturesRes.data.data?.matches || [];
    console.log(`   ✓ Generated ${roundRobinMatches.length} matches in round robin format`);
    console.log(`   ✓ Total rounds: ${roundRobinFixturesRes.data.data?.totalRounds || 'N/A'}`);
    testsPassed++;
  } else {
    console.error('   ❌ Failed to generate round robin fixtures');
    testsFailed++;
  }

  // ============================================================
  // TEST 12: GET FIXTURES FOR MEN'S SINGLES
  // ============================================================
  console.log('\n📊 TEST 12: Fetching Men\'s Singles Fixtures...');
  const mensSinglesFixturesRes = await apiRequest('GET', `/fixtures/event/${mensSingles.id}`);
  if (mensSinglesFixturesRes.success) {
    const flatMatches = mensSinglesFixturesRes.data.data?.flatMatches || [];
    console.log(`   ✓ Found ${flatMatches.length} matches`);
    testsPassed++;
  } else {
    testsFailed++;
  }

  // ============================================================
  // TEST 13: UPDATE MATCH SCORE
  // ============================================================
  console.log('\n🎯 TEST 13: Updating Match Score...');
  if (knockoutMatches.length > 0) {
    const firstMatch = knockoutMatches[0];
    if (firstMatch.playerAId) {
      const updatedMatchRes = await apiRequest('PATCH', `/matches/${firstMatch.id}`, {
        winnerId: firstMatch.playerAId,
        score: {
          sets: [
            { a: 21, b: 18 },
            { a: 21, b: 19 }
          ]
        }
      });

      if (updatedMatchRes.success) {
        console.log(`   ✓ Match updated - Winner ID: ${updatedMatchRes.data.match?.winnerId || firstMatch.playerAId}`);
        testsPassed++;
      } else {
        testsFailed++;
      }
    }
  } else {
    console.warn('   ⚠ No matches available to update');
  }

  // ============================================================
  // TEST 14: GET TOURNAMENT DETAILS
  // ============================================================
  console.log('\n🏆 TEST 14: Fetching Tournament Details...');
  const tournamentDetailsRes = await apiRequest('GET', `/tournaments/${tournament.id}`);
  if (tournamentDetailsRes.success) {
    const details = tournamentDetailsRes.data.tournament || tournamentDetailsRes.data;
    console.log(`   ✓ Tournament: ${details.name}`);
    console.log(`   ✓ Events: ${details.events?.length || 0}`);
    console.log(`   ✓ Courts: ${details.courts?.length || 0}`);
    testsPassed++;
  } else {
    testsFailed++;
  }

  // ============================================================
  // TEST 15: GET ALL TOURNAMENTS
  // ============================================================
  console.log('\n🏆 TEST 15: Fetching All Tournaments...');
  const allTournamentsRes = await apiRequest('GET', '/tournaments');
  if (allTournamentsRes.success) {
    const allTournaments = allTournamentsRes.data.tournaments || allTournamentsRes.data || [];
    console.log(`   ✓ Total tournaments in system: ${allTournaments.length}`);
    testsPassed++;
  } else {
    testsFailed++;
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(2)}%`);
  console.log('='.repeat(60) + '\n');

  console.log('🎯 Key Metrics:');
  console.log(`   - Clubs Created: 2`);
  console.log(`   - Tournaments Created: 1`);
  console.log(`   - Events Created: 2`);
  console.log(`   - Players Created: ${players.length}`);
  console.log(`   - Knockout Matches: ${knockoutMatches.length}`);
  console.log(`   - Round Robin Matches: ${roundRobinMatches.length}`);
  console.log(`   - Total Matches: ${knockoutMatches.length + roundRobinMatches.length}`);
}

// Run the tests
runTests().catch(console.error);
