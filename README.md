# xSPRINT - Tournament Management System

A comprehensive tournament management platform with advanced fixture generation, real-time scheduling, and premium UI/UX.

## Features

### Backend
- **Enhanced Fixture Engine** with 5 tournament formats
  - Knockout (Single Elimination)
  - Round Robin
  - Swiss System
  - Double Elimination
  - Groups + Playoff
- **Advanced Seeding** (ELO, Historical Performance, Random, Manual)
- **Multi-objective Optimization** using simulated annealing
- **Fairness Scoring** (0-100 scale)
- **Preview & Rollback** functionality
- **Audit Logging** for all operations

### Frontend
- **Premium Design System** with glassmorphism
- **Animated Gradients** and 3D hover effects
- **Advanced Fixtures Page** with visual format selector
- **Schedule Optimizer** with Gantt chart and drag-and-drop
- **Responsive Design** for all devices

## Tech Stack

**Backend:**
- Node.js + Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Socket.IO

**Frontend:**
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Shadcn/ui

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/xsprint.git
cd xsprint
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

4. Set up environment variables

**Backend (.env):**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/xsprint"
JWT_SECRET="your-secret-key"
PORT=5000
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

5. Run database migrations
```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

6. Start development servers

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Project Structure

```
xsprint/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   │   └── FixtureEngineEnhanced.ts
│   │   └── middleware/
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── fixtures/advanced/
│   │   │   └── schedule/optimizer/
│   │   ├── globals.css
│   │   └── page.tsx
│   ├── components/
│   └── package.json
└── README.md
```

## API Endpoints

### Fixtures
- `POST /api/fixtures/generate/:eventId` - Generate fixtures
- `POST /api/fixtures/preview/:eventId` - Preview fixtures (dry-run)
- `GET /api/fixtures/fairness-score/:eventId` - Get fairness score
- `POST /api/fixtures/rollback/:eventId` - Rollback to previous state

### Events
- `GET /api/events` - List all events
- `POST /api/events` - Create new event
- `GET /api/events/:id` - Get event details

### Schedule
- `POST /api/schedule/generate` - Generate match schedule
- `GET /api/schedule/:eventId` - Get event schedule

## Usage Examples

### Generate Swiss System Tournament
```typescript
const response = await fetch('/api/fixtures/preview/event-123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    format: 'swiss',
    options: {
      swissRounds: 5,
      seedingStrategy: 'elo_rating'
    }
  })
});

const { fairnessScore, matches } = await response.json();
console.log(`Fairness: ${fairnessScore}/100`);
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Enhanced FixtureEngine algorithm inspired by competitive programming tournament systems
- UI/UX design follows modern glassmorphism trends
- Simulated annealing optimization based on academic research

## Support

For support, email support@xsprint.com or open an issue on GitHub.
