// ==========================================
// 📊 MODULE 4: LEADERBOARD UPDATER
// ==========================================

/**
 * Updates the leaderboard based on match results
 */
async function updateLeaderboard(eventId, winnerId, loserId) {
  try {
    // Get current leaderboard for the event
    const leaderboardRef = db.collection('leaderboards').doc(eventId);
    const leaderboardDoc = await leaderboardRef.get();
    
    let leaderboard = {};
    if (leaderboardDoc.exists) {
      leaderboard = leaderboardDoc.data();
    }
    
    // Update winner stats
    if (!leaderboard[winnerId]) {
      leaderboard[winnerId] = { wins: 0, losses: 0, points: 0 };
    }
    leaderboard[winnerId].wins += 1;
    leaderboard[winnerId].points += 2; // Assuming 2 points for win
    
    // Update loser stats
    if (!leaderboard[loserId]) {
      leaderboard[loserId] = { wins: 0, losses: 0, points: 0 };
    }
    leaderboard[loserId].losses += 1;
    
    // Save updated leaderboard
    await leaderboardRef.set(leaderboard);
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    throw error;
  }
}