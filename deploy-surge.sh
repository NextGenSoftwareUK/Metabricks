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

# Create SPA configuration for Surge
echo "📝 Creating SPA configuration..."
# Ensure 200.html exists (fallback for SPA routing)
if [ ! -f "dist/meta-bricks/200.html" ]; then
    cp dist/meta-bricks/index.html dist/meta-bricks/200.html
    echo "✅ Created 200.html fallback file"
fi

# Create _redirects file for additional routing support
cat > dist/meta-bricks/_redirects << EOF
# Surge SPA Configuration
# Redirect all routes to index.html for Angular SPA routing
/*    /index.html   200
EOF
echo "✅ Created _redirects file"

# Deploy to Surge
echo "🌐 Deploying to Surge..."
surge dist/meta-bricks metabricks.xyz

echo "✅ Deployment complete!"
echo "🌍 Your site is available at: https://metabricks.xyz"
echo ""
echo "📋 Frontend is now connected to the production backend at:"
echo "   https://metabricks-backend-api-66e7d2abb038.herokuapp.com"

