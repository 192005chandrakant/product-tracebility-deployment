import React, { useState, useCallback, memo } from 'react';

const OptimizedImage = memo(({ 
  src, 
  alt, 
  className = '', 
  placeholder = null,
  fallback = '/api/placeholder/400/300',
  loading = 'lazy',
  ...props 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setImageError(true);
  }, []);

  if (imageError) {
    return (
      <img
        src={fallback}
        alt={alt}
        className={className}
        loading={loading}
        {...props}
      />
    );
  }

  return (
    <div className="relative">
      {!imageLoaded && placeholder && (
        <div className={`absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${className}`}>
          {placeholder}
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${!imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
