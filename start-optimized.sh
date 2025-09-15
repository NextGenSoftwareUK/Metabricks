#!/bin/bash

# 🚀 MetaBricks Optimized Startup Script
# This script starts both frontend and backend with optimizations for faster startup

echo "🚀 Starting MetaBricks with optimizations..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}🔄 Killing existing process on port $port (PID: $pid)${NC}"
        kill -9 $pid
        sleep 1
    fi
}

# Clean up any existing processes
echo -e "${BLUE}🧹 Cleaning up existing processes...${NC}"
kill_port 3001  # Backend port
kill_port 4200  # Frontend port

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the MetaBricks root directory${NC}"
    exit 1
fi

# Install dependencies if needed (only for frontend)
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
    npm install --silent
fi

# Install backend dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
    cd backend
    npm install --silent
    cd ..
fi

# Start backend in background
echo -e "${GREEN}🌐 Starting backend server...${NC}"
cd backend
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo -e "${BLUE}⏳ Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend failed to start within 30 seconds${NC}"
        echo -e "${YELLOW}📋 Backend logs:${NC}"
        tail -20 backend.log
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

# Start frontend with optimizations
echo -e "${GREEN}🎨 Starting frontend with optimizations...${NC}"
npm run start:optimized > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to be ready
echo -e "${BLUE}⏳ Waiting for frontend to be ready...${NC}"
for i in {1..60}; do
    if curl -s http://localhost:4200 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is ready!${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "${RED}❌ Frontend failed to start within 60 seconds${NC}"
        echo -e "${YELLOW}📋 Frontend logs:${NC}"
        tail -20 frontend.log
        kill $FRONTEND_PID 2>/dev/null
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

echo ""
echo -e "${GREEN}🎉 MetaBricks is now running!${NC}"
echo -e "${BLUE}🌐 Frontend: http://localhost:4200${NC}"
echo -e "${BLUE}🔧 Backend: http://localhost:3001${NC}"
echo -e "${BLUE}❤️ Health: http://localhost:3001/health${NC}"
echo ""
echo -e "${YELLOW}💡 Tips for faster development:${NC}"
echo -e "   • Frontend uses Hot Module Replacement (HMR) for instant updates"
echo -e "   • Backend authentication is deferred for faster startup"
echo -e "   • Services initialize asynchronously to avoid blocking"
echo ""
echo -e "${YELLOW}🛑 To stop: Press Ctrl+C or run ./stop.sh${NC}"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down MetaBricks...${NC}"
    kill $FRONTEND_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    echo -e "${GREEN}✅ MetaBricks stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running
wait
