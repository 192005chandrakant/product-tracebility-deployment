import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Check for specific error types
    const isChunkError = error.name === 'ChunkLoadError' || 
                         error.message?.includes('chunk') || 
                         error.message?.includes('Loading CSS chunk');
                         
    const isWebGLError = error.message?.includes('WebGL') || 
                         error.message?.includes('webgl') || 
                         error.message?.includes('context lost') ||
                         error.message?.includes('INVALID_OPERATION');
    
    if (isChunkError) {
      console.log('🔄 Chunk loading error detected, attempting page reload...');
      // Reload the page after a short delay to recover from chunk loading errors
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else if (isWebGLError) {
      console.log('🔄 WebGL error detected, attempting recovery...');
      // For WebGL errors, we can try to recover without a full page reload
      // by setting state and letting components fall back to 2D versions
      this.setState({ 
        hasError: true,
        error: {
          ...error,
          isWebGLError: true
        }
      });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.name === 'ChunkLoadError' || 
                          this.state.error?.message?.includes('chunk') ||
                          this.state.error?.message?.includes('Loading CSS chunk');
                          
      const isWebGLError = this.state.error?.isWebGLError ||
                          this.state.error?.message?.includes('WebGL') ||
                          this.state.error?.message?.includes('webgl') ||
                          this.state.error?.message?.includes('context lost');

      if (isChunkError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
            <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md">
              <div className="w-16 h-16 mx-auto mb-4">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                Loading Application...
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Please wait while we reload the application components.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This page will refresh automatically in a moment.
              </p>
            </div>
          </div>
        );
      }
      
      if (isWebGLError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
            <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 text-blue-500">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                  <path d="M11 9h2V7h-2m1 13c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8m0-18A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2m-1 15h2v-6h-2v6z"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                Graphics Error Detected
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Your browser encountered an issue with 3D graphics. We've switched to a simplified view.
              </p>
              <button 
                onClick={this.handleReload}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800">
          <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 text-red-500">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2v-2zm0-6h2v4h-2v-4z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div className="space-y-3">
              <button 
                onClick={this.handleReload}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Refresh Page
              </button>
              {process.env.NODE_ENV === 'development' && (
                <details className="text-left text-sm">
                  <summary className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-slate-700 rounded border">
                    <p className="font-mono text-xs text-red-600 dark:text-red-400">
                      {this.state.error && this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && this.state.errorInfo.componentStack && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-gray-600 dark:text-gray-300">Component Stack</summary>
                        <pre className="mt-1 text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
