import { lazy, Suspense } from 'react';

// Enhanced lazy loading with error boundaries and retry logic
const createLazyComponent = (importFunc, componentName) => {
  return lazy(async () => {
    try {
      // Attempt to load the component
      return await importFunc();
    } catch (error) {
      console.error(`Error loading component ${componentName}:`, error);
      
      try {
        // Wait a moment and retry once
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await importFunc();
      } catch (retryError) {
        console.error(`Failed to load component ${componentName} after retry:`, retryError);
        return {
          default: () => (
            <div className="min-h-screen flex items-center justify-center cyber-page px-4">
              <div className="text-center p-8 cyber-glass rounded-3xl border border-rose-300/20 bg-rose-500/5 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
                <h2 className="text-2xl font-bold text-rose-700 dark:text-rose-300 mb-4">
                  Component Failed to Load
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  {componentName} could not be loaded. Please refresh the page.
                </p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="interactive-lift px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-semibold"
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

// Simple loading fallback component
export const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center cyber-page px-4">
    <div className="text-center cyber-glass rounded-3xl border border-white/10 px-8 py-7">
      <div className="relative mx-auto mb-4 h-14 w-14">
        <div className="absolute inset-0 rounded-full border border-purple-300/30 bg-purple-500/10 animate-pulse"></div>
        <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-[#A855F7] border-r-[#2DD4BF] animate-spin"></div>
      </div>
      <p className="text-slate-700 dark:text-slate-300">Loading...</p>
    </div>
  </div>
);

// Lazy load components with enhanced error handling
export const LazyHome = createLazyComponent(() => import('../pages/Home'), 'Home');
export const LazyLanding = createLazyComponent(() => import('../pages/Landing'), 'Landing');
export const LazyAuthLogin = createLazyComponent(() => import('../pages/AuthLogin'), 'AuthLogin');
export const LazyAuthRegister = createLazyComponent(() => import('../pages/AuthRegister'), 'AuthRegister');
export const LazyQRScan = createLazyComponent(() => import('../pages/QRScan'), 'QRScan');
export const LazyProductDetail = createLazyComponent(() => import('../pages/ProductDetail'), 'ProductDetail');
export const LazyAdminDashboard = createLazyComponent(() => import('../pages/AdminDashboard'), 'AdminDashboard');
export const LazyAddProduct = createLazyComponent(() => import('../pages/AddProduct'), 'AddProduct');
export const LazyUpdateProduct = createLazyComponent(() => import('../pages/UpdateProduct'), 'UpdateProduct');
export const LazyAIConsole = createLazyComponent(() => import('../pages/AIConsole'), 'AIConsole');

// Enhanced loading fallback component with better UX
export const EnhancedLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center cyber-page px-4">
    <div className="text-center p-8 cyber-glass rounded-[28px] border border-white/10 shadow-[0_22px_60px_rgba(15,23,42,0.2)]">
      {/* Main loading spinner with glow effect */}
      <div className="relative mb-8">
        <div className="w-16 h-16 mx-auto relative">
          <div className="absolute inset-0 w-16 h-16 border-4 border-purple-300/20 dark:border-white/10 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-[#A855F7] dark:border-[#2DD4BF] rounded-full border-t-transparent animate-spin"></div>
        </div>
        <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-[#A855F7]/20 to-[#2DD4BF]/20 animate-pulse blur-xl"></div>
      </div>
      
      {/* Loading text with gradient */}
      <div className="space-y-2">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-[#A855F7] to-[#2DD4BF] bg-clip-text text-transparent animate-pulse">
          Loading...
        </h3>
        <p className="text-slate-600 dark:text-slate-300 animate-pulse">
          Preparing your experience
        </p>
      </div>
      
      {/* Loading dots animation */}
      <div className="flex justify-center space-x-2 mt-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-[#A855F7] dark:bg-[#2DD4BF] animate-bounce"
            style={{ animationDelay: `${i * 0.1}s` }}
          ></div>
        ))}
      </div>
    </div>
  </div>
);

// HOC for lazy loading with Suspense
export const withLazyLoading = (Component) => (props) => (
  <Suspense fallback={<EnhancedLoadingFallback />}>
    <Component {...props} />
  </Suspense>
);
