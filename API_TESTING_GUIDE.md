# xSPRINT API Testing Guide

Complete guide to testing all API endpoints manually or with tools like Postman/Insomnia.

---

## 🔧 Setup

**Base URL:** `http://localhost:5000`

**Headers for all requests:**
```
Content-Type: application/json
```

---

## 1️⃣ AUTHENTICATION

### Register Admin (Bootstrap)

**Endpoint:** `POST /api/auth/register-admin`

**Body:**
```json
{
  "name": "Admin User",
  "email": "admin@xsprint.com",
  "password": "Admin@123",
  "adminCode": "ADMIN2024_CHANGE_THIS"
}
```

**Expected Response (201):**
```json
{
  "message": "Admin user created successfully",
  "user": {
    "id": "clx...",
    "name": "Admin User",
    "email": "admin@xsprint.com",
    "role": "ADMIN",
    "createdAt": "2025-11-23T..."
  }
}
```

**Cookie Set:** `xsprint_token` (httpOnly)

---

### Register Regular User

**Endpoint:** `POST /api/auth/register`

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123"
}
```

**Expected Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "clx...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "VIEWER",
    "createdAt": "2025-11-23T..."
  }
}
```

---

### Login

**Endpoint:** `POST /api/auth/login`

**Body:**
```json
{
  "email": "admin@xsprint.com",
  "password": "Admin@123"
}
```

**Expected Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "clx...",
    "name": "Admin User",
    "email": "admin@xsprint.com",
    "role": "ADMIN",
    "createdAt": "2025-11-23T..."
  }
}
```

---

### Get Current User

**Endpoint:** `GET /api/auth/me`

**Requires:** Authentication Cookie

**Expected Response (200):**
```json
{
  "user": {
    "id": "clx...",
    "name": "Admin User",
    "email": "admin@xsprint.com",
    "role": "ADMIN",
    "createdAt": "2025-11-23T...",
    "updatedAt": "2025-11-23T..."
  }
}
```

---

### Logout

**Endpoint:** `POST /api/auth/logout`

**Expected Response (200):**
```json
{
  "message": "Logout successful"
}
```

**Cookie Cleared:** `xsprint_token`

---

## 2️⃣ CLUBS

### Create Club

**Endpoint:** `POST /api/clubs`

**Requires:** Admin/Organizer role

**Body:**
```json
{
  "name": "Phoenix Badminton Club",
  "location": "Mumbai, India",
  "description": "Premier badminton training center"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "name": "Phoenix Badminton Club",
    "location": "Mumbai, India",
    "description": "Premier badminton training center"
  }
}
```

---

### List Clubs

**Endpoint:** `GET /api/clubs`

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "name": "Phoenix Badminton Club",
      "location": "Mumbai, India",
      "description": "Premier badminton training center"
    }
  ]
}
```

---

## 3️⃣ PLAYERS

### Create Player

**Endpoint:** `POST /api/players`

**Requires:** Admin/Organizer role

**Body:**
```json
{
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "gender": "Male",
  "category": "U18",
  "clubId": "clx...",
  "weight": "65kg",
  "description": "State-level player"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "playerId": "XS-ABC123",
    "name": "Rahul Sharma",
    "email": "rahul@example.com",
    "gender": "Male",
    "category": "U18",
    "clubId": "clx...",
    "weight": "65kg"
  }
}
```

---

## 4️⃣ TOURNAMENTS

### Create Tournament

**Endpoint:** `POST /api/tournaments`

**Requires:** Admin/Organizer role

**Body:**
```json
{
  "name": "National Badminton Championship 2025",
  "location": "Delhi Stadium",
  "startDate": "2025-12-01T09:00:00Z",
  "endDate": "2025-12-10T18:00:00Z"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "name": "National Badminton Championship 2025",
    "location": "Delhi Stadium",
    "startDate": "2025-12-01T09:00:00.000Z",
    "endDate": "2025-12-10T18:00:00.000Z"
  }
}
```

---

### Add Courts to Tournament

**Endpoint:** `POST /api/tournaments/:tournamentId/courts`

