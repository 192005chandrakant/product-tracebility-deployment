import React from 'react';

const SkeletonLoader = ({ 
  type = 'card', 
  count = 6, 
  className = "",
  animate = true 
}) => {
  const animateClass = animate ? 'animate-pulse' : '';

  const renderCardSkeleton = () => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className={`h-40 bg-gray-100 dark:bg-gray-700 ${animateClass}`}></div>
      <div className="p-4 space-y-3">
        <div className={`h-4 bg-gray-100 dark:bg-gray-700 rounded ${animateClass}`}></div>
        <div className={`h-3 bg-gray-100 dark:bg-gray-700 rounded w-3/4 ${animateClass}`}></div>
        <div className={`h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2 ${animateClass}`}></div>
        <div className={`h-8 bg-gray-100 dark:bg-gray-700 rounded mt-4 ${animateClass}`}></div>
      </div>
    </div>
  );

  const renderProductSkeleton = () => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className={`h-48 bg-gray-100 dark:bg-gray-700 ${animateClass}`}></div>
      <div className="p-4 space-y-3">
        <div className={`h-5 bg-gray-100 dark:bg-gray-700 rounded ${animateClass}`}></div>
        <div className={`h-3 bg-gray-100 dark:bg-gray-700 rounded w-2/3 ${animateClass}`}></div>
        <div className={`h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2 ${animateClass}`}></div>
        <div className="flex gap-2 mt-4">
          <div className={`h-8 bg-gray-100 dark:bg-gray-700 rounded flex-1 ${animateClass}`}></div>
          <div className={`h-8 bg-gray-100 dark:bg-gray-700 rounded w-8 ${animateClass}`}></div>
        </div>
      </div>
    </div>
  );

  const renderListSkeleton = () => (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className={`h-4 bg-gray-100 dark:bg-gray-700 rounded mb-3 ${animateClass}`}></div>
      <div className={`h-3 bg-gray-100 dark:bg-gray-700 rounded w-3/4 mb-2 ${animateClass}`}></div>
      <div className={`h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2 ${animateClass}`}></div>
    </div>
  );

  const getSkeleton = () => {
    switch (type) {
      case 'product':
        return renderProductSkeleton();
      case 'list':
        return renderListSkeleton();
      case 'card':
      default:
        return renderCardSkeleton();
    }
  };

  if (type === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(count)].map((_, i) => (
          <div key={i}>
            {renderProductSkeleton()}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <div key={i}>
          {getSkeleton()}
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
