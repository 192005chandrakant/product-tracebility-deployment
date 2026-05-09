#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n🔍 DEPLOYMENT 404 FIX VALIDATION\n');
console.log('=' .repeat(60));

let allPassed = true;

// Check 1: Client build exists
console.log('\n✓ Check 1: Client Build');
const buildPath = path.join(__dirname, 'client', 'build');
const indexPath = path.join(buildPath, 'index.html');

if (fs.existsSync(indexPath)) {
  console.log('  ✅ client/build/index.html exists');
} else {
  console.log('  ❌ client/build/index.html MISSING');
  console.log('     Run: npm --prefix client run build');
  allPassed = false;
}

// Check 2: Verify vercel.json has buildCommand
console.log('\n✓ Check 2: Vercel Configuration');
const vercelPath = path.join(__dirname, 'vercel.json');
if (fs.existsSync(vercelPath)) {
  const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
  if (vercelConfig.buildCommand && vercelConfig.buildCommand.includes('npm run build')) {
    console.log('  ✅ vercel.json has buildCommand');
  } else {
    console.log('  ❌ vercel.json missing proper buildCommand');
    allPassed = false;
  }
  
  if (vercelConfig.routes && vercelConfig.routes.length > 0) {
    console.log('  ✅ vercel.json has routes configured');
  } else {
    console.log('  ⚠️  vercel.json missing routes (not critical)');
  }
} else {
  console.log('  ❌ vercel.json not found');
  allPassed = false;
}

// Check 3: Server configuration
console.log('\n✓ Check 3: Server Configuration');
const serverPath = path.join(__dirname, 'server', 'index.js');
if (fs.existsSync(serverPath)) {
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  
  if (serverContent.includes('express.static(CLIENT_BUILD_PATH)')) {
    console.log('  ✅ Static file serving configured');
  } else {
    console.log('  ❌ Static file serving NOT configured');
    allPassed = false;
  }
  
  if (serverContent.includes('SPA Fallback')) {
    console.log('  ✅ SPA fallback middleware configured');
  } else {
    console.log('  ❌ SPA fallback middleware MISSING');
    console.log('     This will cause 404 errors for React routes');
    allPassed = false;
  }
  
  if (serverContent.includes("if (req.path.startsWith('/api'))")) {
    console.log('  ✅ API route detection configured');
  } else {
    console.log('  ⚠️  API route detection may be missing');
  }
} else {
  console.log('  ❌ server/index.js not found');
  allPassed = false;
}

// Check 4: Package.json build scripts
console.log('\n✓ Check 4: Build Scripts');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (pkg.scripts && pkg.scripts.build) {
    console.log('  ✅ Root build script exists');
  } else {
    console.log('  ⚠️  Root build script missing (not critical)');
  }
  
  if (pkg.scripts && pkg.scripts['build:frontend']) {
    console.log('  ✅ Frontend build script exists');
  } else {
    console.log('  ⚠️  Frontend build script missing');
  }
}

// Check 5: Client package.json has build command
console.log('\n✓ Check 5: Client Build Configuration');
const clientPkgPath = path.join(__dirname, 'client', 'package.json');
if (fs.existsSync(clientPkgPath)) {
  const clientPkg = JSON.parse(fs.readFileSync(clientPkgPath, 'utf8'));
  
  if (clientPkg.scripts && clientPkg.scripts.build) {
    console.log('  ✅ Client build script configured');
  } else {
    console.log('  ❌ Client build script missing');
    allPassed = false;
  }
  
  if (clientPkg.scripts && clientPkg.scripts['build:prod']) {
    console.log('  ✅ Production build script configured');
  } else {
    console.log('  ⚠️  Production build script missing');
  }
}

// Summary
console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('\n✅ All critical checks passed!\n');
  console.log('Next steps:');
  console.log('  1. Build locally: npm --prefix client run build');
  console.log('  2. Start server: npm --prefix server start');
  console.log('  3. Test at: http://localhost:8080');
  console.log('  4. Push to deployment: git push origin main');
} else {
  console.log('\n⚠️  Some checks failed. Please fix the issues above.');
}
console.log('\nFor detailed info, see: DEPLOYMENT_404_FIX.md\n');