**Body:**
```json
{
  "courts": [
    { "name": "Court 1" },
    { "name": "Court 2" },
    { "name": "Court 3" },
    { "name": "Court 4" }
  ]
}
```

---

## 5️⃣ EVENTS

### Create Event

**Endpoint:** `POST /api/events`

**Requires:** Admin/Organizer role

**Body:**
```json
{
  "name": "Men's Singles U18",
  "tournamentId": "clx...",
  "sport": "Badminton",
  "type": "KNOCKOUT",
  "gender": "Male",
  "category": "U18"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "name": "Men's Singles U18",
    "tournamentId": "clx...",
    "sport": "Badminton",
    "type": "KNOCKOUT",
    "gender": "Male",
    "category": "U18",
    "createdAt": "2025-11-23T..."
  }
}
```

---

### Register Player to Event

**Endpoint:** `POST /api/events/register`

**Requires:** Admin/Organizer role

**Body:**
```json
{
  "eventId": "clx...",
  "playerId": "clx...",
  "seed": 1
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Player registered successfully",
  "data": {
    "id": "clx...",
    "eventId": "clx...",
    "playerId": "clx...",
    "seed": 1
  }
}
```

**Repeat for multiple players (minimum 2 required for fixture generation)**

---

## 6️⃣ FIXTURES

### Generate Fixture

**Endpoint:** `POST /api/fixtures/generate/:eventId`

**Requires:** Admin/Organizer role

**Body:**
```json
{
  "type": "KNOCKOUT"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Fixture generated successfully for event 'Men's Singles U18' using KNOCKOUT format.",
  "data": {
    "totalMatches": 7,
    "totalRounds": 3,
    "participantsCount": 8,
    "matches": [
      {
        "id": "clx...",
        "round": 1,
        "matchNumber": 1,
        "playerAId": "clx...",
        "playerBId": "clx...",
        "status": "PENDING",
        "playerA": { "name": "Player 1" },
        "playerB": { "name": "Player 8" }
      }
      // ... more matches
    ]
  }
}
```

---

### Get Fixture Bracket

