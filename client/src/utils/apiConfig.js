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

// Export functions
export {
  getAPIBaseURL,
  buildAPIURL,
  apiRequest
};
