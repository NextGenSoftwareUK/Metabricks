#!/bin/bash

# MetaBricks Backend Startup Script

echo "🚀 Starting MetaBricks Backend..."

# Navigate to backend directory
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Start the backend server
echo "🌐 Starting backend server on port 3001..."
npm start
