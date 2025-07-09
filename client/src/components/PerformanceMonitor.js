import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    isVisible: false
  });

  useEffect(() => {
    const startTime = performance.now();
    
    // Monitor page load performance
    const measurePerformance = () => {
      const loadTime = performance.now() - startTime;
      
      if ('performance' in window) {
        const navTiming = performance.getEntriesByType('navigation')[0];
        const paintTiming = performance.getEntriesByType('paint');
        
        const firstPaint = paintTiming.find(entry => entry.name === 'first-paint');
        const firstContentfulPaint = paintTiming.find(entry => entry.name === 'first-contentful-paint');
        
        console.log('🚀 Performance Metrics:');
        console.log(`Page Load: ${loadTime.toFixed(2)}ms`);
        if (firstPaint) console.log(`First Paint: ${firstPaint.startTime.toFixed(2)}ms`);
        if (firstContentfulPaint) console.log(`First Contentful Paint: ${firstContentfulPaint.startTime.toFixed(2)}ms`);
        
        setMetrics(prev => ({
          ...prev,
          loadTime: loadTime,
          renderTime: firstContentfulPaint ? firstContentfulPaint.startTime : 0
        }));
        
        // Show performance indicator if load time is significant
        if (loadTime > 1000) {
          setMetrics(prev => ({ ...prev, isVisible: true }));
          setTimeout(() => {
            setMetrics(prev => ({ ...prev, isVisible: false }));
          }, 3000);
        }
      }
    };

    // Monitor Core Web Vitals
    const observeWebVitals = () => {
      let lcpObserver = null;
      let fidObserver = null;
      let clsObserver = null;
      
      if ('PerformanceObserver' in window) {
        // Largest Contentful Paint
        lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
          console.log(`LCP: ${lastEntry.startTime.toFixed(2)}ms`);
        });
        
        try {
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          console.warn('LCP observer not supported');
        }

        // First Input Delay
        fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach(entry => {
            setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
            console.log(`FID: ${(entry.processingStart - entry.startTime).toFixed(2)}ms`);
          });
        });
        
        try {
          fidObserver.observe({ entryTypes: ['first-input'] });
        } catch (e) {
          console.warn('FID observer not supported');
        }

        // Cumulative Layout Shift
        let clsValue = 0;
        clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              setMetrics(prev => ({ ...prev, cls: clsValue }));
              console.log(`CLS: ${clsValue.toFixed(4)}`);
            }
          }
        });
        
        try {
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
          console.warn('CLS observer not supported');
        }
      }
      
      // Return observer references for cleanup
      return { lcpObserver, fidObserver, clsObserver };
    };

    // Initialize observers as component-level variables for proper cleanup
    let lcpObserver;
    let fidObserver;
    let clsObserver;
    let memoryInterval;
    
    // Monitor after component mount
    setTimeout(measurePerformance, 100);
    
    // Get references to observers
    const observersSetup = observeWebVitals();
    lcpObserver = observersSetup.lcpObserver;
    fidObserver = observersSetup.fidObserver;
    clsObserver = observersSetup.clsObserver;
    
    // Memory usage monitoring removed as requested
    
    // Return proper cleanup function
    return () => {
      // Clean up all observers and intervals
      if (lcpObserver) lcpObserver.disconnect();
      if (fidObserver) fidObserver.disconnect();
      if (clsObserver) clsObserver.disconnect();
      if (memoryInterval) clearInterval(memoryInterval);
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {metrics.isVisible && process.env.NODE_ENV === 'development' && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-50 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg shadow-lg"
          >
            <div className="text-xs">
              <p>⚠️ Slow load detected</p>
              <p>Load time: {metrics.loadTime.toFixed(0)}ms</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Memory usage display removed as requested */}
    </>
  );
};

export default PerformanceMonitor;
