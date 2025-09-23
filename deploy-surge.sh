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

# Create _headers file for proper caching
cat > dist/meta-bricks/_headers << EOF
# Surge Headers Configuration
# Proper caching for static assets and SPA routing

# Cache static assets (JS, CSS, images) for 1 year
/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable

/assets/*
  Cache-Control: public, max-age=31536000, immutable

# Cache HTML files for 1 hour (allows updates but prevents excessive requests)
/*.html
  Cache-Control: public, max-age=3600

# Cache favicon for 1 week
/favicon.ico
  Cache-Control: public, max-age=604800

# Security headers
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
EOF
echo "✅ Created _headers file"

# Deploy to Surge
echo "🌐 Deploying to Surge..."
surge dist/meta-bricks metabricks.xyz

echo "✅ Deployment complete!"
echo "🌍 Your site is available at: https://metabricks.xyz"
echo ""
echo "📋 Frontend is now connected to the production backend at:"
echo "   https://metabricks-backend-api-66e7d2abb038.herokuapp.com"

