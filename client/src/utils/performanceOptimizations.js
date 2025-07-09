import React, { Suspense, memo } from 'react';
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
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isError, setIsError] = React.useState(false);

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
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Virtual scroll hook for large lists
export const useVirtualScroll = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(visibleStart, visibleEnd);
  
  return {
    visibleItems,
    totalHeight: items.length * itemHeight,
    offsetY: visibleStart * itemHeight,
    onScroll: (e) => setScrollTop(e.target.scrollTop),
  };
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (options = {}) => {
  const [ref, setRef] = React.useState(null);
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      options
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, options]);

  return [setRef, isIntersecting];
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

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  React.useEffect(() => {
    if ('performance' in window) {
      // Monitor page load time
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0];
          console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
          console.log('DOMContentLoaded:', perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart, 'ms');
        }, 0);
      });

      // Monitor largest contentful paint
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            console.log('LCP:', entry.startTime, 'ms');
          }
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
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
