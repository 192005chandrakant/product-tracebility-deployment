/**
 * API URL Configuration
 * 
 * This utility manages API URLs across environments with smart detection
 * for development (localhost with proxy) and production (direct API calls)
 */

// Detect current environment and setup
const isDevelopment = process.env.NODE_ENV === 'development';
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isProduction = process.env.NODE_ENV === 'production';

// Production URLs
const PRODUCTION_API_URL = 'https://product-traceability-api.onrender.com';
const PRODUCTION_FRONTEND_URL = 'https://blockchain-product-traceability.netlify.app';

// Local development URLs
const LOCAL_API_URL = 'http://localhost:5000';
const LOCAL_FRONTEND_URL = 'http://localhost:3000';

// Get base API URL with smart environment detection
const getAPIBaseURL = () => {
  // Explicit environment variable override
  if (process.env.REACT_APP_API_URL) {
    console.log('🔧 Using API URL from environment:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  // Development mode on localhost - use proxy (empty string)
  if (isDevelopment && isLocalhost) {
    console.log('🔧 Development mode - using proxy for local API (no CORS)');
    return ''; // Empty string uses proxy via setupProxy.js
  }
  
  // Production or non-localhost development
  console.log('🔧 Production mode - using direct API URL');
  return PRODUCTION_API_URL;
};

// Build API URLs with environment awareness
const buildAPIURL = (path) => {
  const baseURL = getAPIBaseURL();
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  
  // In development with proxy, use relative URLs
  if (!baseURL && isDevelopment && isLocalhost) {
    console.log(`🔧 Building proxied URL: ${formattedPath}`);
    return formattedPath;
  }
  
  // For production or explicit base URL
  const fullURL = `${baseURL}${formattedPath}`;
  console.log(`🔧 Building direct URL: ${fullURL}`);
  return fullURL;
};

// Helper to resolve file URLs that might be relative or absolute
const resolveFileURL = (fileUrl) => {
  if (!fileUrl) return '';
  
  // Already an absolute URL (starts with http/https)
  if (fileUrl.startsWith('http')) {
    return fileUrl;
  }
  
  // For local files that start with /uploads
  if (fileUrl.startsWith('/uploads')) {
    return `${getAPIBaseURL()}${fileUrl}`;
  }
  
  // Return as-is for other cases (like data URLs)
  return fileUrl;
};

// Enhanced fetch wrapper with better error handling and retry capability
const apiRequest = async (endpoint, options = {}, retryCount = 2) => {
  const url = buildAPIURL(endpoint);
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    },
    credentials: 'include', // Important for CORS
    mode: 'cors', // Explicitly set CORS mode
    ...options
  };

  // Add authorization header if token exists
  const token = localStorage.getItem('token');
  if (token && !defaultOptions.headers['Authorization']) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    console.log(`🌐 Making API request to: ${url}`);
    
    // Set timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(url, {
      ...defaultOptions,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: `${response.status} ${response.statusText}` };
      }
      
      console.error(`❌ API request failed: ${response.status} ${response.statusText}`, errorData);
      throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
    }
    
    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log(`✅ API request successful:`, data);
      return data;
    } else {
      console.log(`✅ API request successful (no JSON response)`);
      return { success: true };
    }
  } catch (error) {
    console.error(`❌ API request error for ${endpoint}:`, error.message);
    
    // Retry logic for specific errors
    if (retryCount > 0 && (
      error.name === 'AbortError' || 
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network request failed')
    )) {
      console.log(`🔄 Retrying API request to ${endpoint}, attempts left: ${retryCount}`);
      // Exponential backoff - wait longer between retries
      await new Promise(r => setTimeout(r, (3 - retryCount) * 1000));
      return apiRequest(endpoint, options, retryCount - 1);
    }
    
    throw error;
  }
};

// Enhanced API connection test with environment-aware logic
const testApiConnection = async () => {
  const baseURL = getAPIBaseURL();
  const isUsingProxy = !baseURL && isDevelopment && isLocalhost;
  
  console.log(`🔌 Testing API connection...`);
  console.log(`   Environment: ${isDevelopment ? 'development' : 'production'}`);
  console.log(`   Location: ${isLocalhost ? 'localhost' : 'remote'}`);
  console.log(`   Using proxy: ${isUsingProxy ? 'yes' : 'no'}`);
  console.log(`   Target: ${isUsingProxy ? 'http://localhost:5000 (via proxy)' : baseURL}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    let testEndpoint;
    let requestOptions;
    
    if (isUsingProxy) {
      // Development with proxy - test local endpoints
      testEndpoint = '/test'; // Will be proxied to localhost:5000/test
      requestOptions = {
        method: 'GET',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      };
    } else {
      // Production or direct API calls
      testEndpoint = buildAPIURL('/api/health');
      requestOptions = {
        method: 'GET',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        credentials: 'include',
        signal: controller.signal
      };
    }
    
    console.log(`   Testing endpoint: ${testEndpoint}`);
    
    const response = await fetch(testEndpoint, requestOptions);
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json().catch(() => ({ status: 'ok' }));
      console.log('✅ API connection successful!');
      console.log(`   Response status: ${response.status}`);
      return { 
        success: true, 
        baseURL: isUsingProxy ? 'localhost:5000 (proxied)' : baseURL,
        data 
      };
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
  } catch (error) {
    console.error('❌ API connection test failed:', error.message);
    
    // Handle specific error types
    if (error.name === 'AbortError') {
      return { success: false, error: 'Connection timeout', timeout: true };
    }
    
    if (error.message.includes('CORS')) {
      console.log('ℹ️ CORS error detected - this might indicate proxy configuration issues');
      return { success: false, error: 'CORS policy violation', cors: true };
    }
    
    if (error.message.includes('429')) {
      console.log('⚠️ Rate limiting detected - API is temporarily unavailable');
      return { success: false, error: 'Rate limited', rateLimit: true };
    }
    
    // For development, try fallback to production API if proxy fails
    if (isUsingProxy && !error.message.includes('CORS')) {
      console.log('🔄 Proxy failed, testing direct production API...');
      try {
        const fallbackResponse = await fetch(`${PRODUCTION_API_URL}/api/health`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          mode: 'cors',
          signal: new AbortController().signal
        });
        
        if (fallbackResponse.ok) {
          console.log('✅ Fallback to production API successful');
          return { 
            success: true, 
            fallback: true, 
            baseURL: PRODUCTION_API_URL,
            message: 'Using production API as fallback'
          };
        }
      } catch (fallbackError) {
        console.log('❌ Production API fallback also failed:', fallbackError.message);
      }
    }
    
    return { success: false, error: error.message };
  }
};

// Export functions
export {
  getAPIBaseURL,
  buildAPIURL,
  apiRequest,
  testApiConnection
};
