import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaQrcode, FaSpinner, FaBox } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const ProductSearch = ({ user }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('productId'); // 'productId' or 'certHash'
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const searchProduct = useCallback(async (query, type) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const apiConfig = await import('../utils/apiConfig');
      let apiUrl;
      
      if (type === 'certHash') {
        apiUrl = apiConfig.buildAPIURL(`/api/product/by-cert-hash/${encodeURIComponent(query)}`);
      } else {
        apiUrl = apiConfig.buildAPIURL(`/api/product/${encodeURIComponent(query)}`);
      }

      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const product = await response.json();
        setSearchResults([product]);
      } else if (response.status === 404) {
        setSearchResults([]);
        toast.error(`No product found with this ${type === 'certHash' ? 'certificate hash' : 'product ID'}`);
      } else {
        throw new Error(`Search failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      toast.error('Error searching for product');
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    await searchProduct(searchQuery, searchType);
  }, [searchQuery, searchType, searchProduct]);

  const handleProductSelect = useCallback((product) => {
    navigate(`/product/${product.productId}`);
  }, [navigate]);

  return (
    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-200/50 dark:border-cyan-500/30">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-cyan-100">
        Find Product
      </h2>
      
      {/* Search Type Selection */}
      <div className="mb-4">
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setSearchType('productId')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              searchType === 'productId'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Product ID
          </button>
          <button
            type="button"
            onClick={() => setSearchType('certHash')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              searchType === 'certHash'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Certificate Hash
          </button>
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Enter ${searchType === 'certHash' ? 'certificate hash' : 'product ID'}...`}
            className="w-full pl-10 pr-4 py-3 bg-white/70 dark:bg-gray-700/70 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-200"
            disabled={searchLoading}
          />
          {searchLoading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <FaSpinner className="animate-spin text-blue-500" />
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={!searchQuery.trim() || searchLoading}
          className="w-full mt-3 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
        >
          {searchLoading ? (
            <>
              <FaSpinner className="animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <FaSearch />
              Search Product
            </>
          )}
        </button>
      </form>

      {/* Search Results */}
      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            {searchResults.map((product) => (
              <div
                key={product.productId}
                onClick={() => handleProductSelect(product)}
                className="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                      {product.name || 'Unnamed Product'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      ID: {product.productId}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {product.manufacturer} • {product.origin}
                    </p>
                    {product.stages && product.stages.length > 0 && (
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                          {product.stages[product.stages.length - 1]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    {product.imageFile?.publicUrl ? (
                      <img
                        src={product.imageFile.publicUrl}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                        <FaBox className="text-gray-400 text-xl" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Scanner Alternative */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
        <button
          onClick={() => navigate('/scan')}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
        >
          <FaQrcode />
          Scan QR Code Instead
        </button>
      </div>
    </div>
  );
};

export default ProductSearch;
