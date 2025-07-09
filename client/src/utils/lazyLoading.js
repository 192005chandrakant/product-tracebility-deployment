import { lazy, Suspense } from 'react';

// Lazy load components to reduce initial bundle size
export const LazyHome = lazy(() => import('../pages/Home'));
export const LazyAuthLogin = lazy(() => import('../pages/AuthLogin'));
export const LazyAuthRegister = lazy(() => import('../pages/AuthRegister'));
export const LazyQRScan = lazy(() => import('../pages/QRScan'));
export const LazyProductDetail = lazy(() => import('../pages/ProductDetail'));
// UserProfile is imported directly in App.js to avoid chunk loading issues
export const LazyAdminDashboard = lazy(() => import('../pages/AdminDashboard'));
export const LazyAddProduct = lazy(() => import('../pages/AddProduct'));
export const LazyUpdateProduct = lazy(() => import('../pages/UpdateProduct'));
export const LazyLanding = lazy(() => import('../pages/Landing'));

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
