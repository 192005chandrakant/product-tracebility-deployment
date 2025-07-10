import { useState, useEffect, useCallback, useRef } from 'react';
import { buildAPIURL } from '../utils/apiConfig';

const useRealTimeStats = (refreshInterval = 10000) => {
  const [statistics, setStatistics] = useState({
    totalProducts: 0,
    totalScans: 0,
    totalUpdates: 0,
    recentProducts: [],
    recentUpdates: [],
    timestamp: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  const fetchStatistics = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(buildAPIURL('/api/statistics/stats'), {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (isMountedRef.current) {
        setStatistics({
          totalProducts: data.stats?.totalProducts || 0,
          totalScans: data.stats?.totalScans || 0,
          totalUpdates: data.stats?.totalUpdates || 0,
          recentProducts: data.stats?.recentProducts || [],
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
      if (isMountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (isMountedRef.current && showLoading) {
        setLoading(false);
      }
    }
  }, []);

  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      fetchStatistics(false); // Don't show loading for auto-refresh
    }, refreshInterval);
  }, [fetchStatistics, refreshInterval]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refreshStats = useCallback(() => {
    fetchStatistics(true);
  }, [fetchStatistics]);

  // Initialize and start auto-refresh
  useEffect(() => {
    isMountedRef.current = true;
    fetchStatistics(true);
    startAutoRefresh();

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      stopAutoRefresh();
    };
  }, [fetchStatistics, startAutoRefresh, stopAutoRefresh]);

  // Listen for custom events to refresh stats immediately
  useEffect(() => {
    const handleProductUpdate = () => {
      fetchStatistics(false);
    };

    const handleUserLogin = () => {
      fetchStatistics(true);
    };

    window.addEventListener('productUpdated', handleProductUpdate);
    window.addEventListener('productAdded', handleProductUpdate);
    window.addEventListener('userLogin', handleUserLogin);

    return () => {
      window.removeEventListener('productUpdated', handleProductUpdate);
      window.removeEventListener('productAdded', handleProductUpdate);
      window.removeEventListener('userLogin', handleUserLogin);
    };
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refreshStats,
    startAutoRefresh,
    stopAutoRefresh
  };
};

export default useRealTimeStats;
