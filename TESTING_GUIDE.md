# 🧪 xSPRINT Testing Guide

## Quick Test Checklist

### ✅ Pre-Testing Setup

```bash
# 1. Ensure PostgreSQL is running
# Windows: Check Services or run `pg_ctl status`

# 2. Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL

# 3. Database setup
npx prisma migrate dev
npm run db:seed

# 4. Frontend setup
cd ../frontend
npm install
cp .env.local.example .env.local
# Edit .env.local
```

---

## 🎯 Test Plan

### Phase 1: Backend API Testing (15 min)

#### 1.1 Start Backend
```bash
cd backend
npm run dev
```

**Expected Output:**
```
Server running on port 3001
Database connected
```

#### 1.2 Health Check
```bash
# Test health endpoint
curl http://localhost:3001/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "UP",
    "timestamp": "2024-...",
    "uptime": 123
  }
}
```

✅ **Pass Criteria:** Status 200, success: true

#### 1.3 Authentication Flow

**A. Register Admin (if not seeded)**
```bash
curl -X POST http://localhost:3001/api/auth/register-admin \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Admin\",\"email\":\"test@admin.com\",\"password\":\"admin123\"}"
```

**B. Login**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@xsprint.com\",\"password\":\"admin123\"}" \
  -c cookies.txt
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "admin@xsprint.com",
      "role": "ADMIN"
    }
  }
}
```

✅ **Pass Criteria:** Cookie set, user object returned

**C. Get Current User**
```bash
curl http://localhost:3001/api/auth/me -b cookies.txt
```

✅ **Pass Criteria:** Returns user object

**D. Logout**
```bash
curl -X POST http://localhost:3001/api/auth/logout -b cookies.txt
```

✅ **Pass Criteria:** Cookie cleared

#### 1.4 Analytics Endpoints

**A. Fixture Analysis**
```bash
# Get event ID from seed data (check database or logs)
curl http://localhost:3001/api/events/{EVENT_ID}/fixture-analysis \
  -b cookies.txt
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "eventId": "...",
    "eventName": "Men's Singles U21",
    "totalMatches": 15,
    "sameClubClashes": [...],
    "fairnessScore": 85,
    "generatedAt": "..."
  }
}
```

✅ **Pass Criteria:** Fairness score 0-100, clash detection works

**B. Schedule Quality**
```bash
curl http://localhost:3001/api/events/{EVENT_ID}/schedule-quality \
  -b cookies.txt
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "courts": [...],
    "averageUtilization": 72,
    "scheduleScore": 88,
    "restTimeIssues": [...]
  }
}
```

✅ **Pass Criteria:** Schedule score 0-100, court utilization calculated

#### 1.5 Rate Limiting Test

```bash
# Send 10 rapid requests
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"wrong@email.com\",\"password\":\"wrong\"}"
  echo ""
done
```

✅ **Pass Criteria:** After 5 attempts, should return 429 (Too Many Requests)

---

### Phase 2: Frontend Testing (20 min)

#### 2.1 Start Frontend
```bash
cd frontend
npm run dev
```

**Expected Output:**
```
Ready on http://localhost:3000
```

#### 2.2 Manual UI Testing

**A. Login Flow**
1. Visit `http://localhost:3000/login`
2. Enter: `admin@xsprint.com` / `admin123`
3. Click "Login"

✅ **Pass Criteria:**
- Redirects to `/admin/dashboard`
- No console errors
- Session badge shows "ADMIN"

**B. Admin Dashboard**
1. Check dashboard loads
2. Verify stats cards display
3. Check navigation sidebar

✅ **Pass Criteria:**
- All components render
- No loading errors
- Stats show seeded data

**C. Protected Routes**
1. Logout
2. Try to visit `/admin/dashboard` directly

✅ **Pass Criteria:**
- Redirects to `/login?reason=session-required`

**D. 404 Page**
1. Visit `http://localhost:3000/nonexistent-page`

✅ **Pass Criteria:**
- Custom 404 page shows
- Navigation buttons work

**E. Umpire Flow**
1. Login as: `umpire@xsprint.com` / `umpire123`
2. Visit `/umpire/matches`
3. Click "Open Scoring" on a match

✅ **Pass Criteria:**
- Matches list shows
- Scoring console loads
- Can navigate back

**F. Toast Notifications**
1. Try to login with wrong password
2. Check toast appears

✅ **Pass Criteria:**
- Error toast shows
- Auto-dismisses after 5 seconds

---

### Phase 3: Integration Testing (15 min)

#### 3.1 End-to-End Tournament Flow

**Step 1: Login as Admin**
```
Email: admin@xsprint.com
Password: admin123
```

**Step 2: View Tournament**
- Navigate to tournaments list
- Click on "xSprint Demo Open 2025"

✅ **Pass Criteria:** Tournament details load

**Step 3: View Event**
- Click on "Men's Singles U21"
- View fixtures

✅ **Pass Criteria:** Fixtures display in bracket format

**Step 4: View Schedule**
- Navigate to schedule
- Check court assignments

✅ **Pass Criteria:** Matches scheduled across 4 courts

