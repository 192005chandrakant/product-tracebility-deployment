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
        return status.authentication ? 
          'bg-green-50 border-green-200 text-green-800' : 
          'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'disconnected':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
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
        return status.authentication ? 'text-green-600' : 'text-yellow-600';
      case 'disconnected':
        return 'text-red-600';
      default:
        return 'text-blue-600';
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
    <div className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${getStatusColor()}`}>
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
        className="p-1 hover:bg-black hover:bg-opacity-10 rounded"
        title="Refresh status"
      >
        <FaCog className={status.loading ? 'animate-spin' : ''} />
      </button>
    </div>
  );
};

export default APIStatusIndicator;
