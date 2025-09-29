#!/bin/bash

# MetaBricks Production Deployment Script
# Deploys to production environment with mainnet configuration

set -e

echo "🚀 Starting MetaBricks Production Deployment..."

# Set environment variables
export NODE_ENV=production
export METABRICKS_ENV=production

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

print_status "Environment: Production"
print_status "Network: Mainnet"
print_status "Backend: Heroku"
print_status "Frontend: Surge (metabricks.xyz)"

# Deploy backend to Heroku
print_status "Deploying backend to Heroku..."
cd backend

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    print_error "Heroku CLI is not installed. Please install it first."
    exit 1
fi

# Check if we're logged into Heroku
if ! heroku auth:whoami &> /dev/null; then
    print_error "Please log in to Heroku first: heroku login"
    exit 1
fi

# Set Heroku environment variables
print_status "Setting Heroku environment variables..."
heroku config:set NODE_ENV=production
heroku config:set METABRICKS_ENV=production
heroku config:set OASIS_API_URL=http://oasisweb4.one

# Deploy to Heroku
print_status "Pushing to Heroku..."
git add .
git commit -m "Deploy to production - $(date)" || true
git push heroku main

cd ..

# Build frontend for production
print_status "Building frontend for production..."
npm run build

# Deploy frontend to Surge
print_status "Deploying frontend to Surge..."

# Check if Surge CLI is installed
if ! command -v surge &> /dev/null; then
    print_error "Surge CLI is not installed. Please install it first: npm install -g surge"
    exit 1
fi

# Deploy to both domains
print_status "Deploying to metabricks.surge.sh..."
surge dist/ metabricks.surge.sh

print_status "Deploying to metabricks.xyz..."
surge dist/ metabricks.xyz

print_success "MetaBricks Production Deployment Complete!"
echo ""
echo "🌐 Frontend: https://metabricks.xyz"
echo "🔧 Backend: https://metabricks-backend-api-v2-42ff9579046d.herokuapp.com"
echo "📊 Backend Logs: heroku logs --tail --app metabricks-backend-api-v2"
echo ""

# Open browser
if command -v open &> /dev/null; then
    open https://metabricks.xyz
elif command -v xdg-open &> /dev/null; then
    xdg-open https://metabricks.xyz
fi
