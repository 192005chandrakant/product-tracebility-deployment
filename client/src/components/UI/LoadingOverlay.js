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
      <div className={`${minHeight} transition-all duration-300 cyber-page ${className}`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center cyber-glass rounded-3xl border border-white/10 px-8 py-7 shadow-[0_20px_60px_rgba(17,24,39,0.18)]">
            <div className="relative mx-auto mb-4 h-14 w-14">
              <div className="absolute inset-0 rounded-full border border-purple-300/30 bg-purple-500/10 animate-pulse" />
              <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-[#A855F7] border-r-[#2DD4BF] animate-spin" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{message}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">TraceChain</p>
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
