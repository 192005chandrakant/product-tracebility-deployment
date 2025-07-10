import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import { buildAPIURL } from '../utils/apiConfig';

const BackendConnectionStatus = ({ showDetails = false }) => {
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
      const response = await fetch(buildAPIURL('/test'), {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        timeout: 10000
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
          <FaCheckCircle className="text-green-500" /> : 
          <FaExclamationTriangle className="text-yellow-500" />;
      case 'disconnected':
        return <FaExclamationTriangle className="text-red-500" />;
      default:
        return <FaSpinner className="text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status.state) {
      case 'connected':
        return status.authentication ? 'text-green-600' : 'text-yellow-600';
      case 'disconnected':
        return 'text-red-600';
      default:
        return 'text-blue-600';
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

  if (!showDetails) {
    return (
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Backend Connection Status
        </h3>
        <button
          onClick={checkAPIStatus}
          disabled={status.loading}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {status.loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-300">Backend Server:</span>
          <div className={`flex items-center space-x-2 ${status.backend ? 'text-green-600' : 'text-red-600'}`}>
            <span>{status.backend ? '✅' : '❌'}</span>
            <span className="font-medium">{status.backend ? 'Online' : 'Offline'}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-300">Authentication:</span>
          <div className={`flex items-center space-x-2 ${status.authentication ? 'text-green-600' : 'text-red-600'}`}>
            <span>{status.authentication ? '✅' : '❌'}</span>
            <span className="font-medium">{status.authentication ? 'Working' : 'Failed'}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-300">Products Found:</span>
          <span className="font-medium text-blue-600">{status.productCount}</span>
        </div>
        
        <div className="pt-3 border-t border-gray-200 dark:border-slate-600">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <div>Status: {status.message}</div>
            {status.lastChecked && (
              <div>Last checked: {status.lastChecked}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackendConnectionStatus;
