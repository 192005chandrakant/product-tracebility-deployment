import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import { useNavigate } from 'react-router-dom';
import { FaPlusCircle, FaBoxOpen, FaFileAlt } from 'react-icons/fa';

const PLACEHOLDER_IMG = 'https://via.placeholder.com/400x200?text=No+Image';

function isValidImage(url) {
  // Basic check for a valid image URL
  return url && typeof url === 'string' && (url.startsWith('http') || url.startsWith('/'));
}

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // TODO: Add authentication and filtering
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 px-2 sm:px-4 md:px-8 py-4">
      <motion.div
        className="card p-4 sm:p-8 w-full max-w-6xl text-gray-900 dark:text-gray-100"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
          {products.map((p, idx) => (
            <motion.div
              key={p.productId}
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="group cursor-pointer rounded-2xl bg-white/90 dark:bg-gray-900/80 shadow-xl border border-blue-500/10 hover:border-blue-500/40 transition-all duration-300 overflow-hidden flex flex-col"
              onClick={() => navigate(`/product/${p.productId}`)}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              {/* Product Image */}
              <div className="h-36 sm:h-40 w-full bg-gradient-to-br from-blue-200 to-cyan-200 dark:from-blue-900 dark:to-cyan-900 flex items-center justify-center overflow-hidden">
                {isValidImage(p.imageFile) ? (
                  <img
                    src={p.imageFile}
                    alt={p.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    onError={e => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMG; }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full text-blue-400">
                    <FaBoxOpen className="text-5xl mb-2" />
                    <span className="text-xs">No Image</span>
                  </div>
                )}
              </div>
              {/* Card Content */}
              <div className="flex-1 flex flex-col p-4 sm:p-5">
                <h3 className="text-xl sm:text-2xl font-bold mb-1 text-gray-900 dark:text-gray-100 truncate">{p.name}</h3>
                <div className="mb-1 text-gray-700 dark:text-gray-300 text-xs sm:text-sm">Product ID: <span className="font-mono text-blue-600 dark:text-blue-400">{p.productId}</span></div>
                <div className="mb-2 text-gray-700 dark:text-gray-300 text-xs sm:text-sm flex items-center gap-2">
                  Status:
                  {p.stages && p.stages.length > 0 ? (
                    <span className="inline-block px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                      {p.stages[p.stages.length-1]}
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-500 text-xs font-semibold">No Status</span>
                  )}
                </div>
                {p.description && (
                  <div className="mb-2 text-gray-600 dark:text-gray-400 text-xs line-clamp-2">{p.description}</div>
                )}
                {/* Certificate Link */}
                {p.certFile && (
                  <div className="mb-2 flex items-center gap-2">
                    <FaFileAlt className="text-blue-500" />
                    <a
                      href={p.certFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 underline text-xs hover:text-blue-800"
                      onClick={e => e.stopPropagation()}
                    >
                      View Certificate
                    </a>
                  </div>
                )}
                <div className="mt-auto pt-2">
                  <button
                    className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold flex items-center justify-center gap-2 group-hover:from-blue-600 group-hover:to-cyan-600 transition-all duration-200 text-sm sm:text-base"
                    onClick={e => { e.stopPropagation(); navigate(`/product/${p.productId}`); }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-center mt-10">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary w-full sm:w-auto sm:min-w-[220px] px-8 py-3 text-base sm:text-lg btn-icon"
            onClick={() => navigate('/add-product')}
          >
            <FaPlusCircle />
            Add Product
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

export default AdminDashboard; 