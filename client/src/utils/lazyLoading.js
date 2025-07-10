import { lazy, Suspense } from 'react';

// Enhanced lazy loading with error boundaries and retry logic
const createLazyComponent = (importFunc, componentName) => {
  return lazy(async () => {
    try {
      const module = await importFunc();
      return module;
    } catch (error) {
      console.error(`Failed to load ${componentName}:`, error);
      
      // Retry once after a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        const module = await importFunc();
        console.log(`✅ Retry successful for ${componentName}`);
        return module;
      } catch (retryError) {
        console.error(`Retry failed for ${componentName}:`, retryError);
        
        // Return a fallback component
        return {
          default: () => (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800">
              <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                  Component Failed to Load
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {componentName} could not be loaded. Please refresh the page.
                </p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          )
        };
      }
    }
  });
};

// Lazy load components with enhanced error handling
export const LazyHome = createLazyComponent(() => import('../pages/Home'), 'Home');
export const LazyAuthLogin = createLazyComponent(() => import('../pages/AuthLogin'), 'AuthLogin');
export const LazyAuthRegister = createLazyComponent(() => import('../pages/AuthRegister'), 'AuthRegister');
export const LazyQRScan = createLazyComponent(() => import('../pages/QRScan'), 'QRScan');
export const LazyProductDetail = createLazyComponent(() => import('../pages/ProductDetail'), 'ProductDetail');
export const LazyAdminDashboard = createLazyComponent(() => import('../pages/AdminDashboard'), 'AdminDashboard');
export const LazyAddProduct = createLazyComponent(() => import('../pages/AddProduct'), 'AddProduct');
export const LazyUpdateProduct = createLazyComponent(() => import('../pages/UpdateProduct'), 'UpdateProduct');
export const LazyLanding = createLazyComponent(() => import('../pages/Landing'), 'Landing');

// Loading fallback component
export const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950">
    <div className="text-center">
      {/* Enhanced loading spinner */}
      <div className="relative mb-8">
        <div className="w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-slate-700"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 dark:border-t-cyan-400 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-500 dark:border-t-blue-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        {/* Pulsing glow effect */}
        <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 dark:from-cyan-400/20 dark:to-blue-400/20 animate-pulse blur-xl"></div>
      </div>
      
      {/* Loading text with gradient */}
      <div className="space-y-2">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent animate-pulse">
          Loading...
        </h3>
        <p className="text-gray-600 dark:text-slate-300 animate-pulse">
          Preparing your experience
        </p>
      </div>
      
      {/* Loading dots animation */}
      <div className="flex justify-center space-x-2 mt-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-cyan-400 animate-bounce"
            style={{ animationDelay: `${i * 0.1}s` }}
          ></div>
        ))}
      </div>
    </div>
  </div>
);

// HOC for lazy loading with Suspense
export const withLazyLoading = (Component) => (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component {...props} />
  </Suspense>
);
