#!/bin/bash

# MetaBricks Environment Switcher
# Easily switch between development and production environments

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

# Show current environment
show_current_env() {
    if [ -f ".env" ]; then
        CURRENT_ENV=$(grep "METABRICKS_ENV" .env | cut -d'=' -f2)
        if [ -z "$CURRENT_ENV" ]; then
            CURRENT_ENV="development"
        fi
    else
        CURRENT_ENV="development"
    fi
    
    echo "Current Environment: $CURRENT_ENV"
}

# Switch to development
switch_to_dev() {
    print_status "Switching to Development Environment..."
    
    # Create .env file for development
    cat > .env << EOF
NODE_ENV=development
METABRICKS_ENV=development
OASIS_API_URL=http://oasisweb4.one
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=
EOF
    
    print_success "Switched to Development Environment"
    print_status "Backend: http://localhost:3001"
    print_status "Frontend: http://localhost:4200"
    print_status "Network: Devnet"
}

# Switch to production
switch_to_prod() {
    print_status "Switching to Production Environment..."
    
    # Create .env file for production
    cat > .env << EOF
NODE_ENV=production
METABRICKS_ENV=production
OASIS_API_URL=http://oasisweb4.one
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=
EOF
    
    print_success "Switched to Production Environment"
    print_status "Backend: https://metabricks-backend-api-v2-42ff9579046d.herokuapp.com"
    print_status "Frontend: https://metabricks.xyz"
    print_status "Network: Mainnet"
}

# Show help
show_help() {
    echo "MetaBricks Environment Switcher"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev     Switch to development environment"
    echo "  prod    Switch to production environment"
    echo "  status  Show current environment"
    echo "  help    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev      # Switch to development"
    echo "  $0 prod     # Switch to production"
    echo "  $0 status   # Show current environment"
}

# Main script logic
case "$1" in
    "dev")
        switch_to_dev
        ;;
    "prod")
        switch_to_prod
        ;;
    "status")
        show_current_env
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    "")
        show_current_env
        echo ""
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
