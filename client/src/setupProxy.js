const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('🔧 Setting up development proxy...');
  
  // MANUAL PROXY: Complete bypass of http-proxy-middleware path issues
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`🔍 Manual proxy intercepted: ${req.method} ${req.path}`);
      console.log(`   Original URL: ${req.originalUrl}`);
      console.log(`   Will forward to: http://localhost:5000${req.originalUrl}`);
      
      // Use native Node.js HTTP to forward the request
      const http = require('http');
      
      // Collect request body for POST requests
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        const options = {
          hostname: 'localhost',
          port: 5000,
          path: req.originalUrl, // This preserves the full /api/auth/login path!
          method: req.method,
          headers: {
            ...req.headers,
            host: 'localhost:5000',
            'accept-encoding': 'identity', // Disable compression to fix decoding issues
            'x-no-compression': 'true' // Tell server not to compress
          }
        };
        
        console.log(`🚀 Forwarding to: http://localhost:5000${options.path}`);
        
        const proxyReq = http.request(options, (proxyRes) => {
          console.log(`✅ Backend responded: ${proxyRes.statusCode} for ${req.originalUrl}`);
          
          // Forward status code
          res.status(proxyRes.statusCode);
          
          // Forward headers but exclude problematic ones
          Object.keys(proxyRes.headers).forEach(key => {
            const lowerKey = key.toLowerCase();
            // Skip content-encoding and transfer-encoding to avoid decoding issues
            if (!['content-encoding', 'transfer-encoding', 'content-length'].includes(lowerKey)) {
              res.set(key, proxyRes.headers[key]);
            }
          });
          
          // Set content type if not present
          if (!res.get('content-type')) {
            res.set('Content-Type', 'application/json');
          }
          
          // Forward response body
          let responseBody = '';
          proxyRes.on('data', chunk => {
            responseBody += chunk.toString();
          });
          
          proxyRes.on('end', () => {
            console.log(`📦 Response body length: ${responseBody.length} characters`);
            res.send(responseBody);
          });
        });
        
        proxyReq.on('error', (err) => {
          console.error(`❌ Proxy error: ${err.message}`);
          res.status(500).json({ 
            error: 'Proxy error', 
            message: err.message,
            originalUrl: req.originalUrl 
          });
        });
        
        // Send the body if it exists
        if (body) {
          console.log(`📤 Sending body: ${body.length} characters`);
          proxyReq.write(body);
        }
        
        proxyReq.end();
      });
      
      return; // Don't call next() - we handled the request
    }
    
    // Handle /test endpoint
    if (req.path === '/test') {
      console.log(`🔍 Test endpoint intercepted: ${req.method} ${req.path}`);
      const http = require('http');
      
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/test',
        method: req.method,
        headers: { 
          ...req.headers, 
          host: 'localhost:5000',
          'accept-encoding': 'identity',
          'x-no-compression': 'true'
        }
      };
      
      const proxyReq = http.request(options, (proxyRes) => {
        res.status(proxyRes.statusCode);
        
        // Forward headers but exclude problematic ones
        Object.keys(proxyRes.headers).forEach(key => {
          const lowerKey = key.toLowerCase();
          if (!['content-encoding', 'transfer-encoding', 'content-length'].includes(lowerKey)) {
            res.set(key, proxyRes.headers[key]);
          }
        });
        
        // Stream the response directly
        proxyRes.pipe(res);
      });
      
      proxyReq.on('error', (err) => {
        res.status(500).json({ error: 'Proxy error', message: err.message });
      });
      
      req.pipe(proxyReq);
      return;
    }
    
    next();
  });

  console.log('✅ Manual proxy setup complete!');
  console.log('   /api/* -> http://localhost:5000/api/* (manual forwarding)');
  console.log('   /test -> http://localhost:5000/test');
  console.log('   Compression disabled to fix content decoding issues');
};
