console.log('🚀 DEPLOYMENT DIAGNOSIS SCRIPT\n');

const fs = require('fs');
const path = require('path');

function checkBuildFolder() {
  const buildPath = path.join(__dirname, 'client', 'build');
  
  console.log('1️⃣ Checking build folder...');
  console.log(`   Build path: ${buildPath}`);
  
  if (!fs.existsSync(buildPath)) {
    console.log('❌ Build folder does not exist!');
    console.log('💡 Solution: Run "npm run build" in client folder');
    return false;
  }
  
  console.log('✅ Build folder exists');
  
  // Check static folder
  const staticPath = path.join(buildPath, 'static');
  if (!fs.existsSync(staticPath)) {
    console.log('❌ Static folder missing in build');
    return false;
  }
  
  console.log('✅ Static folder exists');
  
  // Check JS files
  const jsPath = path.join(staticPath, 'js');
  if (fs.existsSync(jsPath)) {
    const jsFiles = fs.readdirSync(jsPath).filter(f => f.endsWith('.js'));
    console.log(`✅ JS files found: ${jsFiles.length}`);
    jsFiles.forEach(file => console.log(`   - ${file}`));
  } else {
    console.log('❌ JS folder missing');
  }
  
  // Check CSS files
  const cssPath = path.join(staticPath, 'css');
  if (fs.existsSync(cssPath)) {
    const cssFiles = fs.readdirSync(cssPath).filter(f => f.endsWith('.css'));
    console.log(`✅ CSS files found: ${cssFiles.length}`);
    cssFiles.forEach(file => console.log(`   - ${file}`));
  } else {
    console.log('❌ CSS folder missing');
  }
  
  // Check index.html
  const indexPath = path.join(buildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    console.log('✅ index.html exists');
    
    // Check if index.html references the correct files
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const jsRefs = indexContent.match(/\/static\/js\/[^"]+\.js/g) || [];
    const cssRefs = indexContent.match(/\/static\/css\/[^"]+\.css/g) || [];
    
    console.log(`✅ JS references in index.html: ${jsRefs.length}`);
    jsRefs.forEach(ref => console.log(`   - ${ref}`));
    
    console.log(`✅ CSS references in index.html: ${cssRefs.length}`);
    cssRefs.forEach(ref => console.log(`   - ${ref}`));
  } else {
    console.log('❌ index.html missing');
  }
  
  return true;
}

function checkPackageJson() {
  console.log('\n2️⃣ Checking package.json configuration...');
  
  const packagePath = path.join(__dirname, 'client', 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json not found');
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  console.log(`✅ Homepage: ${packageJson.homepage || 'Not set'}`);
  console.log(`✅ Build script: ${packageJson.scripts?.build || 'Not found'}`);
  
  if (packageJson.homepage && packageJson.homepage.includes('blockchain-product-traceability.netlify.app')) {
    console.log('⚠️  Homepage points to Netlify - this might cause path issues');
    console.log('💡 Consider setting homepage to "/" for relative paths');
  }
}

function checkNetlifyConfig() {
  console.log('\n3️⃣ Checking Netlify configuration...');
  
  const netlifyPath = path.join(__dirname, 'netlify.toml');
  if (!fs.existsSync(netlifyPath)) {
    console.log('❌ netlify.toml not found');
    return;
  }
  
  const netlifyContent = fs.readFileSync(netlifyPath, 'utf8');
  
  console.log('✅ netlify.toml exists');
  console.log(`✅ Base directory: ${netlifyContent.includes('base = "client"') ? 'client' : 'NOT SET'}`);
  console.log(`✅ Publish directory: ${netlifyContent.includes('publish = "build"') ? 'build' : 'NOT SET'}`);
  console.log(`✅ Static redirects: ${netlifyContent.includes('/static/js/*') ? 'Configured' : 'Missing'}`);
}

function provideSolutions() {
  console.log('\n🛠️  SOLUTIONS FOR 404 ERRORS:');
  console.log('');
  console.log('1. Clean Build:');
  console.log('   cd client');
  console.log('   npm run clean');
  console.log('   npm install --legacy-peer-deps');
  console.log('   npm run build');
  console.log('');
  console.log('2. Check Build Output:');
  console.log('   Ensure build/static/js/ and build/static/css/ have files');
  console.log('');
  console.log('3. Deploy to Netlify:');
  console.log('   - Drag & drop the client/build folder to Netlify');
  console.log('   - OR commit changes and let auto-deploy run');
  console.log('');
  console.log('4. Environment Variables (in Netlify dashboard):');
  console.log('   REACT_APP_API_URL = https://product-traceability-api.onrender.com');
  console.log('   NODE_VERSION = 18');
  console.log('   CI = false');
  console.log('');
  console.log('5. If still getting 404s:');
  console.log('   - Check Netlify deploy logs for build errors');
  console.log('   - Verify all files are in the build output');
  console.log('   - Check browser Network tab for actual file requests');
}

// Run diagnostics
console.log('🔍 RUNNING DEPLOYMENT DIAGNOSTICS...\n');

const buildExists = checkBuildFolder();
checkPackageJson();
checkNetlifyConfig();
provideSolutions();

if (!buildExists) {
  console.log('\n🚨 URGENT: Build folder missing!');
  console.log('Run this to fix:');
  console.log('cd client && npm run build');
}
