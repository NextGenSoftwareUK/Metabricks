#!/bin/bash

# 🛑 MetaBricks Stop Script
# This script stops all MetaBricks processes

echo "🛑 Stopping MetaBricks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}🔄 Killing process on port $port (PID: $pid)${NC}"
        kill -9 $pid
        return 0
    else
        echo -e "${BLUE}ℹ️ No process found on port $port${NC}"
        return 1
    fi
}

# Kill frontend and backend processes
echo -e "${BLUE}🧹 Cleaning up processes...${NC}"
kill_port 4200  # Frontend port
kill_port 3001  # Backend port

# Kill any remaining Node.js processes related to MetaBricks
echo -e "${BLUE}🧹 Cleaning up remaining Node.js processes...${NC}"
pkill -f "ng serve" 2>/dev/null || true
pkill -f "node server.js" 2>/dev/null || true
pkill -f "metabricks" 2>/dev/null || true

# Clean up log files
if [ -f "frontend.log" ]; then
    echo -e "${BLUE}🧹 Removing frontend.log${NC}"
    rm frontend.log
fi

if [ -f "backend.log" ]; then
    echo -e "${BLUE}🧹 Removing backend.log${NC}"
    rm backend.log
fi

echo -e "${GREEN}✅ MetaBricks stopped successfully${NC}"
