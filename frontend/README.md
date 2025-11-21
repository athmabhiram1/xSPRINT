# Xthlete - Smart Tournament Management System

A comprehensive tournament management platform built with Next.js 16, Prisma, and NeonDB.

## Features

### Core Functionality
- 🏆 **Tournament Management** - Create and manage multiple tournaments
- 📋 **Event Creation** - Support for knockout and round-robin formats
- 👥 **Player Registration** - Register players with club affiliations
- 🎯 **Smart Fixture Generation** - Automatic bracket creation with same-club avoidance
- ⏰ **Intelligent Scheduling** - Multi-court scheduling with rest time management
- 🔐 **Secure Match Codes** - Cryptographically hashed codes for result submission
- 📊 **Live Leaderboards** - Real-time tournament standings
- 🎮 **Umpire Interface** - Dedicated interface for match officials
- 👔 **Admin Dashboard** - Comprehensive tournament control panel

### Technical Highlights
- **Backend**: Next.js 16 App Router with Server Actions
- **Database**: NeonDB (PostgreSQL) with Prisma ORM
- **UI**: Tailwind CSS v4 with shadcn/ui components
- **Security**: bcrypt for password hashing, match code validation
- **Type Safety**: Full TypeScript coverage

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- NeonDB account (or PostgreSQL database)

### 1. Clone & Install

```bash
cd frontend
npm install --legacy-peer-deps
```

### 2. Database Setup

Create a `.env` file in the `frontend` directory:

```env
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"
```

### 3. Initialize Database

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Or push schema directly (for development)
npm run db:push
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Project Structure

```
frontend/
├── app/
│   ├── api/              # API routes
│   │   ├── clubs/
│   │   ├── events/
│   │   ├── fixtures/
│   │   ├── matches/
│   │   ├── players/
│   │   ├── schedule/
│   │   └── tournaments/
│   ├── tournaments/      # Frontend pages
│   │   └── [id]/
│   │       ├── admin/
│   │       ├── umpire/
│   │       └── leaderboard/
│   └── globals.css
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── bracket-match-card.tsx
│   ├── navbar.tsx
│   └── tournament-card.tsx
├── lib/
│   ├── api.ts           # API client functions
│   ├── db.ts            # Prisma client
│   ├── fixtures.ts      # Fixture generation logic
│   ├── scheduler.ts     # Scheduling algorithms
│   └── types.ts         # TypeScript types
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/
└── prisma.config.ts     # Prisma 7.0 config
```

## API Endpoints

### Tournaments
- `POST /api/tournaments` - Create tournament
- `GET /api/tournaments` - List all tournaments
- `GET /api/tournaments/[id]` - Get tournament details

### Events
- `POST /api/events` - Create event

### Clubs
- `POST /api/clubs` - Create club
- `GET /api/clubs` - List all clubs

### Players
- `POST /api/players/register` - Register player to event

### Fixtures
- `POST /api/fixtures/generate` - Generate tournament brackets

### Schedule
- `POST /api/schedule/generate` - Schedule matches across courts

### Matches
- `POST /api/matches/submit-result` - Submit match result
- `POST /api/matches/generate-code` - Generate secure match code

## Workflow

1. **Create Tournament**
   ```typescript
   await createTournament({
     name: "Summer Championship 2025",
     startTime: "2025-06-01T09:00:00Z",
     courts: ["Court 1", "Court 2", "Court 3", "Court 4"]
   });
   ```

2. **Create Event**
   ```typescript
   await createEvent({
     tournamentId: "...",
     name: "U15 Boys Singles",
     format: "knockout"
   });
   ```

3. **Register Players**
   ```typescript
   await registerPlayer({
     fullName: "John Doe",
     clubId: "...",
     eventId: "..."
   });
   ```

4. **Generate Fixtures**
   ```typescript
   await generateFixtures(eventId);
   ```

5. **Schedule Matches**
   ```typescript
   await generateSchedule(tournamentId, eventId);
   ```

6. **Submit Results** (via Umpire Interface)
   ```typescript
   await submitResult({
     matchId: "...",
     matchCode: "ABC123",
     winnerId: "...",
     score: "21-15, 21-18"
   });
   ```

## Key Algorithms

### Club-Entropy Seeding (CES)
Distributes players from the same club across different bracket quadrants to prevent early matchups between clubmates.

### Multi-Court Scheduler
- Tracks court availability
- Maintains player rest times (default: 10 minutes)
- Prevents double-booking
- Optimizes court utilization

### Match Code Security
- 6-character alphanumeric codes
- Hashed with bcrypt (never stored in plain text)
- One-time use validation
- Assigned to specific umpires

## Database Schema

### Key Models
- **Tournament** - Container for events
- **Event** - Individual competition (e.g., U15 Singles)
- **Player** - Participant with club affiliation
- **Club** - Organization grouping
- **Match** - Individual match with binary tree structure
- **MatchSecret** - Secure match codes
- **Registration** - Player-Event relationship

### Match Tree Structure
Each match has:
- `nextMatchId` - Parent match in knockout tree
- `nextMatchSlot` - Position in parent match (A or B)
- Auto-propagation of winners

## Contributing

This project follows the comprehensive research outlined in the Xthlete Hackathon problem statement.

## License

MIT
