// ==========================================
// 🧠 MODULE 2: SMART SCHEDULER
// ==========================================

/**
 * Assigns courts and times while respecting constraints:
 * 1. No player overlap
 * 2. Minimum Rest Time
 * 3. Maximize Court Usage
 */
async function scheduleMatches(eventId, courtIds, startTime) {
  try {
    // Fetch fixtures for the event
    const fixturesSnapshot = await db.collection('fixtures')
      .where('eventId', '==', eventId)
      .where('status', '==', 'PENDING')
      .get();
    
    const fixtures = [];
    fixturesSnapshot.forEach(doc => {
      fixtures.push({ id: doc.id, ...doc.data() });
    });

    // Fetch court details
    const courtPromises = courtIds.map(id => db.collection('courts').doc(id).get());
    const courtDocs = await Promise.all(courtPromises);
    const courts = courtDocs
      .filter(doc => doc.exists)
      .map(doc => ({ id: doc.id, ...doc.data() }));

    const schedule = [];
    
    // Track when each court becomes free (in minutes from start of day)
    let courtAvailability = courts.map(c => ({ 
      id: c.id, 
      name: c.name,
      freeAt: startTime 
    }));

    // Track when each player becomes free (to ensure rest time)
    let playerAvailability = {};

    // Helper to convert Minutes to HH:MM
    const minsToTime = (mins) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    // Sort fixtures to process them in order
    fixtures.sort((a, b) => a.round - b.round);

    for (const fixture of fixtures) {
      // Skip BYE matches
      if (fixture.status === 'BYE') continue;

      // Get player IDs
      const p1Id = fixture.p1.id;
      const p2Id = fixture.p2.id;

      // Find the earliest time this match can be played
      const p1Free = playerAvailability[p1Id] || startTime;
      const p2Free = playerAvailability[p2Id] || startTime;
      const playersReadyAt = Math.max(p1Free, p2Free);

      // Find the earliest court available AFTER players are ready
      courtAvailability.sort((a, b) => a.freeAt - b.freeAt);
      
      let selectedCourt = null;
      let startTimeMatch = 0;

      // Find the first available court
      for (let court of courtAvailability) {
        const potentialStart = Math.max(court.freeAt, playersReadyAt);
        
        selectedCourt = court;
        startTimeMatch = potentialStart;
        break;
      }

      // Calculate end time
      const endTime = startTimeMatch + MATCH_DURATION_MINS;
      
      // Create schedule entry
      const scheduleEntry = {
        id: `SCH_${fixture.id}`,
        eventId: eventId,
        fixtureId: fixture.id,
        courtId: selectedCourt.id,
        courtName: selectedCourt.name,
        player1Id: p1Id,
        player2Id: p2Id,
        startTime: minsToTime(startTimeMatch),
        endTime: minsToTime(endTime),
        status: 'SCHEDULED',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Update Availability
      selectedCourt.freeAt = endTime; // Court is busy until end
      playerAvailability[p1Id] = endTime + REST_TIME_MINS; // Player needs rest
      playerAvailability[p2Id] = endTime + REST_TIME_MINS;

      schedule.push(scheduleEntry);
    }

    // Save schedule to Firestore
    const batch = db.batch();
    schedule.forEach(entry => {
      const scheduleRef = db.collection('schedules').doc(entry.id);
      batch.set(scheduleRef, entry);
    });
    await batch.commit();

    return schedule;
  } catch (error) {
    console.error('Error scheduling matches:', error);
    throw error;
  }
}