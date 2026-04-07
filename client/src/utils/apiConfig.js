/**
 * API URL Configuration
 * 
 * This utility manages API URLs across environments.
 * Frontend calls backend directly in both development and production.
 */

// Detect current environment and setup
const isProduction = process.env.NODE_ENV === 'production';
const isDebug = process.env.REACT_APP_DEBUG_API === 'true' || process.env.REACT_APP_DEBUG === 'true';

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
    return process.env.REACT_APP_API_URL;
  }

  // Development fallback
  if (!isProduction) {
    return LOCAL_API_URL;
  }

  // Production or non-localhost development
  return PRODUCTION_API_URL;
};

// Build API URLs with environment awareness
const buildAPIURL = (path) => {
  const baseURL = getAPIBaseURL();
  const formattedPath = path.startsWith('/') ? path : `/${path}`;

  // Always direct URL
  const fullURL = `${baseURL}${formattedPath}`;
  if (isDebug) {
    console.log(`🔧 API URL: ${fullURL}`);
  }
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
    if (isDebug) {
      console.log(`🌐 API request: ${url}`);
    }
    
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
        errorData = { message: `${response.status} ${response.statusText}` };
      }
      
      if (isDebug) {
        console.error(`❌ API request failed: ${response.status} ${response.statusText}`, errorData);
      }
      throw new Error(
        (errorData && (errorData.message || errorData.error)) ||
        `API Error: ${response.status} ${response.statusText}`
      );
    }
    
    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (isDebug) {
        console.log('✅ API request successful');
      }
      return data;
    } else {
      if (isDebug) {
        console.log('✅ API request successful (no JSON response)');
      }
      return { success: true };
    }
  } catch (error) {
    if (isDebug) {
      console.error(`❌ API request error for ${endpoint}:`, error.message);
    }
    
    // Retry logic for specific errors
    if (retryCount > 0 && (
      error.name === 'AbortError' || 
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network request failed')
    )) {
      if (isDebug) {
        console.log(`🔄 Retrying API request to ${endpoint}, attempts left: ${retryCount}`);
      }
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
