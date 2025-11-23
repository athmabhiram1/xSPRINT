#!/bin/bash

# xSPRINT Connection Verification Script
# This script verifies that frontend and backend are properly linked

echo "🔍 xSPRINT Frontend-Backend Connection Verification"
echo "=================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Backend running
echo -e "${YELLOW}[1/6]${NC} Checking if Backend is running on port 5000..."
if nc -z localhost 5000 2>/dev/null; then
    echo -e "${GREEN}✅ Backend is running on port 5000${NC}"
else
    echo -e "${RED}❌ Backend is NOT running on port 5000${NC}"
    echo "    Start backend with: cd backend && npm run dev"
fi

echo ""

# Check 2: Frontend running
echo -e "${YELLOW}[2/6]${NC} Checking if Frontend is running on port 3000..."
if nc -z localhost 3000 2>/dev/null; then
    echo -e "${GREEN}✅ Frontend is running on port 3000${NC}"
else
    echo -e "${RED}❌ Frontend is NOT running on port 3000${NC}"
    echo "    Start frontend with: cd frontend && npm run dev"
fi

echo ""

# Check 3: Backend Health Check
echo -e "${YELLOW}[3/6]${NC} Checking Backend API Health..."
HEALTH=$(curl -s http://localhost:5000/api/health 2>/dev/null)
if echo "$HEALTH" | grep -q '"status":"UP"'; then
    echo -e "${GREEN}✅ Backend API is healthy${NC}"
    echo "    Response: $HEALTH"
else
    echo -e "${RED}❌ Backend API is not responding${NC}"
fi

echo ""

# Check 4: CORS Configuration
echo -e "${YELLOW}[4/6]${NC} Checking CORS Configuration..."
if [ -f "backend/.env" ]; then
    CORS=$(grep "ALLOWED_ORIGINS" backend/.env)
    if echo "$CORS" | grep -q "localhost:3000"; then
        echo -e "${GREEN}✅ localhost:3000 is in ALLOWED_ORIGINS${NC}"
        echo "    $CORS"
    else
        echo -e "${RED}❌ localhost:3000 is NOT in ALLOWED_ORIGINS${NC}"
        echo "    Current: $CORS"
        echo "    Fix: Add http://localhost:3000 to ALLOWED_ORIGINS in backend/.env"
    fi
else
    echo -e "${RED}❌ backend/.env file not found${NC}"
fi

echo ""

# Check 5: Frontend Environment
echo -e "${YELLOW}[5/6]${NC} Checking Frontend Environment..."
if [ -f "frontend/.env.local" ]; then
    API_URL=$(grep "NEXT_PUBLIC_API_BASE_URL" frontend/.env.local)
    if echo "$API_URL" | grep -q "localhost:5000"; then
        echo -e "${GREEN}✅ Frontend is configured to use http://localhost:5000${NC}"
        echo "    $API_URL"
    else
        echo -e "${RED}❌ Frontend is NOT configured to use localhost:5000${NC}"
        echo "    Current: $API_URL"
    fi
else
    echo -e "${RED}❌ frontend/.env.local file not found${NC}"
    echo "    Create it with: NEXT_PUBLIC_API_BASE_URL=http://localhost:5000"
fi

echo ""

# Check 6: Database Connection
echo -e "${YELLOW}[6/6]${NC} Checking Database Connection..."
if [ -f "backend/.env" ]; then
    if grep -q "DATABASE_URL" backend/.env; then
        echo -e "${GREEN}✅ DATABASE_URL is configured${NC}"
    else
        echo -e "${RED}❌ DATABASE_URL is NOT configured${NC}"
    fi
else
    echo -e "${RED}❌ backend/.env file not found${NC}"
fi

echo ""
echo "=================================================="
echo -e "${GREEN}✅ Verification Complete!${NC}"
echo ""
echo "Next Steps:"
echo "1. Start Backend: cd backend && npm run dev"
echo "2. Start Frontend: cd frontend && npm run dev"
echo "3. Open Browser: http://localhost:3000"
echo "4. Check browser console for any errors"
echo ""
