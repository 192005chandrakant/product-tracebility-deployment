const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('🔧 Setting up development proxy...');
  
  // FINAL APPROACH: Use Express middleware directly to handle API routes
  // This bypasses http-proxy-middleware path stripping issues
  app.use('/api', (req, res, next) => {
    console.log(`🔍 Direct middleware intercepted: ${req.method} ${req.originalUrl}`);
    console.log(`   Full URL: ${req.url}`);
    console.log(`   Target will be: http://localhost:5000${req.originalUrl}`);
    next();
  });

  // API proxy configuration - Using explicit context matching
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
      timeout: 10000,
      logLevel: 'debug',
      // CRITICAL: This tells the proxy to NOT strip the /api prefix
      pathRewrite: {
        '^/api/(.*)': '/api/$1'  // Explicitly preserve /api prefix
      },
      onError: (err, req, res) => {
        console.error('❌ API Proxy error:', err.message);
        console.error('   Original URL:', req.originalUrl);
        console.error('   Request URL:', req.url);
        res.status(500).json({ 
          error: 'Proxy error', 
          message: err.message,
          originalUrl: req.originalUrl,
          requestUrl: req.url
        });
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`🔄 API Proxy Request Details:`);
        console.log(`   Method: ${req.method}`);
        console.log(`   Original URL: ${req.originalUrl}`);
        console.log(`   Request URL: ${req.url}`);
        console.log(`   Proxy Path: ${proxyReq.path}`);
        console.log(`   Full Target: http://localhost:5000${proxyReq.path}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`✅ API Response: ${proxyRes.statusCode} for ${req.originalUrl}`);
      }
    })
  );

  // Test endpoint proxy
  app.use(
    '/test',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
      timeout: 10000,
      logLevel: 'silent',
      onProxyReq: (proxyReq, req, res) => {
        console.log(`🔄 Test Proxy: ${req.method} ${req.url} -> http://localhost:5000${req.url}`);
      }
    })
  );
  
  // Health endpoint proxy
  app.use(
    '/health',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
      timeout: 10000,
      logLevel: 'silent',
      onProxyReq: (proxyReq, req, res) => {
        console.log(`🔄 Health Proxy: ${req.method} ${req.url} -> http://localhost:5000${req.url}`);
      }
    })
  );

  console.log('✅ Direct middleware proxy setup complete:');
  console.log('   /api/* -> http://localhost:5000/api/* (explicit path preservation)');
  console.log('   /test -> http://localhost:5000/test');
  console.log('   /health -> http://localhost:5000/health');
};
