# 🚀 QUICK START - Step by Step

## ✅ ALL LINKING COMPLETE - Ready to Launch

---

## Step 1: Prepare Your Terminals

**You need 2-3 terminal windows:**

- **Terminal 1:** Backend
- **Terminal 2:** Frontend  
- **Terminal 3 (Optional):** Testing/Database

---

## Step 2: Start Backend

**Terminal 1:**
```bash
cd backend
npm run dev
```

**Expected output:**
```
> xsprint-backend@1.0.0 dev
> ts-node-dev --respawn --transpile-only src/index.ts

[nodemon] 2.0.20
[nodemon] to restart at any time, type `rs`
[nodemon] watching path(s): src/**/* .env
[nodemon] watching extensions: ts,json
[ts] Compiling TypeScript
Server is running on http://localhost:5000
Health check endpoint: http://localhost:5000/api/health
```

**✅ Leave this running**

---

## Step 3: Start Frontend

**Terminal 2:**
```bash
cd frontend
npm run dev
```

**Expected output:**
```
> xthlete-frontend@1.0.0 dev
> next dev

▲ Next.js 14.0.0

- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.5s
```

**✅ Leave this running**

---

## Step 4: Open Browser

```
http://localhost:3000
```

**Expected:**
- xSPRINT homepage loads
- No CORS errors in console (F12)
- Navigation works

---

## Step 5: Create Admin Account

1. Click **Admin** or navigate to: `http://localhost:3000/admin/bootstrap`
2. Fill in the form:
   - **Name:** Admin
   - **Email:** admin@xsprint.com
   - **Password:** Any secure password
   - **Admin Code:** `AthmaAdminInit5321`
3. Click **Create Admin**

**Expected:**
- Account created
- Automatically logged in
- Redirected to admin dashboard

---

## Step 6: Verify Everything Works

### Test 1: Check Backend Health
```bash
curl http://localhost:5000/api/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "UP",
    "timestamp": "2025-11-23T...",
    "uptime": 345
  }
}
```

### Test 2: Check Browser Console
1. Press **F12** (DevTools)
2. Go to **Console** tab
3. Look for any errors
4. Should be clean (or only warnings)

### Test 3: Test API Call from Browser
```javascript
// Paste in Console (F12)
fetch('http://localhost:5000/api/auth/me', {credentials: 'include'})
  .then(r => r.json())
  .then(d => console.log(d))
```

**Expected:**
```json
{
  "user": {
    "id": "...",
    "name": "Admin",
    "email": "admin@xsprint.com",
    "role": "ADMIN"
  }
}
```

---

## Step 7: Create a Tournament

1. Go to Admin Dashboard
2. Click **Create Tournament** (or Tournaments menu)
3. Fill in:
   - **Name:** Test Tournament
   - **Location:** Your City
   - **Start Date:** Today
   - **End Date:** Tomorrow
4. Click **Create**

**Expected:**
- Tournament created
- Can see it in the list

---

## Step 8: Add Courts

1. Click on the tournament
2. Click **Add Courts**
3. Add 4 courts:
   - Court 1
   - Court 2
   - Court 3
   - Court 4
4. Click **Save**

---

## Step 9: Create Event

1. Go to the tournament
2. Click **Create Event**
3. Fill in:
   - **Name:** Men's Singles U18
   - **Type:** KNOCKOUT
   - **Category:** U18
4. Click **Create**

---

## Step 10: Add Players

1. Go to **Players** in admin
2. Click **Add Player**
3. Fill in player details
4. Click **Create**

**Repeat for at least 4 players**

---

## Step 11: Register Players to Event

1. Go to the event
2. Click **Register Players**
3. Select players
4. Assign seeds (1, 2, 3, 4...)
5. Click **Register**

---

## Step 12: Generate Fixture

1. Go to event details
2. Click **Generate Fixture**
3. Select **KNOCKOUT** format
4. Click **Generate**

**Expected:**
- Bracket shows 4 matches (Round 1)
- Winners will advance to final

---

## Step 13: Auto-Generate Schedule

1. Click **Generate Schedule**
2. Click **Auto-Generate**

**Expected:**
- Matches get assigned to courts
- Times are scheduled
- Shows on schedule view

---

## Step 14: Submit Match Result (as Umpire)

1. Logout (if logged in as admin)
2. Create umpire account (register new user)
3. Have admin assign umpire to match
4. Admin generates match code
5. Umpire enters code and submits score
6. Winner propagates to final

---

## 🎉 Congratulations!

Your **xSPRINT** system is now fully operational! 🚀

---

## 🧪 Quick Test Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Browser opens http://localhost:3000
- [ ] No CORS errors in console
- [ ] Can create admin account
- [ ] Can create tournament
- [ ] Can add courts
- [ ] Can create event
- [ ] Can add players
- [ ] Can register players to event
- [ ] Can generate fixtures
- [ ] Can generate schedule
- [ ] Leaderboard updates

---

## 🔧 Troubleshooting

### Backend won't start
```bash
# Kill any process on port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :5000
kill -9 <PID>

# Then try again
npm run dev
```

### Frontend won't start
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### CORS Error
```bash
# Make sure backend/.env has this line:
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000,http://localhost:3001

# Restart backend (Ctrl+C, then npm run dev)
```

### Database error
```bash
# Check connection string
cat backend/.env | grep DATABASE_URL

# Run migrations
cd backend
npx prisma migrate dev
npx prisma generate

# Then try again
npm run dev
```

---

## 📞 Quick Commands Reference

```bash
# Backend
cd backend && npm run dev          # Start dev server
npx prisma studio                 # Open database UI
npx prisma migrate dev            # Run migrations
npm run build                      # Build for production

# Frontend
cd frontend && npm run dev         # Start dev server
npm run build                      # Build for production
npm run lint                       # Check code quality

# Utilities
curl http://localhost:5000/api/health    # Health check
```

---

## 📊 Ports Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 5000 | http://localhost:5000 |
| Database | - | NeonDB (remote) |
| Prisma Studio | 5555 | http://localhost:5555 |

---

## ✨ System Status

```
✅ Frontend:    Ready on localhost:3000
✅ Backend:     Ready on localhost:5000
✅ Database:    Connected (NeonDB)
✅ CORS:        Configured
✅ Auth:        Working
✅ API:         Operational
✅ UI:          Responsive
✅ Security:    Enabled
```

---

**Your xSPRINT Tournament Management System is ready! 🏆**

Start building and managing amazing tournaments! 🚀

---

**Last Updated:** November 23, 2025
