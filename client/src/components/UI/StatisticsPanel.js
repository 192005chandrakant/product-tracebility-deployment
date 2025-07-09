import React from 'react';
import { motion } from 'framer-motion';
import { FaChartBar, FaEye, FaEdit, FaBox, FaSync } from 'react-icons/fa';
import useRealTimeStats from '../../hooks/useRealTimeStats';

const StatisticsPanel = ({ className = '', refreshInterval = 10000 }) => {
  const { statistics, loading, error, refreshStats } = useRealTimeStats(refreshInterval);

  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4 ${className}`}>
        <p className="text-red-700 dark:text-red-300 text-sm">
          Unable to load statistics
        </p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Products',
      value: statistics.totalProducts,
      icon: FaBox,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Total Scans',
      value: statistics.totalScans,
      icon: FaEye,
      color: 'green',
      gradient: 'from-green-500 to-green-600'
    },
    {
      title: 'Total Updates',
      value: statistics.totalUpdates,
      icon: FaEdit,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <FaChartBar className="text-white text-sm" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
            Live Statistics
          </h3>
        </div>
        <button
          onClick={refreshStats}
          disabled={loading}
          className="p-2 text-blue-500 hover:text-blue-600 transition-colors disabled:opacity-50 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
          title="Refresh Statistics"
        >
          <FaSync className={`text-sm ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-xl bg-gradient-to-r ${stat.gradient} text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold">
                  {loading ? '...' : stat.value.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <stat.icon className="text-xl" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {statistics.recentProducts && statistics.recentProducts.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Recent Products
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {statistics.recentProducts.slice(0, 8).map((product, index) => (
              <motion.div
                key={product._id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-all duration-200 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 dark:text-gray-200 truncate">
                      {product.name || 'Unnamed Product'}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
                      ID: {product.productId}
                    </p>
                    {product.origin && (
                      <p className="text-gray-400 dark:text-gray-500 text-xs truncate">
                        📍 {product.origin}
                      </p>
                    )}
                    {product.updatedAt && (
                      <p className="text-gray-400 dark:text-gray-500 text-xs">
                        🕒 {new Date(product.updatedAt).toLocaleDateString()} {new Date(product.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    {product.stages && product.stages.length > 0 && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium">
                        {product.stages[product.stages.length - 1]}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {statistics.recentProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FaBox className="mx-auto text-2xl mb-2 opacity-50" />
              <p className="text-sm">No recent products found</p>
              <p className="text-xs">Products will appear here when you add them</p>
            </div>
          )}
        </div>
      )}

      {statistics.timestamp && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
          Last updated: {new Date(statistics.timestamp).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

export default StatisticsPanel;
