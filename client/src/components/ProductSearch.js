import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaQrcode, FaSpinner, FaBox, FaFingerprint, FaArrowRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import GlowingButton from './UI/GlowingButton';

const ProductSearch = ({ user }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('productId');
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
      const apiUrl = type === 'certHash'
        ? apiConfig.buildAPIURL(`/api/product/by-cert-hash/${encodeURIComponent(query)}`)
        : apiConfig.buildAPIURL(`/api/product/${encodeURIComponent(query)}`);

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
    <div className="cyber-glass rounded-[28px] shadow-[0_18px_50px_rgba(15,23,42,0.12)] p-6">
      <div className="mb-6 flex items-start gap-4">
        <div className="panel-icon-shell">
          <FaSearch className="text-lg text-purple-500 dark:text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Find Product</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Search live product records by product ID or certificate hash, then jump straight into the trusted verification page.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSearchType('productId')}
          className={`segmented-chip ${searchType === 'productId' ? 'is-active' : ''}`}
        >
          <FaQrcode className="text-sm" />
          Product ID
        </button>
        <button
          type="button"
          onClick={() => setSearchType('certHash')}
          className={`segmented-chip ${searchType === 'certHash' ? 'is-active' : ''}`}
        >
          <FaFingerprint className="text-sm" />
          Certificate Hash
        </button>
      </div>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <FaSearch className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Enter ${searchType === 'certHash' ? 'certificate hash' : 'product ID'}...`}
            className="form-control w-full py-3.5 pl-11 pr-12"
            disabled={searchLoading}
          />
          {searchLoading && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-4">
              <FaSpinner className="animate-spin text-purple-400" />
            </div>
          )}
        </div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <GlowingButton
            type="submit"
            disabled={!searchQuery.trim() || searchLoading}
            className="flex-1"
            glowColor="purple"
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
          </GlowingButton>
          <GlowingButton
            type="button"
            variant="ghost"
            className="flex-1 sm:flex-none"
            onClick={() => navigate('/scan')}
          >
            <FaQrcode />
            Scan Instead
          </GlowingButton>
        </div>
      </form>

      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            {searchResults.map((product) => (
              <button
                key={product.productId}
                type="button"
                onClick={() => handleProductSelect(product)}
                className="interactive-lift w-full rounded-[22px] border border-white/10 bg-white/60 p-4 text-left shadow-sm transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.18)] dark:bg-white/5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {product.name || 'Unnamed Product'}
                      </h3>
                      {product.stages && product.stages.length > 0 ? (
                        <span className="inline-block rounded-full border border-teal-300/30 bg-teal-400/10 px-2 py-1 text-xs font-medium text-teal-700 dark:text-teal-200">
                          {product.stages[product.stages.length - 1]}
                        </span>
                      ) : null}
                    </div>
                    <p className="mb-1 text-sm text-slate-600 dark:text-slate-300">
                      ID: <span className="font-mono">{product.productId}</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {product.manufacturer} | {product.origin}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {product.imageFile?.publicUrl ? (
                      <img
                        src={product.imageFile.publicUrl}
                        alt={product.name}
                        className="h-16 w-16 rounded-xl object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[linear-gradient(135deg,rgba(168,85,247,0.18),rgba(45,212,191,0.12))]">
                        <FaBox className="text-slate-400 text-xl" />
                      </div>
                    )}
                    <FaArrowRight className="hidden text-slate-400 sm:block" />
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {searchResults.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/40 px-4 py-3 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-400">
          {user ? 'Search a product record or scan a QR code to inspect a live verification page.' : 'Use product ID or certificate hash lookup to preview trusted product records.'}
        </div>
      ) : null}
    </div>
  );
};

export default ProductSearch;
