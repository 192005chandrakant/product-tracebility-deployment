import React from 'react';
import { motion } from 'framer-motion';
import { FaChartBar, FaEye, FaEdit, FaBox, FaSync } from 'react-icons/fa';
import useRealTimeStats from '../../hooks/useRealTimeStats';

const statCardsConfig = [
  {
    title: 'Total Products',
    key: 'totalProducts',
    icon: FaBox,
    gradient: 'from-[#A855F7] via-purple-500 to-fuchsia-500',
    accent: 'text-purple-100'
  },
  {
    title: 'Total Scans',
    key: 'totalScans',
    icon: FaEye,
    gradient: 'from-[#2DD4BF] via-teal-500 to-cyan-500',
    accent: 'text-teal-50'
  },
  {
    title: 'Total Updates',
    key: 'totalUpdates',
    icon: FaEdit,
    gradient: 'from-violet-500 via-[#A855F7] to-[#2DD4BF]',
    accent: 'text-purple-100'
  }
];

const StatisticsPanel = ({ className = '', refreshInterval = 10000 }) => {
  const { statistics, loading, error, refreshStats } = useRealTimeStats(refreshInterval);

  if (error) {
    return (
      <div className={`cyber-glass rounded-2xl border border-rose-300/30 bg-rose-500/10 p-4 ${className}`}>
        <p className="text-sm text-rose-700 dark:text-rose-300">Unable to load statistics</p>
      </div>
    );
  }

  const statCards = statCardsConfig.map((item) => ({
    ...item,
    value: statistics[item.key] || 0
  }));

  return (
    <div className={`cyber-glass rounded-3xl border border-white/10 p-5 sm:p-6 ${className}`}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-r from-[#A855F7] to-[#2DD4BF] shadow-[0_0_24px_rgba(168,85,247,0.22)]">
            <FaChartBar className="text-sm text-white" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Realtime</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-200">Live Statistics</h3>
          </div>
        </div>
        <button
          onClick={refreshStats}
          disabled={loading}
          className="interactive-lift rounded-2xl border border-white/10 bg-white/10 p-2.5 text-purple-600 transition-all hover:bg-white/15 disabled:opacity-50 dark:text-purple-300"
          title="Refresh Statistics"
        >
          <FaSync className={`text-sm ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`interactive-lift rounded-3xl bg-gradient-to-br ${stat.gradient} p-5 text-white shadow-[0_18px_45px_rgba(15,23,42,0.28)] transition-all duration-300`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium opacity-90 ${stat.accent}`}>{stat.title}</p>
                <p className="text-2xl font-bold">{loading ? '...' : stat.value.toLocaleString()}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <stat.icon className="text-xl" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {statistics.recentProducts && statistics.recentProducts.length > 0 && (
        <div className="mt-6">
          <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-200">
            <div className="h-2 w-2 rounded-full bg-[#2DD4BF] animate-pulse"></div>
            Recent Products
          </h4>
          <div className="custom-scrollbar max-h-48 space-y-2 overflow-y-auto">
            {statistics.recentProducts.slice(0, 8).map((product, index) => (
              <motion.div
                key={product._id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="interactive-lift rounded-2xl border border-slate-200/70 bg-white/60 p-3 text-sm transition-all duration-200 hover:border-purple-300/40 dark:border-white/10 dark:bg-white/5 dark:hover:border-purple-300/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900 dark:text-slate-200">
                      {product.name || 'Unnamed Product'}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">ID: {product.productId}</p>
                    {product.origin ? (
                      <p className="truncate text-xs text-slate-400 dark:text-slate-500">Location: {product.origin}</p>
                    ) : null}
                    {product.updatedAt ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Updated: {new Date(product.updatedAt).toLocaleDateString()} {new Date(product.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="h-2 w-2 rounded-full bg-[#2DD4BF] animate-pulse"></div>
                    {product.stages && product.stages.length > 0 ? (
                      <span className="rounded-full border border-purple-300/30 bg-purple-500/15 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-500/20 dark:text-purple-200">
                        {product.stages[product.stages.length - 1]}
                      </span>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {statistics.timestamp ? (
        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          Last updated: {new Date(statistics.timestamp).toLocaleTimeString()}
        </p>
      ) : null}
    </div>
  );
};

export default StatisticsPanel;
