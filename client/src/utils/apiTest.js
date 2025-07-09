// API Test Script
// This script tests the /api/recent-products endpoint

const testRecentProductsEndpoint = async () => {
  try {
    console.log('Testing /api/recent-products endpoint...');
    // Import the API config utility
    const apiConfig = await import('./apiConfig');
    const apiUrl = apiConfig.buildAPIURL('/api/recent-products?limit=6');
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Recent products endpoint is working!');
    console.log(`Retrieved ${data.length} products`);
    console.log('Sample product:', data[0]);
    
    return { success: true, data };
  } catch (error) {
    console.error('API Test Failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Execute the test when the script loads
testRecentProductsEndpoint();

// Export the test function for programmatic use
export { testRecentProductsEndpoint };
