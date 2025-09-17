#!/bin/bash

echo "🚀 Deploying MetaBricks to Surge"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the Angular application
echo "🔨 Building Angular application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Build files are in the 'dist/meta-bricks' directory"
else
    echo "❌ Build failed!"
    exit 1
fi

# Deploy to Surge
echo "🌐 Deploying to Surge..."
surge dist/meta-bricks wooden-seashore.surge.sh

echo "✅ Deployment complete!"
echo "🌍 Your site is available at: https://wooden-seashore.surge.sh"
echo ""
echo "📋 Frontend is now connected to the production backend at:"
echo "   https://metabricks-backend-api-66e7d2abb038.herokuapp.com"

