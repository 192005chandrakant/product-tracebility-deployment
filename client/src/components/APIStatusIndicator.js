import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import { buildAPIURL } from '../utils/apiConfig';

const APIStatusIndicator = () => {
  const [status, setStatus] = useState('checking');
  const [details, setDetails] = useState('');

  useEffect(() => {
    const checkAPIStatus = async () => {
      try {
        setStatus('checking');
        setDetails('Checking API connection...');
        
        const response = await fetch(buildAPIURL('/api/recent-products?limit=1'));
        
        if (response.ok) {
          const data = await response.json();
          setStatus('connected');
          setDetails(`API connected. Found ${data.length} products.`);
        } else {
          setStatus('error');
          setDetails(`API error: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        setStatus('error');
        setDetails(`Connection failed: ${error.message}`);
      }
    };

    checkAPIStatus();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <FaSpinner className="animate-spin text-yellow-500" />;
      case 'connected':
        return <FaCheckCircle className="text-green-500" />;
      case 'error':
        return <FaExclamationTriangle className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'checking':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'connected':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${getStatusColor()}`}>
      {getStatusIcon()}
      <span>{details}</span>
    </div>
  );
};

export default APIStatusIndicator;
