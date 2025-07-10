/**
 * Enhanced API Configuration with Connection Testing
 * This utility manages API connections and validates backend connectivity
 */

// API Configuration
const API_CONFIG = {
  PRODUCTION_URL: 'https://product-traceability-api.onrender.com',
  DEVELOPMENT_URL: 'http://localhost:5000',
  TIMEOUT: 15000, // 15 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
};

// Get base API URL with enhanced logic
const getAPIBaseURL = () => {
  // Priority 1: Environment variable
  if (process.env.REACT_APP_API_URL) {
    console.log('🔗 Using API URL from environment:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  // Priority 2: Production check
  if (process.env.NODE_ENV === 'production') {
    console.log('🔗 Using production API URL:', API_CONFIG.PRODUCTION_URL);
    return API_CONFIG.PRODUCTION_URL;
  }
  
  // Priority 3: Development fallback
  console.log('🔗 Using development API URL:', API_CONFIG.DEVELOPMENT_URL);
  return API_CONFIG.DEVELOPMENT_URL;
};

// Enhanced URL builder with validation
const buildAPIURL = (path) => {
  const baseURL = getAPIBaseURL();
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  const fullURL = `${baseURL}${formattedPath}`;
  
  console.log(`🌐 Building API URL: ${fullURL}`);
  return fullURL;
};

// Test API connectivity
const testAPIConnection = async () => {
  const baseURL = getAPIBaseURL();
  
  console.log('🧪 Testing API connection to:', baseURL);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    
    const response = await fetch(`${baseURL}/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API connection successful:', data);
      return { success: true, data };
    } else {
      console.error('❌ API connection failed:', response.status, response.statusText);
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ API connection timeout');
      return { success: false, error: 'Connection timeout' };
    }
    console.error('❌ API connection error:', error.message);
    return { success: false, error: error.message };
  }
};

// Enhanced fetch with retry logic
const apiRequest = async (url, options = {}) => {
  const fullURL = url.startsWith('http') ? url : buildAPIURL(url);
  
  // Default options
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    timeout: API_CONFIG.TIMEOUT,
    ...options
  };
  
  for (let attempt = 1; attempt <= API_CONFIG.RETRY_ATTEMPTS; attempt++) {
    try {
      console.log(`🔄 API Request attempt ${attempt}/${API_CONFIG.RETRY_ATTEMPTS}: ${fullURL}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), defaultOptions.timeout);
      
      const response = await fetch(fullURL, {
        ...defaultOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // If successful, return response
      if (response.ok) {
        console.log(`✅ API Request successful: ${fullURL}`);
        return response;
      }
      
      // If it's a client error (4xx), don't retry
      if (response.status >= 400 && response.status < 500) {
        console.error(`❌ Client error ${response.status}, not retrying: ${fullURL}`);
        return response;
      }
      
      // For server errors (5xx), log and potentially retry
      console.warn(`⚠️ Server error ${response.status}, attempt ${attempt}/${API_CONFIG.RETRY_ATTEMPTS}: ${fullURL}`);
      
      if (attempt === API_CONFIG.RETRY_ATTEMPTS) {
        return response;
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`❌ Request timeout, attempt ${attempt}/${API_CONFIG.RETRY_ATTEMPTS}: ${fullURL}`);
      } else {
        console.error(`❌ Request failed, attempt ${attempt}/${API_CONFIG.RETRY_ATTEMPTS}: ${fullURL}`, error.message);
      }
      
      if (attempt === API_CONFIG.RETRY_ATTEMPTS) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * attempt));
    }
  }
};

// Helper to resolve file URLs
const resolveFileURL = (fileUrl) => {
  if (!fileUrl) return '';
  
  // Already an absolute URL
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

// API health check
const healthCheck = async () => {
  try {
    const result = await testAPIConnection();
    
    if (result.success) {
      // Test authentication endpoint
      const authTest = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com', password: 'wrongpassword' })
      });
      
      const authWorking = authTest.status === 400 || authTest.status === 401;
      
      return {
        success: true,
        backend: true,
        authentication: authWorking,
        message: 'Backend connection healthy'
      };
    } else {
      return {
        success: false,
        backend: false,
        authentication: false,
        message: result.error
      };
    }
  } catch (error) {
    return {
      success: false,
      backend: false,
      authentication: false,
      message: error.message
    };
  }
};

// Export the enhanced API configuration
export default {
  getBaseURL: getAPIBaseURL,
  buildURL: buildAPIURL,
  resolveFileURL: resolveFileURL,
  testConnection: testAPIConnection,
  request: apiRequest,
  healthCheck: healthCheck,
  config: API_CONFIG
};

// Named exports for convenience
export { 
  getAPIBaseURL, 
  buildAPIURL, 
  resolveFileURL, 
  testAPIConnection, 
  apiRequest, 
  healthCheck,
  API_CONFIG
};
