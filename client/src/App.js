import React, { Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import PerformanceMonitor from './components/PerformanceMonitor';
import { 
  LazyHome, 
  LazyAuthLogin, 
  LazyAuthRegister, 
  LazyQRScan, 
  LazyProductDetail, 
  LazyAdminDashboard, 
  LazyAddProduct, 
  LazyUpdateProduct, 
  LazyLanding,
  LoadingFallback 
} from './utils/lazyLoading';
// Import UserProfile directly to avoid chunk loading error
import UserProfile from './pages/UserProfile';
import { usePerformanceMonitor } from './utils/performanceOptimizations';
import './styles/animations.css';

// Optimized loading screen with consistent styling
const OptimizedLoadingFallback = React.memo(() => (
  <div className="min-h-screen transition-all duration-300
    bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 
    dark:bg-gradient-to-br dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading...</p>
      </div>
    </div>
  </div>
));

// Preload critical components after initial load with better error handling
const useComponentPreloader = () => {
  useEffect(() => {
    const preloadComponents = async () => {
      try {
        // Preload most commonly used components with timeout
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Preload timeout')), 10000)
        );
        
        const preloadPromises = [
          Promise.race([LazyHome.preload ? LazyHome.preload() : Promise.resolve(), timeout]),
          Promise.race([LazyQRScan.preload ? LazyQRScan.preload() : Promise.resolve(), timeout]),
          Promise.race([LazyProductDetail.preload ? LazyProductDetail.preload() : Promise.resolve(), timeout])
        ];
        
        const results = await Promise.allSettled(preloadPromises);
        
        const successful = results.filter(result => result.status === 'fulfilled').length;
        const failed = results.filter(result => result.status === 'rejected').length;
        
        console.log(`✅ Component preload completed: ${successful} successful, ${failed} failed`);
        
        if (failed > 0) {
          console.log('⚠️ Some components failed to preload, but this is non-critical');
        }
      } catch (error) {
        console.log('⚠️ Component preload failed:', error.message || error);
        // Don't throw error as this is non-critical
      }
    };

    // Preload after a short delay to not interfere with initial rendering
    const timeoutId = setTimeout(preloadComponents, 1000);
    return () => clearTimeout(timeoutId);
  }, []);
};

function PrivateRoute({ children, allowedRoles }) {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsValid(false);
        setIsValidating(false);
        return;
      }
      
      try {
        const decoded = jwtDecode(token);
        const { role } = decoded;
        
        // Check if token is expired
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          setIsValid(false);
        } else if (allowedRoles.includes(role)) {
          setIsValid(true);
        } else {
          setIsValid(false);
        }
      } catch (error) {
        console.error('Token parsing error:', error);
        localStorage.removeItem('token');
        setIsValid(false);
      }
      
      setIsValidating(false);
    };

    validateToken();
  }, [allowedRoles]);
  
  if (isValidating) {
    return <OptimizedLoadingFallback />;
  }
  
  if (!isValid) {
    return <Navigate to="/auth/login" replace />;
  }
  
  return children;
}

function App() {
  // Performance monitoring
  usePerformanceMonitor();
  
  // Preload components for better UX
  useComponentPreloader();
  
  return (
    <ErrorBoundary>
      <Layout>
        <Suspense fallback={<OptimizedLoadingFallback />}>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<LazyLanding />} />
              <Route path="/home" element={<PrivateRoute allowedRoles={['admin', 'producer', 'consumer']}><LazyHome /></PrivateRoute>} />
              <Route path="/scan" element={<LazyQRScan />} />
              <Route path="/product/:id" element={<LazyProductDetail />} />
              <Route path="/profile" element={<PrivateRoute allowedRoles={['admin', 'producer', 'consumer', 'customer', 'user']}><UserProfile /></PrivateRoute>} />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<PrivateRoute allowedRoles={['admin','producer']}><LazyAdminDashboard /></PrivateRoute>} />
              <Route path="/admin/add" element={<PrivateRoute allowedRoles={['producer']}><LazyAddProduct /></PrivateRoute>} />
              <Route path="/admin/update" element={<PrivateRoute allowedRoles={['producer']}><LazyUpdateProduct /></PrivateRoute>} />
              <Route path="/admin/update/:id" element={<PrivateRoute allowedRoles={['producer']}><LazyUpdateProduct /></PrivateRoute>} />
              <Route path="/auth/login" element={<LazyAuthLogin />} />
              <Route path="/auth/register" element={<LazyAuthRegister />} />
            </Routes>
          </ErrorBoundary>
        </Suspense>
        <PerformanceMonitor />
      </Layout>
    </ErrorBoundary>
  );
}

export default App;
