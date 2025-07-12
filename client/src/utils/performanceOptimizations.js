import React, { Suspense, memo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Higher-order component for performance optimization
export const withPerformanceOptimization = (Component) => {
  return memo((props) => {
    return (
      <Suspense 
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              }}
              className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
            />
          </div>
        }
      >
        <Component {...props} />
      </Suspense>
    );
  });
};

// Optimized image component with lazy loading
export const OptimizedImage = memo(({ src, alt, className, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  // Reset states when src changes
  useEffect(() => {
    setIsLoaded(false);
    setIsError(false);
  }, [src]);

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && !isError && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsError(true)}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        {...props}
      />
      {isError && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 text-sm">
          Failed to load image
        </div>
      )}
    </div>
  );
});

// Debounce hook for search inputs
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

// Optimized animation variants for better performance
export const optimizedAnimations = {
  // Use transform instead of animating layout properties
  slideIn: {
    initial: { opacity: 0, transform: 'translateX(-100%)' },
    animate: { opacity: 1, transform: 'translateX(0%)' },
    exit: { opacity: 0, transform: 'translateX(100%)' },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
  },
  
  scaleIn: {
    initial: { opacity: 0, transform: 'scale(0.8)' },
    animate: { opacity: 1, transform: 'scale(1)' },
    exit: { opacity: 0, transform: 'scale(0.8)' },
    transition: { duration: 0.2, ease: 'easeOut' }
  },

  // Use will-change CSS property for better GPU acceleration
  slideUp: {
    initial: { opacity: 0, transform: 'translateY(20px)' },
    animate: { 
      opacity: 1, 
      transform: 'translateY(0px)',
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    exit: { 
      opacity: 0, 
      transform: 'translateY(-20px)',
      transition: { duration: 0.2 }
    }
  }
};

// Performance monitoring hook with reduced logging
export const usePerformanceMonitor = () => {
  useEffect(() => {
    // Record page load performance
    window.addEventListener('load', () => {
      const pageLoadTime = performance.now();
      const navigationTiming = performance.getEntriesByType('navigation')[0];
      const dcl = navigationTiming?.domContentLoadedEventEnd || 0;
      
      // Only log if debug is enabled
      if (process.env.REACT_APP_DEBUG === 'true') {
        console.log(`📊 Page load time: ${pageLoadTime.toFixed(2)} ms`);
        console.log(`📊 DOMContentLoaded: ${dcl.toFixed(2)} ms`);
      }
    });
    
    // LCP observer with reduced logging
    if ('PerformanceObserver' in window) {
      try {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          // Only log LCP in debug mode and if it's significant
          if (process.env.REACT_APP_DEBUG === 'true' && lastEntry.startTime > 1000) {
            console.log(`📊 LCP: ${lastEntry.startTime.toFixed(0)} ms`);
          }
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // Silent error - LCP observer not supported
      }
    }
  }, []);
};

// Memoized component wrapper
export const MemoizedComponent = memo(({ children, dependencies = [] }) => {
  return React.useMemo(() => children, dependencies);
});

OptimizedImage.displayName = 'OptimizedImage';
MemoizedComponent.displayName = 'MemoizedComponent';
