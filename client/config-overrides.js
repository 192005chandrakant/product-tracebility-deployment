const path = require('path');

module.exports = function override(config, env) {
  // Suppress source map warnings for MediaPipe and other packages
  config.ignoreWarnings = [
    {
      module: /node_modules\/@mediapipe\/tasks-vision/,
      message: /Failed to parse source map/,
    },
    {
      module: /node_modules\/html5-qrcode/,
      message: /Failed to parse source map/,
    },
    /DEP_WEBPACK_DEV_SERVER_ON_AFTER_SETUP_MIDDLEWARE/,
    /DEP_WEBPACK_DEV_SERVER_ON_BEFORE_SETUP_MIDDLEWARE/,
    /DEP0060/,
  ];
  
  // Suppress source map loader warnings for MediaPipe
  config.module.rules.forEach((rule) => {
    if (rule.oneOf) {
      rule.oneOf.forEach((oneOfRule) => {
        if (oneOfRule.use && oneOfRule.use.some && oneOfRule.use.some(use => use.loader && use.loader.includes('source-map-loader'))) {
          oneOfRule.exclude = [
            /node_modules\/@mediapipe/,
            /node_modules\/html5-qrcode/
          ];
        }
      });
    }
  });

  // Add webpack aliases for shorter imports
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': path.resolve(__dirname, 'src'),
    '@components': path.resolve(__dirname, 'src/components'),
    '@pages': path.resolve(__dirname, 'src/pages'),
    '@utils': path.resolve(__dirname, 'src/utils'),
    '@styles': path.resolve(__dirname, 'src/styles'),
  };

  // Performance optimizations for production
  if (env === 'production') {
    // CRITICAL: Set absolute public path to prevent relative path issues
    config.output.publicPath = 'https://blockchain-product-traceability.netlify.app/';
    
    // Optimize bundle splitting with more reliable chunking
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: -10,
            maxSize: 244000,
          },
          // Separate chunk for React libraries
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 10,
          },
          // Separate chunk for large libraries that might cause issues
          three: {
            test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
            name: 'three',
            chunks: 'all',
            priority: 5,
          },
          // Common components
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: -5,
            reuseExistingChunk: true,
          },
        },
      },
      // Stable runtime chunk
      runtimeChunk: {
        name: 'runtime',
      },
      // Ensure stable module IDs
      moduleIds: 'deterministic',
      chunkIds: 'deterministic',
    };

    // Add performance hints but don't break the build
    config.performance = {
      hints: 'warning',
      maxEntrypointSize: 512000, // 512KB
      maxAssetSize: 512000, // 512KB
    };
    
    // Ensure proper asset loading with absolute paths
    config.output = {
      ...config.output,
      publicPath: 'https://blockchain-product-traceability.netlify.app/',
      filename: 'static/js/[name].[contenthash:8].js',
      chunkFilename: 'static/js/[name].[contenthash:8].chunk.js',
    };
  }

  // Development optimizations for faster rebuilds
  if (env === 'development') {
    config.optimization = {
      ...config.optimization,
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: false,
    };
  }

  return config;
};
