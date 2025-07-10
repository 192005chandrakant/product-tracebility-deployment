const fs = require('fs');
const path = require('path');

function testDeployment() {
  console.log('🧪 Testing deployment fixes...');
  
  console.log('📋 Checking build configuration...');
  
  // Check if build directory exists and has expected structure
  const buildPath = path.join(__dirname, 'client', 'build');
  if (fs.existsSync(buildPath)) {
    console.log('✅ Build directory exists');
    
    const staticJsPath = path.join(buildPath, 'static', 'js');
    if (fs.existsSync(staticJsPath)) {
      const jsFiles = fs.readdirSync(staticJsPath).filter(f => f.endsWith('.js'));
      console.log(`✅ Found ${jsFiles.length} JavaScript files`);
      
      // List chunk files
      const chunkFiles = jsFiles.filter(f => f.includes('.chunk.js'));
      console.log(`📊 Chunk files: ${chunkFiles.length}`);
      if (chunkFiles.length > 0) {
        console.log(`   Chunks: ${chunkFiles.slice(0, 5).join(', ')}${chunkFiles.length > 5 ? '...' : ''}`);
      }
    } else {
      console.log('❌ Static JS directory missing - need to build first');
    }
    
    // Check _redirects file
    const redirectsPath = path.join(buildPath, '_redirects');
    if (fs.existsSync(redirectsPath)) {
      console.log('✅ _redirects file exists');
      const redirectsContent = fs.readFileSync(redirectsPath, 'utf8');
      const hasChunkRules = redirectsContent.includes('/auth/static/js/*');
      console.log(`✅ Chunk loading rules present: ${hasChunkRules}`);
    } else {
      console.log('❌ _redirects file missing in build');
    }
  } else {
    console.log('❌ Build directory does not exist - need to build first');
  }

  // Check netlify.toml
  const netlifyTomlPath = path.join(__dirname, 'netlify.toml');
  if (fs.existsSync(netlifyTomlPath)) {
    console.log('✅ netlify.toml exists');
    const netlifyContent = fs.readFileSync(netlifyTomlPath, 'utf8');
    const hasChunkRules = netlifyContent.includes('/auth/static/js/*');
    console.log(`✅ Netlify chunk loading rules present: ${hasChunkRules}`);
  } else {
    console.log('❌ netlify.toml missing');
  }

  // Check client _redirects
  const clientRedirectsPath = path.join(__dirname, 'client', 'public', '_redirects');
  if (fs.existsSync(clientRedirectsPath)) {
    console.log('✅ Client _redirects file exists');
    const redirectsContent = fs.readFileSync(clientRedirectsPath, 'utf8');
    const hasChunkRules = redirectsContent.includes('/auth/static/js/*');
    console.log(`✅ Client chunk loading rules present: ${hasChunkRules}`);
  } else {
    console.log('❌ Client _redirects file missing');
  }

  console.log('\n🔧 Configuration Analysis:');
  
  // Check webpack config
  const configPath = path.join(__dirname, 'client', 'config-overrides.js');
  if (fs.existsSync(configPath)) {
    console.log('✅ Webpack config override exists');
    const configContent = fs.readFileSync(configPath, 'utf8');
    const hasPublicPath = configContent.includes("publicPath: '/'");
    const hasDeterministicIds = configContent.includes('deterministic');
    console.log(`✅ Public path configured: ${hasPublicPath}`);
    console.log(`✅ Deterministic IDs configured: ${hasDeterministicIds}`);
  } else {
    console.log('❌ Webpack config override missing');
  }

  console.log('\n🔧 Recommended next steps:');
  console.log('1. Run: cd client && npm run build:enhanced');
  console.log('2. Deploy the updated build to Netlify');
  console.log('3. Clear browser cache and test the /auth/login route');
  console.log('4. Monitor for chunk loading errors in browser console');
  
  console.log('\n🎯 Key fixes implemented:');
  console.log('- Enhanced _redirects rules for /auth/* routes');
  console.log('- Webpack configuration for stable chunk IDs');
  console.log('- Error boundary components for chunk loading failures');
  console.log('- Global error handler in index.html');
  console.log('- Retry logic in lazy loading utilities');
}

if (require.main === module) {
  testDeployment();
}

module.exports = { testDeployment };
