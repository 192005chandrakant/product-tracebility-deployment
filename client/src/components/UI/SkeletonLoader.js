import React from 'react';

const SkeletonLoader = ({ 
  type = 'card', 
  count = 6, 
  className = "",
  animate = true 
}) => {
  const animateClass = animate ? 'animate-pulse' : '';
  const shellClass = 'bg-[#1C1926]/85 rounded-xl overflow-hidden border border-white/10 shadow-[0_0_24px_rgba(168,85,247,0.12)]';
  const shimmerClass = 'bg-[linear-gradient(90deg,#252131_0%,rgba(168,85,247,0.20)_45%,#252131_100%)] bg-[length:200%_100%]';

  const renderCardSkeleton = () => (
    <div className={`${shellClass} ${className}`}>
      <div className={`h-40 ${shimmerClass} ${animateClass}`}></div>
      <div className="p-4 space-y-3">
        <div className={`h-4 ${shimmerClass} rounded ${animateClass}`}></div>
        <div className={`h-3 ${shimmerClass} rounded w-3/4 ${animateClass}`}></div>
        <div className={`h-3 ${shimmerClass} rounded w-1/2 ${animateClass}`}></div>
        <div className={`h-8 ${shimmerClass} rounded mt-4 ${animateClass}`}></div>
      </div>
    </div>
  );

  const renderProductSkeleton = () => (
    <div className={`${shellClass} ${className}`}>
      <div className={`h-48 ${shimmerClass} ${animateClass}`}></div>
      <div className="p-4 space-y-3">
        <div className={`h-5 ${shimmerClass} rounded ${animateClass}`}></div>
        <div className={`h-3 ${shimmerClass} rounded w-2/3 ${animateClass}`}></div>
        <div className={`h-3 ${shimmerClass} rounded w-1/2 ${animateClass}`}></div>
        <div className="flex gap-2 mt-4">
          <div className={`h-8 ${shimmerClass} rounded flex-1 ${animateClass}`}></div>
          <div className={`h-8 ${shimmerClass} rounded w-8 ${animateClass}`}></div>
        </div>
      </div>
    </div>
  );

  const renderListSkeleton = () => (
    <div className={`${shellClass} rounded-lg p-4 ${className}`}>
      <div className={`h-4 ${shimmerClass} rounded mb-3 ${animateClass}`}></div>
      <div className={`h-3 ${shimmerClass} rounded w-3/4 mb-2 ${animateClass}`}></div>
      <div className={`h-3 ${shimmerClass} rounded w-1/2 ${animateClass}`}></div>
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
