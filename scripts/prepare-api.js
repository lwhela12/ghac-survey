const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Preparing backend for Vercel deployment...');

// Helper to copy directory recursively
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  // Build the backend
  console.log('📦 Building backend...');
  execSync('cd backend && npm install && npm run build', { stdio: 'inherit' });
  
  // Create api/dist directory
  console.log('📁 Creating api/dist directory...');
  const apiDistPath = path.join(__dirname, '..', 'api', 'dist');
  if (fs.existsSync(apiDistPath)) {
    fs.rmSync(apiDistPath, { recursive: true, force: true });
  }
  fs.mkdirSync(apiDistPath, { recursive: true });
  
  // Copy compiled backend files
  console.log('📋 Copying backend distribution files...');
  const backendDistPath = path.join(__dirname, '..', 'backend', 'dist');
  copyDir(backendDistPath, apiDistPath);
  
  // Update api/package.json with backend dependencies
  console.log('📝 Updating api/package.json with backend dependencies...');
  const backendPkgPath = path.join(__dirname, '..', 'backend', 'package.json');
  const apiPkgPath = path.join(__dirname, '..', 'api', 'package.json');
  
  const backendPkg = JSON.parse(fs.readFileSync(backendPkgPath, 'utf8'));
  const apiPkg = JSON.parse(fs.readFileSync(apiPkgPath, 'utf8'));
  
  // Merge dependencies
  apiPkg.dependencies = {
    ...apiPkg.dependencies,
    ...backendPkg.dependencies
  };
  
  // Write updated package.json
  fs.writeFileSync(apiPkgPath, JSON.stringify(apiPkg, null, 2));
  console.log('✅ Updated api/package.json');
  
  // Install dependencies in api folder
  console.log('📦 Installing API dependencies...');
  execSync('cd api && npm install', { stdio: 'inherit' });
  
  console.log('✅ API preparation complete!');
} catch (error) {
  console.error('❌ Error preparing API:', error.message);
  process.exit(1);
}