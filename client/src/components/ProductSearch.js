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
    <div className="cyber-glass rounded-2xl shadow-xl p-6">
      <h2 className="text-2xl font-bold mb-6 text-white">
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
                ? 'bg-purple-500/80 text-white shadow-lg'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
            }`}
          >
            Product ID
          </button>
          <button
            type="button"
            onClick={() => setSearchType('certHash')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              searchType === 'certHash'
                ? 'bg-purple-500/80 text-white shadow-lg'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
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
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200 text-slate-100 placeholder-slate-400"
            disabled={searchLoading}
          />
          {searchLoading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <FaSpinner className="animate-spin text-purple-300" />
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={!searchQuery.trim() || searchLoading}
          className="w-full mt-3 py-3 bg-gradient-to-r from-[#A855F7] to-[#2DD4BF] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
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
                className="bg-white/5 rounded-xl p-4 shadow-md hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-shadow cursor-pointer border border-white/10"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">
                      {product.name || 'Unnamed Product'}
                    </h3>
                    <p className="text-sm text-slate-300 mb-1">
                      ID: {product.productId}
                    </p>
                    <p className="text-xs text-slate-500">
                      {product.manufacturer} • {product.origin}
                    </p>
                    {product.stages && product.stages.length > 0 && (
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-teal-400/10 border border-teal-300/30 text-teal-200 rounded-full">
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
                      <div className="w-16 h-16 bg-[#252131] rounded-lg flex items-center justify-center">
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
      <div className="mt-6 pt-6 border-t border-white/10">
        <button
          onClick={() => navigate('/scan')}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-teal-400 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
        >
          <FaQrcode />
          Scan QR Code Instead
        </button>
      </div>
    </div>
  );
};

export default ProductSearch;
