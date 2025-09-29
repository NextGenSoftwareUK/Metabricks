#!/bin/bash

# MetaBricks Development Stop Script
# Stops all development processes

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

print_status "Stopping MetaBricks Development Environment..."

# Stop backend
if [ -f "logs/backend-dev.pid" ]; then
    BACKEND_PID=$(cat logs/backend-dev.pid)
    if ps -p $BACKEND_PID > /dev/null; then
        print_status "Stopping backend server (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        print_success "Backend server stopped"
    else
        print_warning "Backend server was not running"
    fi
    rm -f logs/backend-dev.pid
else
    print_warning "No backend PID file found"
fi

# Stop frontend
if [ -f "logs/frontend-dev.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend-dev.pid)
    if ps -p $FRONTEND_PID > /dev/null; then
        print_status "Stopping frontend server (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        print_success "Frontend server stopped"
    else
        print_warning "Frontend server was not running"
    fi
    rm -f logs/frontend-dev.pid
else
    print_warning "No frontend PID file found"
fi

# Kill any remaining Node.js processes
print_status "Cleaning up any remaining Node.js processes..."
pkill -f "node server.js" || true
pkill -f "ng serve" || true
pkill -f "npm start" || true

print_success "MetaBricks Development Environment stopped!"
