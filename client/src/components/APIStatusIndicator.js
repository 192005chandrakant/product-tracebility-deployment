import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaSpinner, FaCog } from 'react-icons/fa';
import { buildAPIURL } from '../utils/apiConfig';

const APIStatusIndicator = ({ showDetails = false }) => {
  const [status, setStatus] = useState({
    state: 'checking',
    backend: null,
    authentication: null,
    loading: true,
    lastChecked: null,
    message: 'Checking...',
    productCount: 0
  });

  const checkAPIStatus = async () => {
    setStatus(prev => ({ ...prev, state: 'checking', loading: true }));
    
    try {
      // Test basic connectivity
      const response = await fetch(buildAPIURL('/api/health'), {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      let productCount = 0;
      if (response.ok) {
        // Test products endpoint
        try {
          const productsResponse = await fetch(buildAPIURL('/api/recent-products?limit=1'));
          if (productsResponse.ok) {
            const data = await productsResponse.json();
            productCount = data.length;
          }
        } catch (err) {
          console.log('Products endpoint test failed:', err);
        }
        
        // Test auth endpoint
        let authWorking = false;
        try {
          const authResponse = await fetch(buildAPIURL('/api/auth/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@test.com', password: 'wrong' })
          });
          authWorking = authResponse.status === 400 || authResponse.status === 401;
        } catch (err) {
          console.log('Auth endpoint test failed:', err);
        }
        
        setStatus({
          state: 'connected',
          backend: true,
          authentication: authWorking,
          loading: false,
          lastChecked: new Date().toLocaleTimeString(),
          message: `API connected. ${authWorking ? 'Auth working.' : 'Auth issues.'} ${productCount} products found.`,
          productCount
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('API status check failed:', error);
      setStatus({
        state: 'disconnected',
        backend: false,
        authentication: false,
        loading: false,
        lastChecked: new Date().toLocaleTimeString(),
        message: `Connection failed: ${error.message}`,
        productCount: 0
      });
    }
  };

  useEffect(() => {
    checkAPIStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkAPIStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status.state) {
      case 'connected':
        return status.authentication ? 
          <FaCheckCircle className="text-emerald-500" /> : 
          <FaExclamationTriangle className="text-amber-500" />;
      case 'disconnected':
        return <FaExclamationTriangle className="text-rose-500" />;
      default:
        return <FaSpinner className="text-purple-500 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status.state) {
      case 'connected':
        return status.authentication ? 
          'bg-emerald-500/10 border-emerald-300/30 text-emerald-800 dark:text-emerald-200' : 
          'bg-amber-500/10 border-amber-300/30 text-amber-800 dark:text-amber-200';
      case 'disconnected':
        return 'bg-rose-500/10 border-rose-300/30 text-rose-800 dark:text-rose-200';
      default:
        return 'bg-purple-500/10 border-purple-300/30 text-purple-800 dark:text-purple-200';
    }
  };

  const getStatusText = () => {
    switch (status.state) {
      case 'connected':
        return status.authentication ? 'Connected' : 'Partial Connection';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Checking...';
    }
  };

  const getStatusTextColor = () => {
    switch (status.state) {
      case 'connected':
        return status.authentication ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300';
      case 'disconnected':
        return 'text-rose-600 dark:text-rose-300';
      default:
        return 'text-purple-600 dark:text-purple-300';
    }
  };

  // Simple view (showDetails = false)
  if (!showDetails) {
    return (
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        <span className={`text-sm font-medium ${getStatusTextColor()}`}>
          {getStatusText()}
        </span>
      </div>
    );
  }

  // Detailed view (showDetails = true)
  return (
    <div className={`cyber-glass p-3 rounded-2xl border text-sm flex items-center gap-2 ${getStatusColor()}`}>
      {getStatusIcon()}
      <div className="flex-1">
        <div className="font-medium">{getStatusText()}</div>
        <div className="text-xs opacity-75 mt-1">
          {status.message}
          {status.lastChecked && (
            <span className="ml-2">Last checked: {status.lastChecked}</span>
          )}
        </div>
        {status.state === 'connected' && status.productCount > 0 && (
          <div className="text-xs opacity-75">
            {status.productCount} products available
          </div>
        )}
      </div>
      <button
        onClick={checkAPIStatus}
        disabled={status.loading}
        className="p-1 hover:bg-black/10 rounded-lg"
        title="Refresh status"
      >
        <FaCog className={status.loading ? 'animate-spin' : ''} />
      </button>
    </div>
  );
};

export default APIStatusIndicator;
