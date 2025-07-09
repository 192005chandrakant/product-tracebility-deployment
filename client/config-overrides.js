const path = require('path');

module.exports = function override(config, env) {
  // Suppress source map warnings for MediaPipe and other packages
  config.ignoreWarnings = [
    {
      module: /node_modules\/@mediapipe\/tasks-vision/,
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
            /node_modules\/@mediapipe/
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
    // Optimize bundle splitting
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            maxSize: 244000, // 244KB chunks
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
          // Separate chunk for large libraries
          three: {
            test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
            name: 'three',
            chunks: 'all',
          },
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
          },
        },
      },
      runtimeChunk: {
        name: 'runtime',
      },
    };

    // Add performance hints
    config.performance = {
      hints: 'warning',
      maxEntrypointSize: 512000, // 512KB
      maxAssetSize: 512000, // 512KB
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
