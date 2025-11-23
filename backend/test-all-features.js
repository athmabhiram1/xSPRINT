/**
 * Automated API Testing Script for xSPRINT Tournament Management
 * Run with: node test-all-features.js
 */

const fetch = require('node-fetch');
const API_BASE = 'http://localhost:5000/api';

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
      console.error(`❌ ${method} ${endpoint} failed:`, result);
      return null;
    }

    console.log(`✅ ${method} ${endpoint} - Success`);
    return result;
  } catch (error) {
    console.error(`❌ ${method} ${endpoint} error:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting xSPRINT API Tests...\n');

  // Test 1: Create Clubs
  console.log('📋 Test 1: Creating Clubs...');
  const club1Res = await apiRequest('POST', '/clubs', {
    name: 'Thunder Badminton Club'
  });
  const club2Res = await apiRequest('POST', '/clubs', {
    name: 'Lightning Sports Academy'
  });

  if (!club1Res?.success || !club2Res?.success) {
    console.error('⛔ Failed to create clubs. Stopping tests.');
    return;
  }
  const club1 = club1Res.club;
  const club2 = club2Res.club;
  console.log(`   Created clubs: ${club1.name} (${club1.id}), ${club2.name} (${club2.id})\n`);

  // Test 2: Get All Clubs
  console.log('📋 Test 2: Fetching All Clubs...');
  const clubsRes = await apiRequest('GET', '/clubs');
  const clubs = clubsRes?.clubs || [];
  console.log(`   Total clubs: ${clubs.length}\n`);

  // Test 3: Create Tournament
  console.log('🏆 Test 3: Creating Tournament...');
  const tournamentRes = await apiRequest('POST', '/tournaments', {
    name: 'National Badminton Championship 2025',
    location: 'Sports Complex Arena',
    startDate: new Date('2025-12-01T09:00:00Z').toISOString(),
    endDate: new Date('2025-12-05T18:00:00Z').toISOString(),
    courts: [
      { name: 'Court 1' },
      { name: 'Court 2' },
      { name: 'Court 3' }
    ]
  });

  if (!tournamentRes?.success) {
    console.error('⛔ Failed to create tournament. Stopping tests.');
    return;
  }
  const tournament = tournamentRes.tournament;
  console.log(`   Tournament created: ${tournament.name} (${tournament.id})\n`);

  // Test 4: Create Events
  console.log('🎯 Test 4: Creating Events...');
  const mensSinglesRes = await apiRequest('POST', '/events', {
    tournamentId: tournament.id,
    name: "Men's Singles",
    sport: 'Badminton',
    type: 'KNOCKOUT',
    gender: "Men's",
    category: 'Senior'
  });

  const womensDoublesRes = await apiRequest('POST', '/events', {
    tournamentId: tournament.id,
    name: "Women's Doubles",
    sport: 'Badminton',
    type: 'ROUND_ROBIN',
    gender: "Women's",
    category: 'Senior'
  });

  if (!mensSinglesRes?.success || !womensDoublesRes?.success) {
    console.error('⛔ Failed to create events. Stopping tests.');
    return;
  }
  const mensSingles = mensSinglesRes.event;
  const womensDoubles = womensDoublesRes.event;
  console.log(`   Events created: ${mensSingles.name}, ${womensDoubles.name}\n`);

  // Test 5: Create Players
  console.log('👥 Test 5: Creating Players...');
  const playersData = [
    { name: 'John Smith', email: 'john.smith@test.com', gender: 'Male', weight: '75kg', category: 'Senior', clubId: club1.id },
    { name: 'Mike Johnson', email: 'mike.j@test.com', gender: 'Male', weight: '80kg', category: 'Senior', clubId: club1.id },
    { name: 'Sarah Williams', email: 'sarah.w@test.com', gender: 'Female', weight: '60kg', category: 'Senior', clubId: club2.id },
    { name: 'Emma Davis', email: 'emma.d@test.com', gender: 'Female', weight: '58kg', category: 'Senior', clubId: club2.id },
    { name: 'Chris Brown', email: 'chris.b@test.com', gender: 'Male', weight: '72kg', category: 'Senior' },
    { name: 'Alex Taylor', email: 'alex.t@test.com', gender: 'Male', weight: '78kg', category: 'Senior' },
    { name: 'Lisa Anderson', email: 'lisa.a@test.com', gender: 'Female', weight: '62kg', category: 'Senior' },
    { name: 'David Wilson', email: 'david.w@test.com', gender: 'Male', weight: '85kg', category: 'Senior' }
  ];

  const players = [];
  for (const playerData of playersData) {
    const playerRes = await apiRequest('POST', '/players', playerData);
    if (playerRes?.success) players.push(playerRes.player);
  }

  if (players.length === 0) {
    console.error('⛔ Failed to create players. Stopping tests.');
    return;
  }
  console.log(`   Created ${players.length} players\n`);

  // Test 6: Get All Players
  console.log('👥 Test 6: Fetching All Players...');
  const allPlayersRes = await apiRequest('GET', '/players');
  const allPlayers = allPlayersRes?.players || [];
  console.log(`   Total players: ${allPlayers.length}\n`);


  // Test 7: Register Players to Men's Singles Event
  console.log('📝 Test 7: Registering Players to Men\'s Singles...');
  const malePlayers = players.filter(p => p.gender === 'Male');
  let maleRegistrations = 0;
  for (let i = 0; i < Math.min(5, malePlayers.length); i++) {
    const regRes = await apiRequest('POST', '/events/register', {
      eventId: mensSingles.id,
      playerId: malePlayers[i].id,
      seed: i < 4 ? i + 1 : undefined
    });
    if (regRes?.success) maleRegistrations++;
  }
  console.log(`   Registered ${maleRegistrations} players\n`);

  // Test 8: Get Event Registrations
  console.log('📝 Test 8: Fetching Event Registrations...');
  const registrationsRes = await apiRequest('GET', `/events/${mensSingles.id}/registrations`);
  const registrations = registrationsRes?.registrations || [];
  console.log(`   Registrations: ${registrations.length} players\n`);

  // Test 9: Generate Knockout Fixtures
  console.log('🎲 Test 9: Generating Knockout Fixtures...');
  const knockoutFixturesRes = await apiRequest('POST', `/fixtures/generate/${mensSingles.id}`, {
    type: 'KNOCKOUT'
  });

  const knockoutFixtures = knockoutFixturesRes?.data;
  if (knockoutFixtures) {
    console.log(`   Generated ${knockoutFixtures.matches?.length || 0} matches in ${knockoutFixtures.totalRounds} rounds\n`);
  }

  // Test 10: Register Players to Women's Doubles (Round Robin)
  console.log('📝 Test 10: Registering Players to Women\'s Doubles...');
  const femalePlayers = players.filter(p => p.gender === 'Female');
  let femaleRegistrations = 0;
  for (let i = 0; i < Math.min(4, femalePlayers.length); i++) {
    const regRes = await apiRequest('POST', '/events/register', {
      eventId: womensDoubles.id,
      playerId: femalePlayers[i].id
    });
    if (regRes?.success) femaleRegistrations++;
  }
  console.log(`   Registered ${femaleRegistrations} players\n`);

  // Test 11: Generate Round Robin Fixtures
  console.log('🎲 Test 11: Generating Round Robin Fixtures...');
  const roundRobinFixturesRes = await apiRequest('POST', `/fixtures/generate/${womensDoubles.id}`, {
    type: 'ROUND_ROBIN'
  });

  const roundRobinFixtures = roundRobinFixturesRes?.data;
  if (roundRobinFixtures) {
    console.log(`   Generated ${roundRobinFixtures.matches?.length || 0} matches in ${roundRobinFixtures.totalRounds} rounds\n`);
  }

  // Test 12: Get Fixtures for Men's Singles
  console.log('📊 Test 12: Fetching Men\'s Singles Fixtures...');
  const mensSinglesFixturesRes = await apiRequest('GET', `/fixtures/event/${mensSingles.id}`);
  const mensSinglesFixtures = mensSinglesFixturesRes?.data;
  if (mensSinglesFixtures?.flatMatches) {
    console.log(`   Found ${mensSinglesFixtures.flatMatches.length} matches`);
  }

  // Test 13: Update Match Score (First Match)
  if (knockoutFixtures?.matches && knockoutFixtures.matches.length > 0) {
    console.log('🎯 Test 13: Updating Match Score...');
    const firstMatch = knockoutFixtures.matches[0];
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

      if (updatedMatchRes?.success) {
        console.log(`   Match updated - Winner: ${updatedMatchRes.match.winnerId}\n`);
      }
    }
  }

  // Test 14: Get Tournament Details
  console.log('🏆 Test 14: Fetching Tournament Details...');
  const tournamentDetailsRes = await apiRequest('GET', `/tournaments/${tournament.id}`);
  const tournamentDetails = tournamentDetailsRes?.tournament;
  if (tournamentDetails) {
    console.log(`   Tournament: ${tournamentDetails.name}`);
    console.log(`   Events: ${tournamentDetails.events?.length || 0}`);
    console.log(`   Courts: ${tournamentDetails.courts?.length || 0}\n`);
  }

  // Test 15: Get All Tournaments
  console.log('🏆 Test 15: Fetching All Tournaments...');
  const allTournamentsRes = await apiRequest('GET', '/tournaments');
  const allTournaments = allTournamentsRes?.tournaments || [];
  console.log(`   Total tournaments: ${allTournaments.length}\n`);

  console.log('✨ All tests completed!\n');
  console.log('📊 Summary:');
  console.log(`   - Clubs: ${clubs.length}`);
  console.log(`   - Tournaments: ${allTournaments.length}`);
  console.log(`   - Players: ${allPlayers.length}`);
  console.log(`   - Events: 2 (Knockout + Round Robin)`);
  console.log(`   - Knockout Matches: ${knockoutFixtures?.matches?.length || 0}`);
  console.log(`   - Round Robin Matches: ${roundRobinFixtures?.matches?.length || 0}`);
}

// Run the tests
runTests().catch(console.error);
