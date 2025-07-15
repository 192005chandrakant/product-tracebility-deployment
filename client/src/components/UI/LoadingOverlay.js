import React from 'react';

const LoadingOverlay = ({ 
  isLoading, 
  children, 
  className = "", 
  message = "Loading...",
  minHeight = "min-h-screen" 
}) => {
  if (isLoading) {
    return (
      <div className={`${minHeight} transition-all duration-300 
        bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 
        dark:bg-gradient-to-br dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 
        ${className}`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">{message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
};

export default LoadingOverlay;
