# 🚀 xSPRINT Quick Start Guide

## Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

---

## 🎯 One-Command Demo Setup

### Step 1: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 2: Configure Environment

**Backend (.env)**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/xsprint"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"
```

**Frontend (.env.local)**
```bash
cd ../frontend
cp .env.local.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_ENV_NAME=DEV
```

### Step 3: Setup Database

```bash
cd backend

# Run migrations
npx prisma migrate dev

# Seed demo data (creates full tournament with matches!)
npm run db:seed
```

**This creates:**
- ✅ 6 clubs (Bangalore Smashers, Chennai Racers, etc.)
- ✅ 24 players distributed across clubs
- ✅ 1 tournament "xSprint Demo Open 2025"
- ✅ 1 event "Men's Singles U21" (Knockout, 16 players)
- ✅ Complete fixtures (all rounds)
- ✅ Schedule across 4 courts
- ✅ 6 completed matches with scores
- ✅ Admin & Umpire users

**Login Credentials:**
- Admin: `admin@xsprint.com` / `admin123`
- Umpire: `umpire@xsprint.com` / `umpire123`

### Step 4: Start Servers

**Terminal 1 - Backend**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**
```bash
cd frontend
npm run dev
```

---

## 🎮 Demo Flow

### 1. Login as Admin
- Visit: `http://localhost:3000/login`
- Email: `admin@xsprint.com`
- Password: `admin123`

### 2. Explore Admin Dashboard
- View tournament stats
- See active courts
- Check match status
- Access security activity panel

### 3. View Fixtures
- Navigate to event fixtures
- See complete knockout bracket
- View match assignments

### 4. Check Schedule
- View court schedule
- See time slots across 4 courts
- Check match timings

### 5. Tournament Insights ⭐
Navigate to `/events/[eventId]/insights` to see:
- **Fairness Score** (0-100)
- **Court Utilization** charts
- **Same-Club Clash Monitor**
- **Rest-Time Violations**
- **Schedule Quality Score**
- **Real-time updates** via Socket.IO

### 6. Leaderboard
- View current standings
- See completed match results
- Cached for performance (10s TTL)

### 7. Umpire Console
- Logout and login as: `umpire@xsprint.com` / `umpire123`
- View assigned matches
- Enter match codes
- Submit results with dynamic scoring

---

## 📊 API Endpoints (Demo-Ready)

### Analytics Endpoints ⭐ NEW
```bash
# Fixture Analysis (Fairness Scoring)
GET /api/events/:eventId/fixture-analysis
# Returns: same-club clashes, BYE distribution, fairness score

# Schedule Quality Report
GET /api/events/:eventId/schedule-quality
# Returns: court utilization, rest-time issues, schedule score
```

### Health Check
```bash
GET /api/health
# Returns: { status: "UP", timestamp, uptime }
```

### Authentication
```bash
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Tournaments & Events
```bash
GET  /api/tournaments
POST /api/tournaments (admin)
GET  /api/events/:id
```

### Matches
```bash
GET  /api/umpire/my-matches (umpire)
POST /api/matches/validate-code
POST /api/matches/result (umpire)
```

### Leaderboard (Cached)
```bash
GET /api/events/:id/standings
GET /api/events/:id/podium
```

---

## 🔥 Production Features Implemented

### Security ✅
- Helmet security headers
- CORS whitelist
- Compression
- Tiered rate limiting:
  - Global: 100 req / 15 min
  - Auth: 5 attempts / 15 min
  - Match Code: 10 attempts / 5 min
  - Results: 5 submissions / 1 min

### Error Handling ✅
- Centralized error handler
- Prisma error mapping
- Zod validation errors
- JWT error handling
- Unified response format

### Validation ✅
- Zod schemas for all endpoints
- Type-safe inputs
- Comprehensive error messages

### Caching ✅
- In-memory leaderboard cache (10s TTL)
- Auto-invalidation
- Pattern-based clearing

### Analytics ✅
- Fixture fairness analysis
- Schedule quality metrics
- Court utilization tracking
- Rest-time violation detection

---

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
# Verify DATABASE_URL in backend/.env
# Run: npx prisma db push
```

### Port Already in Use
```bash
# Backend (3001)
# Windows: netstat -ano | findstr :3001
# Kill process or change PORT in .env

# Frontend (3000)
# Change port in package.json dev script
```

### Seed Script Fails
```bash
# Reset database
cd backend
npx prisma migrate reset
npm run db:seed
```

### Frontend Build Errors
```bash
cd frontend
rm -rf .next
npm run build
```

---

## 📦 Production Deployment

### Backend (PM2)
```bash
cd backend
npm run build
pm2 start ecosystem.config.js --env production
```

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy to Vercel or serve with pm2
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment guide.

---

## 🎯 Next Steps

1. ✅ **Run the seeder** - Get instant demo data
2. ✅ **Login as admin** - Explore the dashboard
3. ✅ **Check insights** - See analytics in action
4. ✅ **Test umpire flow** - Submit match results
5. ✅ **View leaderboard** - See real-time updates

---

## 📞 Support

For issues:
- Check logs: `pm2 logs` (backend)
- Check browser console (frontend)
- Verify environment variables
- Review [README.md](./README.md)

---

**Made with ❤️ for tournament organizers**