**Step 5: View Analytics**
- Navigate to event insights
- Check fairness score
- Check court utilization

✅ **Pass Criteria:**
- Fairness score displays
- Charts/metrics show
- No errors

**Step 6: View Leaderboard**
- Navigate to standings
- Check rankings

✅ **Pass Criteria:**
- Completed matches show results
- Rankings calculated correctly

#### 3.2 Umpire Match Submission

**Step 1: Login as Umpire**
```
Email: umpire@xsprint.com
Password: umpire123
```

**Step 2: View Assigned Matches**
- Navigate to `/umpire/matches`

✅ **Pass Criteria:** List of assigned matches shows

**Step 3: Score a Match** (if match codes exist)
- Click "Open Scoring"
- Enter match code
- Submit scores

✅ **Pass Criteria:**
- Code validation works
- Score submission succeeds
- Redirects to matches list

---

### Phase 4: Performance Testing (10 min)

#### 4.1 Leaderboard Caching

```bash
# Test 1: First request (cache miss)
time curl http://localhost:3001/api/events/{EVENT_ID}/standings -b cookies.txt

# Test 2: Second request (cache hit - should be faster)
time curl http://localhost:3001/api/events/{EVENT_ID}/standings -b cookies.txt
```

✅ **Pass Criteria:** Second request is noticeably faster

#### 4.2 Concurrent Requests

```bash
# Send 20 concurrent requests
for i in {1..20}; do
  curl http://localhost:3001/api/health &
done
wait
```

✅ **Pass Criteria:** All requests succeed, no crashes

---

### Phase 5: Error Handling Testing (10 min)

#### 5.1 Invalid Input

```bash
# Test invalid email
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"invalid-email\",\"password\":\"test\"}"
```

✅ **Pass Criteria:** Returns 400 with validation error

#### 5.2 Unauthorized Access

```bash
# Try to access admin endpoint without auth
curl http://localhost:3001/api/events/{EVENT_ID}/fixture-analysis
```

✅ **Pass Criteria:** Returns 401 Unauthorized

#### 5.3 Not Found

```bash
curl http://localhost:3001/api/events/nonexistent-id/fixtures
```

✅ **Pass Criteria:** Returns 404 Not Found

#### 5.4 Database Error Simulation

```bash
# Try to create duplicate user
curl -X POST http://localhost:3001/api/auth/register-admin \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test\",\"email\":\"admin@xsprint.com\",\"password\":\"test123\"}"
```

✅ **Pass Criteria:** Returns 409 Conflict with proper error message

---

## 🔍 Browser DevTools Checks

### Console Checks
1. Open DevTools (F12)
2. Navigate through app
3. Check Console tab

✅ **Pass Criteria:**
- No red errors
- Only expected warnings (if any)

### Network Checks
1. Open Network tab
2. Perform actions
3. Check requests

✅ **Pass Criteria:**
- All API calls return 200/201
- Proper error codes for failures
- Cookies set correctly

### Application Storage
1. Open Application tab
2. Check Cookies
3. Check Local Storage

✅ **Pass Criteria:**
- `auth_token` cookie present after login
- `xsprint_last_role` in localStorage

---

## 📊 Test Results Template

```
# xSPRINT Test Results - [Date]

## Backend Tests
- [ ] Health check
- [ ] Authentication flow
- [ ] Fixture analysis endpoint
- [ ] Schedule quality endpoint
- [ ] Rate limiting
- [ ] Error handling

## Frontend Tests
- [ ] Login flow
- [ ] Admin dashboard
- [ ] Protected routes
- [ ] 404 page
- [ ] Umpire console
- [ ] Toast notifications

## Integration Tests
- [ ] End-to-end tournament flow
- [ ] Umpire match submission
- [ ] Leaderboard caching

## Performance Tests
- [ ] Cache effectiveness
- [ ] Concurrent requests

## Error Handling Tests
- [ ] Invalid input
- [ ] Unauthorized access
- [ ] Not found errors
- [ ] Database errors

## Overall Status
- Total Tests: __
- Passed: __
- Failed: __
- Success Rate: __%

## Issues Found
1. [Issue description]
2. [Issue description]

## Notes
[Any additional observations]
```

---

## 🚨 Common Issues & Solutions

### Issue: Database Connection Error
**Solution:**
```bash
# Check PostgreSQL is running
# Verify DATABASE_URL in .env
npx prisma db push
```

### Issue: Port Already in Use
**Solution:**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or change PORT in .env
```

### Issue: Frontend Build Errors
**Solution:**
```bash
cd frontend
rm -rf .next node_modules
npm install
npm run dev
```

### Issue: Seed Script Fails
**Solution:**
```bash
cd backend
npx prisma migrate reset
npm run db:seed
```

---

## ✅ Final Verification Checklist

Before demo:
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Database has seeded data
- [ ] Can login as admin
- [ ] Can login as umpire
- [ ] Analytics endpoints return data
- [ ] Leaderboard shows results
- [ ] 404 page works
- [ ] Rate limiting works
- [ ] No console errors

---

**Testing Time:** ~70 minutes total
**Recommended:** Run all tests before demo/presentation
