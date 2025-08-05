#!/bin/bash

echo "🚀 Preparing backend for Vercel deployment..."

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Build the backend first
echo "📦 Building backend..."
cd backend
npm install
npm run build
cd ..

# Create api/dist directory
echo "📁 Creating api/dist directory..."
rm -rf api/dist
mkdir -p api/dist

# Copy compiled backend files
echo "📋 Copying backend distribution files..."
cp -r backend/dist/* api/dist/

# Copy backend package.json dependencies to api/package.json
echo "📝 Updating api/package.json with backend dependencies..."
node -e "
const backendPkg = require('./backend/package.json');
const apiPkg = require('./api/package.json');

// Merge dependencies
apiPkg.dependencies = {
  ...apiPkg.dependencies,
  ...backendPkg.dependencies
};

// Write updated package.json
require('fs').writeFileSync('./api/package.json', JSON.stringify(apiPkg, null, 2));
console.log('✅ Updated api/package.json');
"

# Install dependencies in api folder
echo "📦 Installing API dependencies..."
cd api
npm install
cd ..

echo "✅ API preparation complete!"