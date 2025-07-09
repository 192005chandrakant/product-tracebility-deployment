/**
 * API URL Configuration
 * 
 * This utility helps manage API URLs across environments
 * (development, staging, production)
 */

// Get base API URL from environment or use a default
const getAPIBaseURL = () => {
  // First priority: environment variable from .env
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Second priority: check if we're in production
  if (process.env.NODE_ENV === 'production') {
    // For Netlify deployment with Render backend
    return 'https://product-traceability-api.onrender.com';
  }
  
  // Fallback for development
  return 'http://localhost:5000';
};

// Helper to build full API URLs
export const buildAPIURL = (path) => {
  const baseURL = getAPIBaseURL();
  // Ensure path starts with a slash if not already
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseURL}${formattedPath}`;
};

// Helper to resolve file URLs that might be relative or absolute
export const resolveFileURL = (fileUrl) => {
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

export default {
  getBaseURL: getAPIBaseURL,
  buildURL: buildAPIURL,
  resolveFileURL: resolveFileURL
};

// Named exports for direct access
export { getAPIBaseURL, buildAPIURL, resolveFileURL };