**Endpoint:** `GET /api/fixtures/event/:eventId`

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "eventId": "clx...",
    "eventName": "Men's Singles U18",
    "fixtureType": "KNOCKOUT",
    "totalMatches": 7,
    "totalRounds": 3,
    "statusCounts": {
      "pending": 7,
      "scheduled": 0,
      "completed": 0
    },
    "rounds": {
      "1": [ /* Round 1 matches */ ],
      "2": [ /* Round 2 matches */ ],
      "3": [ /* Final match */ ]
    }
  }
}
```

---

## 7️⃣ SCHEDULING

### Auto-Generate Schedule

**Endpoint:** `POST /api/schedule/auto`

**Requires:** Admin/Organizer role

**Body (Option 1 - Simple with start time):**
```json
{
  "eventId": "clx...",
  "startTime": "2025-12-01T09:00:00Z",
  "matchDuration": 45
}
```

**Body (Option 2 - Intelligent CPM-based):**
```json
{
  "eventId": "clx..."
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Schedule generated successfully",
  "data": {
    "eventId": "clx...",
    "eventName": "Men's Singles U18",
    "totalScheduled": 7,
    "matches": [
      {
        "id": "clx...",
        "round": 1,
        "matchNumber": 1,
        "startTime": "2025-12-01T09:00:00.000Z",
        "endTime": "2025-12-01T09:45:00.000Z",
        "status": "SCHEDULED",
        "schedule": {
          "court": {
            "name": "Court 1"
          }
        }
      }
      // ... more scheduled matches
    ]
  }
}
```

---

## 8️⃣ MATCH CODES

### Generate Match Code

**Endpoint:** `POST /api/matches/:matchId/generate-code`

**Requires:** Admin/Organizer role

**Body:**
```json
{
  "umpireId": "clx..."
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Match code generated successfully",
  "data": {
    "code": "123456",
    "matchId": "clx...",
    "assignedUmpire": {
      "id": "clx...",
      "name": "Umpire Name",
      "email": "umpire@example.com"
    },
    "expiresAt": "2025-11-24T12:00:00.000Z"
  }
}
```

**⚠️ Note:** The raw code `123456` is shown ONLY ONCE. Store it securely!

---

### Validate Match Code

**Endpoint:** `POST /api/matches/validate-code`

**Requires:** Umpire authentication

**Body:**
```json
{
  "matchId": "clx...",
  "code": "123456"
}
```

**Expected Response (200) - Valid:**
```json
{
  "success": true,
  "valid": true,
  "message": "Code is valid"
}
```

**Expected Response (200) - Invalid:**
```json
{
  "success": true,
  "valid": false,
  "message": "Invalid code"
}
```

---

## 9️⃣ MATCH RESULTS

### Submit Match Result

**Endpoint:** `POST /api/matches/result`

**Requires:** Umpire role + Valid match code

**Body:**
```json
{
  "matchId": "clx...",
  "code": "123456",
  "winnerId": "clx...",
  "score": {
    "sets": [
      { "a": 21, "b": 15 },
      { "a": 19, "b": 21 },
      { "a": 21, "b": 18 }
    ]
  }
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Match result submitted successfully",
  "data": {
    "match": {
      "id": "clx...",
      "status": "COMPLETED",
      "winnerId": "clx...",
      "score": { /* score object */ }
    },
    "nextMatch": {
      "id": "clx...",
      "round": 2,
      "matchNumber": 1,
      "playerAId": "clx...",
      "playerBId": null
    }
  }
}
```

**Effects:**
- Match status → `COMPLETED`
- Winner propagated to next round
- Match code invalidated
- Leaderboard updated
- WebSocket event: `LEADERBOARD_UPDATED` broadcast

---

## 🔟 LEADERBOARD

### Get Event Standings

**Endpoint:** `GET /api/events/:eventId/standings`

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "eventName": "Men's Singles U18",
    "standings": [
      {
        "rank": 1,
        "playerId": "clx...",
        "playerName": "Player 1",
        "clubId": "clx...",
        "clubName": "Phoenix Club",
        "matchesPlayed": 3,
        "wins": 3,
        "losses": 0,
        "points": 9,
        "setDiff": 6,
        "pointDiff": 45
      },
      {
        "rank": 2,
        "playerId": "clx...",
        "playerName": "Player 2",
        "matchesPlayed": 3,
        "wins": 2,
        "losses": 1,
        "points": 6,
        "setDiff": 2,
        "pointDiff": 20
      }
      // ... more players
    ]
  }
}
```

---

## 🧪 TESTING WORKFLOW

### Complete End-to-End Test

```bash
# 1. Create Admin
POST /api/auth/register-admin

# 2. Create Club
POST /api/clubs

# 3. Create Players (minimum 4 for testing)
POST /api/players (x4)

# 4. Create Tournament
POST /api/tournaments

# 5. Add Courts
POST /api/tournaments/:id/courts

# 6. Create Event
POST /api/events

# 7. Register Players to Event
POST /api/events/register (x4)

# 8. Generate Fixture (Knockout)
POST /api/fixtures/generate/:eventId

# 9. Auto-Generate Schedule
POST /api/schedule/auto

# 10. Create Umpire User
POST /api/auth/register (role: UMPIRE via admin panel)

# 11. Generate Match Code for Match
POST /api/matches/:matchId/generate-code

# 12. Login as Umpire
POST /api/auth/login

# 13. Validate Code
POST /api/matches/validate-code

# 14. Submit Match Result
POST /api/matches/result

# 15. Check Leaderboard
GET /api/events/:eventId/standings

# 16. Verify Winner Propagation
GET /api/fixtures/event/:eventId
```

---

## 🔧 Postman Collection

Import this JSON to Postman:

```json
{
  "info": {
    "name": "xSPRINT API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Register Admin",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/auth/register-admin",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Admin\",\n  \"email\": \"admin@test.com\",\n  \"password\": \"Admin@123\",\n  \"adminCode\": \"ADMIN2024\"\n}"
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000"
    }
  ]
}
```

---

## 📝 Notes

- All authenticated endpoints require the `xsprint_token` cookie
- Match codes expire after 24 hours
- Codes are single-use (invalidated after match completion)
- Admin can override any umpire restriction
- WebSocket events broadcast to all connected clients

---

**Happy Testing! 🧪**
