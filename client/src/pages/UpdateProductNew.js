import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { 
  FaEdit, 
  FaTimes, 
  FaBox, 
  FaSearch, 
  FaCheck, 
  FaSpinner,
  FaUpload,
  FaFileAlt,
  FaImage,
  FaChartBar,
  FaCube,
  FaEye,
  FaHistory,
  FaArrowLeft,
  FaRefresh,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import ParticleBackground from '../components/UI/ParticleBackground';
import GlowingButton from '../components/UI/GlowingButton';
import AnimatedCard from '../components/UI/AnimatedCard';
import Scene3D from '../components/3D/Scene3D';
import FloatingCubeWrapper from '../components/3D/FloatingCubeWrapper';
import { buildAPIURL } from '../utils/apiConfig';

const STAGE_OPTIONS = [
  { value: 'Harvested', label: 'Harvested', color: 'from-green-500 to-green-600', icon: FaBox },
  { value: 'Processed', label: 'Processed', color: 'from-yellow-500 to-yellow-600', icon: FaCube },
  { value: 'Packaged', label: 'Packaged', color: 'from-blue-500 to-blue-600', icon: FaBox },
  { value: 'Shipped', label: 'Shipped', color: 'from-purple-500 to-purple-600', icon: FaArrowLeft },
  { value: 'Delivered', label: 'Delivered', color: 'from-cyan-500 to-cyan-600', icon: FaCheckCircle },
  { value: 'Sold', label: 'Sold', color: 'from-red-500 to-red-600', icon: FaCheck },
];

// Utility function for debouncing
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

function UpdateProduct() {
  // Main state
  const [productId, setProductId] = useState('');
  const [stage, setStage] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Product search and details
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // File uploads
  const [uploadFiles, setUploadFiles] = useState({
    certificate: null,
    image: null
  });
  const [uploadPreviews, setUploadPreviews] = useState({
    certificate: null,
    image: null
  });
  
  // Statistics
  const [statistics, setStatistics] = useState({
    totalProducts: 0,
    totalScans: 0,
    totalUpdates: 0,
    recentUpdates: []
  });
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Stage history
  const [stageHistory, setStageHistory] = useState([]);
  
  const navigate = useNavigate();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Load statistics on component mount
  useEffect(() => {
    loadStatistics();
  }, []);

  // Search products when search query changes
  useEffect(() => {
    if (debouncedSearchQuery) {
      searchProducts(debouncedSearchQuery);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery]);

  // Load user statistics
  const loadStatistics = useCallback(async () => {
    setStatsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL('/api/profile'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatistics({
          totalProducts: data.stats?.totalProducts || 0,
          totalScans: data.stats?.scannedProducts || 0,
          totalUpdates: data.stats?.totalUpdates || 0,
          recentUpdates: data.stats?.recentProducts || []
        });
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Search products by ID or name
  const searchProducts = useCallback(async (query) => {
    if (!query.trim()) return;
    
    setSearchLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL('/api/products'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const products = await response.json();
        const filtered = products.filter(product => 
          product.productId?.toLowerCase().includes(query.toLowerCase()) ||
          product.name?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5); // Limit to 5 results for performance
        
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      toast.error('Error searching products');
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Select a product from search results
  const selectProduct = useCallback((product) => {
    setSelectedProduct(product);
    setProductId(product.productId);
    setSearchQuery(product.productId);
    setSearchResults([]);
    setStageHistory(product.stages || []);
  }, []);

  // Handle file uploads
  const handleFileUpload = useCallback((type, file) => {
    if (!file) return;
    
    setUploadFiles(prev => ({ ...prev, [type]: file }));
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadPreviews(prev => ({ ...prev, [type]: e.target.result }));
      };
      reader.readAsDataURL(file);
    } else {
      setUploadPreviews(prev => ({ ...prev, [type]: URL.createObjectURL(file) }));
    }
  }, []);

  // Remove uploaded file
  const removeFile = useCallback((type) => {
    setUploadFiles(prev => ({ ...prev, [type]: null }));
    setUploadPreviews(prev => ({ ...prev, [type]: null }));
  }, []);

  // Main update handler with file uploads
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!productId || !stage) {
      toast.error('Please fill in all required fields');
      return;
    }

    setMessage('');
    setLoading(true);
    setIsSuccess(false);
    
    try {
      const token = localStorage.getItem('token');
      
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('stage', stage);
      
      if (uploadFiles.certificate) {
        formData.append('certFile', uploadFiles.certificate);
      }
      if (uploadFiles.image) {
        formData.append('imageFile', uploadFiles.image);
      }
      
      const response = await fetch(buildAPIURL(`/api/update-product/${productId}`), {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`
          // Don't set Content-Type for FormData, let browser set it
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }
      
      const result = await response.json();
      
      setMessage('Product updated successfully!');
      setIsSuccess(true);
      toast.success('Product stage updated successfully!');
      
      // Update statistics
      loadStatistics();
      
      // Reset form after success
      setTimeout(() => {
        setProductId('');
        setStage('');
        setMessage('');
        setIsSuccess(false);
        setSelectedProduct(null);
        setSearchQuery('');
        setUploadFiles({ certificate: null, image: null });
        setUploadPreviews({ certificate: null, image: null });
        setStageHistory([]);
      }, 3000);
      
    } catch (error) {
      console.error('Update error:', error);
      setMessage(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedStage = useMemo(() => {
    return STAGE_OPTIONS.find(option => option.value === stage);
  }, [stage]);

  const getStageIcon = useCallback((stageName) => {
    const stageOption = STAGE_OPTIONS.find(opt => opt.value === stageName);
    return stageOption?.icon || FaBox;
  }, []);

  const getStageColor = useCallback((stageName) => {
    const stageOption = STAGE_OPTIONS.find(opt => opt.value === stageName);
    return stageOption?.color || 'from-gray-500 to-gray-600';
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Scene3D />
      </div>
      {/* Particle Background */}
      <ParticleBackground />
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-cyan-900/20 z-10"></div>
      <div className="relative z-20 min-h-screen p-4">
        <ToastContainer position="top-center" />
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 pt-8">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
                <FaEdit className="text-white text-4xl" />
              </div>
              <div className="absolute -top-3 -right-3">
                <FloatingCubeWrapper>
                  <mesh>
                    <boxGeometry args={[0.5, 0.5, 0.5]} />
                    <meshStandardMaterial color="#ff6b35" />
                  </mesh>
                </FloatingCubeWrapper>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Update Product
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
              Search for products, update stages, upload files, and track your progress with real-time statistics
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Statistics Panel */}
            <div className="lg:col-span-1">
              <AnimatedCard className="h-fit">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                      Statistics
                    </h3>
                    <button
                      onClick={loadStatistics}
                      disabled={statsLoading}
                      className="p-2 text-blue-500 hover:text-blue-600 transition-colors"
                    >
                      <FaRefresh className={statsLoading ? 'animate-spin' : ''} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm">Total Products</p>
                          <p className="text-2xl font-bold">{statistics.totalProducts}</p>
                        </div>
                        <FaBox className="text-3xl text-blue-200" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm">Total Scans</p>
                          <p className="text-2xl font-bold">{statistics.totalScans}</p>
                        </div>
                        <FaEye className="text-3xl text-green-200" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm">Total Updates</p>
                          <p className="text-2xl font-bold">{statistics.totalUpdates}</p>
                        </div>
                        <FaEdit className="text-3xl text-purple-200" />
                      </div>
                    </div>
                  </div>
                  {/* Recent Updates */}
                  {statistics.recentUpdates.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                        Recent Products
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {statistics.recentUpdates.slice(0, 5).map((product, index) => (
                          <div 
                            key={product._id || index}
                            className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-800 dark:text-gray-200">
                                  {product.name || product.productId}
                                </p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs">
                                  {product.productId}
                                </p>
                              </div>
                              <FaClock className="text-gray-400" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AnimatedCard>
            </div>
            {/* Main Update Form */}
            <div className="lg:col-span-2">
              <AnimatedCard>
                <div className="p-8">
                  <form onSubmit={handleUpdate} className="space-y-6">
                    {/* Product Search */}
                    <div className="space-y-4">
                      <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300">
                        Search Product
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FaSearch className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by Product ID or Name..."
                          className="w-full pl-12 pr-4 py-4 bg-white/70 dark:bg-gray-700/70 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent backdrop-blur-sm transition-all duration-200 text-lg"
                        />
                        {searchLoading && (
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                            <FaSpinner className="animate-spin text-orange-500" />
                          </div>
                        )}
                      </div>
                      {/* Search Results */}
                      <AnimatePresence>
                        {searchResults.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                          >
                            {searchResults.map((product) => (
                              <button
                                key={product._id}
                                type="button"
                                onClick={() => selectProduct(product)}
                                className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">
                                      {product.name}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      ID: {product.productId}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                      {product.origin} • {product.manufacturer}
                                    </p>
                                  </div>
                                  {product.stages && product.stages.length > 0 && (
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getStageColor(product.stages[product.stages.length - 1])} text-white`}>
                                      {product.stages[product.stages.length - 1]}
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {/* Selected Product Details */}
                    {selectedProduct && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                            Selected Product
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProduct(null);
                              setProductId('');
                              setSearchQuery('');
                              setStageHistory([]);
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <FaTimes />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Name:</p>
                            <p className="font-medium text-gray-800 dark:text-gray-200">{selectedProduct.name}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">ID:</p>
                            <p className="font-medium text-gray-800 dark:text-gray-200">{selectedProduct.productId}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Origin:</p>
                            <p className="font-medium text-gray-800 dark:text-gray-200">{selectedProduct.origin}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Manufacturer:</p>
                            <p className="font-medium text-gray-800 dark:text-gray-200">{selectedProduct.manufacturer}</p>
                          </div>
                        </div>
                        {/* Stage History */}
                        {stageHistory.length > 0 && (
                          <div className="mt-4">
                            <p className="text-gray-600 dark:text-gray-400 mb-2">Current Stages:</p>
                            <div className="flex flex-wrap gap-2">
                              {stageHistory.map((stageName, index) => {
                                const StageIcon = getStageIcon(stageName);
                                return (
                                  <div
                                    key={index}
                                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getStageColor(stageName)} text-white shadow-sm`}
                                  >
                                    <StageIcon className="w-3 h-3" />
                                    {stageName}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                    {/* Manual Product ID Input */}
                    {!selectedProduct && (
                      <div className="space-y-2">
                        <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300">
                          Or Enter Product ID Manually
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <FaBox className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                            placeholder="Enter product ID"
                            className="w-full pl-12 pr-4 py-4 bg-white/70 dark:bg-gray-700/70 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent backdrop-blur-sm transition-all duration-200 text-lg"
                            required
                          />
                        </div>
                      </div>
                    )}
                    {/* Stage Selection */}
                    <div className="space-y-4">
                      <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300">
                        New Stage
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {STAGE_OPTIONS.map((option) => {
                          const OptionIcon = option.icon;
                          return (
                            <motion.button
                              key={option.value}
                              type="button"
                              onClick={() => setStage(option.value)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                                stage === option.value
                                  ? `bg-gradient-to-r ${option.color} text-white border-transparent shadow-lg`
                                  : 'bg-white/70 dark:bg-gray-700/70 border-gray-300 dark:border-gray-600 hover:border-orange-400 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              <div className="flex items-center justify-center space-x-2">
                                <OptionIcon className="w-4 h-4" />
                                <span className="font-medium text-sm">{option.label}</span>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                    {/* Stage Preview */}
                    {selectedStage && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${selectedStage.color} flex items-center justify-center`}>
                            <selectedStage.icon className="text-white text-xl" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Selected Stage:</p>
                            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                              {selectedStage.label}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    {/* Success/Error Messages */}
                    <AnimatePresence>
                      {message && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className={`p-4 rounded-lg border-2 ${
                            isSuccess
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {isSuccess ? (
                              <FaCheckCircle className="text-green-600 dark:text-green-400 text-xl" />
                            ) : (
                              <FaExclamationTriangle className="text-red-600 dark:text-red-400 text-xl" />
                            )}
                            <span className={`font-medium ${
                              isSuccess 
                                ? 'text-green-800 dark:text-green-200' 
                                : 'text-red-800 dark:text-red-200'
                            }`}>
                              {message}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-6">
                      <GlowingButton
                        type="submit"
                        disabled={loading || !productId || !stage}
                        className="flex-1 py-4 font-semibold text-lg"
                        glowColor="green"
                      >
                        {loading ? (
                          <>
                            <FaSpinner className="mr-2 animate-spin" />
                            Updating Product...
                          </>
                        ) : (
                          <>
                            <FaEdit className="mr-2" />
                            Update Product
                          </>
                        )}
                      </GlowingButton>
                      <GlowingButton
                        type="button"
                        onClick={() => navigate(-1)}
                        variant="secondary"
                        className="flex-1 py-4 font-semibold text-lg"
                        glowColor="red"
                      >
                        <FaArrowLeft className="mr-2" />
                        Back
                      </GlowingButton>
                    </div>
                  </form>
                </div>
              </AnimatedCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpdateProduct;
