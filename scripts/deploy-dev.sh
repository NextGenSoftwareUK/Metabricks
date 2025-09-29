#!/bin/bash

# MetaBricks Development Deployment Script
# Deploys to development environment with devnet configuration

set -e

echo "🚀 Starting MetaBricks Development Deployment..."

# Set environment variables
export NODE_ENV=development
export METABRICKS_ENV=development

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the MetaBricks root directory"
    exit 1
fi

print_status "Environment: Development"
print_status "Network: Devnet"
print_status "Backend: Local (localhost:3001)"
print_status "Frontend: Local (localhost:4200)"

# Start backend in development mode
print_status "Starting backend server..."
cd backend
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nohup node server.js > ../logs/backend-dev.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend-dev.pid
cd ..

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if ps -p $BACKEND_PID > /dev/null; then
    print_success "Backend started successfully (PID: $BACKEND_PID)"
else
    print_error "Failed to start backend server"
    exit 1
fi

# Start frontend in development mode
print_status "Starting frontend development server..."
nohup npm start > logs/frontend-dev.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > logs/frontend-dev.pid

# Wait a moment for frontend to start
sleep 5

# Check if frontend is running
if ps -p $FRONTEND_PID > /dev/null; then
    print_success "Frontend started successfully (PID: $FRONTEND_PID)"
else
    print_error "Failed to start frontend server"
    exit 1
fi

print_success "MetaBricks Development Environment is running!"
echo ""
echo "🌐 Frontend: http://localhost:4200"
echo "🔧 Backend: http://localhost:3001"
echo "📊 Backend Logs: tail -f logs/backend-dev.log"
echo "📊 Frontend Logs: tail -f logs/frontend-dev.log"
echo ""
echo "🛑 To stop: ./scripts/stop-dev.sh"
echo ""

# Open browser
if command -v open &> /dev/null; then
    open http://localhost:4200
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:4200
fi
