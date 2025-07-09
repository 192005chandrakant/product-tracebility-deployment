import React, { Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Layout from './components/Layout';
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
import PdfTestPage from './pages/PdfTestPage'; // Import the new test page
import { usePerformanceMonitor } from './utils/performanceOptimizations';
import './styles/animations.css';

// Optimized loading screen
const OptimizedLoadingFallback = React.memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-600 dark:text-gray-300 font-medium">Loading...</p>
    </div>
  </div>
));

// Preload critical components after initial load
const useComponentPreloader = () => {
  useEffect(() => {
    const preloadComponents = async () => {
      try {
        // Preload most commonly used components
        const promises = [
          LazyHome(),
          LazyQRScan(),
          LazyProductDetail()
        ];
        await Promise.all(promises);
        console.log('✅ Critical components preloaded');
      } catch (error) {
        console.log('⚠️ Component preload failed:', error);
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
    <Layout>
      <Suspense fallback={<OptimizedLoadingFallback />}>
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
          <Route path="/debug/pdf/:productId" element={<PrivateRoute allowedRoles={['admin', 'producer']}><PdfTestPage /></PrivateRoute>} /> {/* PDF debug page */}
        </Routes>
      </Suspense>
      <PerformanceMonitor />
    </Layout>
  );
}

export default App;
