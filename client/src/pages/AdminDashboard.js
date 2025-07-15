import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaEdit, 
  FaBoxOpen, 
  FaSearch, 
  FaEye, 
  FaPlusCircle, 
  FaQrcode, 
  FaFileAlt,
  FaSync,
  FaArrowLeft,
  FaCaretDown,
  FaChartBar
} from 'react-icons/fa';
import AnimatedCard from '../components/UI/AnimatedCard';
import GlowingButton from '../components/UI/GlowingButton';
import SkeletonLoader from '../components/UI/SkeletonLoader';
import FloatingCubeWrapper from '../components/3D/FloatingCubeWrapper';
import useRealTimeStats from '../hooks/useRealTimeStats';
import { buildAPIURL } from '../utils/apiConfig';

const PLACEHOLDER_IMG = 'https://via.placeholder.com/400x200?text=No+Image';

function isValidImage(url) {
  // If it's an object with publicUrl (Cloudinary or other storage)
  if (url && typeof url === 'object' && url.publicUrl) {
    return true;
  }
  
  // If it's a string URL
  return url && typeof url === 'string' && (url.startsWith('http') || url.startsWith('/'));
}

function getFullUrl(url) {
  // If it's an object with publicUrl (Cloudinary or other storage)
  if (url && typeof url === 'object' && url.publicUrl) {
    return url.publicUrl;
  }
  
  // If it's a string URL
  if (url && typeof url === 'string') {
    // Use API config utility for resolving file URLs
    const { resolveFileURL } = require('../utils/apiConfig');
    return resolveFileURL(url);
  }
  
  return PLACEHOLDER_IMG;
}

function AdminDashboard() {
  // Real-time statistics
  const { statistics, loading: statsLoading, refreshStats } = useRealTimeStats(8000);
  
  const [myProducts, setMyProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-products'); // 'my-products' or 'all-products'
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyProducts();
    fetchAllProducts();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [myProducts, allProducts, searchQuery, selectedStage, sortBy, activeTab]);

  const fetchMyProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Fetching my products with token:', token ? 'Present' : 'Missing');
      
      const res = await fetch(buildAPIURL('/api/my-products'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🔍 My products response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('🔍 My products data received:', data);
        console.log('🔍 My products count:', data.length);
        setMyProducts(data);
      } else {
        const errorText = await res.text();
        console.error('❌ Failed to fetch my products:', res.status, errorText);
      }
    } catch (error) {
      console.error('❌ Error fetching my products:', error);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const res = await fetch(buildAPIURL('/api/products'));
      const data = await res.json();
      setAllProducts(data);
    } catch (error) {
      console.error('Error fetching all products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    const currentProducts = activeTab === 'my-products' ? myProducts : allProducts;
    
    console.log('🔍 Filtering products:', {
      activeTab,
      myProductsCount: myProducts.length,
      allProductsCount: allProducts.length,
      currentProductsCount: currentProducts.length,
      searchQuery,
      selectedStage
    });
    
    let filtered = currentProducts.filter(product => {
      const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.productId?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStage = !selectedStage || 
                          (product.stages && product.stages.includes(selectedStage));
      
      return matchesSearch && matchesStage;
    });

    console.log('🔍 Filtered products count:', filtered.length);

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'id':
          return (a.productId || '').localeCompare(b.productId || '');
        case 'stage':
          const aStage = a.stages && a.stages.length > 0 ? a.stages[a.stages.length - 1] : '';
          const bStage = b.stages && b.stages.length > 0 ? b.stages[b.stages.length - 1] : '';
          return aStage.localeCompare(bStage);
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  };

  const getStageColor = (stage) => {
    const stageColors = {
      'Harvested': 'from-green-500 to-green-600',
      'Processed': 'from-yellow-500 to-yellow-600',
      'Packaged': 'from-blue-500 to-blue-600',
      'Shipped': 'from-purple-500 to-purple-600',
      'Delivered': 'from-cyan-500 to-cyan-600',
      'Sold': 'from-red-500 to-red-600',
    };
    return stageColors[stage] || 'from-gray-500 to-gray-600';
  };

  // Get current products based on active tab
  const currentProducts = activeTab === 'my-products' ? myProducts : allProducts;
  
  const uniqueStages = [...new Set(currentProducts.flatMap(p => p.stages || []))];

  if (loading) {
    return (
      <div className="min-h-screen transition-all duration-300
        bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 
        dark:bg-gradient-to-br dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaChartBar className="text-white text-2xl" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
              Loading Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Fetching products data...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mt-4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-all duration-300
      bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 
      dark:bg-gradient-to-br dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <GlowingButton
                  onClick={() => navigate('/')}
                  variant="secondary"
                  className="p-3"
                  glowColor="blue"
                >
                  <FaArrowLeft className="w-4 h-4" />
                </GlowingButton>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Admin Dashboard
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Manage your products and track their lifecycle
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <FloatingCubeWrapper size={0.8} className="w-20 h-20" />
                </div>
              </div>
            </div>

            {/* Real-time Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <AnimatedCard className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50 border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">My Products</p>
                    <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">
                      {myProducts.length}
                    </p>
                    <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                      Products I registered
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FaBoxOpen className="text-white text-xl" />
                  </div>
                </div>
              </AnimatedCard>
              
              <AnimatedCard className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/50 dark:to-green-800/50 border-green-200 dark:border-green-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Scans</p>
                    <p className="text-3xl font-bold text-green-800 dark:text-green-200">
                      {statistics.totalScans}
                    </p>
                    <p className="text-xs text-green-500 dark:text-green-400 mt-1">
                      QR code scans
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FaEye className="text-white text-xl" />
                  </div>
                </div>
              </AnimatedCard>
              
              <AnimatedCard className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/50 dark:to-purple-800/50 border-purple-200 dark:border-purple-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Total Updates</p>
                    <p className="text-3xl font-bold text-purple-800 dark:text-purple-200">
                      {statistics.totalUpdates}
                    </p>
                    <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">
                      Stage updates
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FaEdit className="text-white text-xl" />
                  </div>
                </div>
              </AnimatedCard>
              
              <AnimatedCard className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/50 dark:to-orange-800/50 border-orange-200 dark:border-orange-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">All Products</p>
                    <p className="text-3xl font-bold text-orange-800 dark:text-orange-200">
                      {allProducts.length}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-orange-500 dark:text-orange-400">
                        Total in system
                      </p>
                      <button
                        onClick={refreshStats}
                        disabled={statsLoading}
                        className="text-orange-500 hover:text-orange-600 disabled:opacity-50 transition-colors"
                        title="Refresh Statistics"
                      >
                        <FaSync className={`text-xs ${statsLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FaQrcode className="text-white text-xl" />
                  </div>
                </div>
              </AnimatedCard>
            </div>
          </motion.div>

          {/* Tab System */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <div className="flex space-x-1 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-lg p-1">
              <button
                onClick={() => setActiveTab('my-products')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'my-products'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                My Products ({myProducts.length})
              </button>
              <button
                onClick={() => setActiveTab('all-products')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'all-products'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                All Products ({allProducts.length})
              </button>
            </div>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <AnimatedCard className="p-4 sm:p-6">
              <div className="flex flex-col gap-4">
                {/* Search and Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                    />
                  </div>
                  
                  {/* Stage Filter */}
                  <div className="relative">
                    <select
                      value={selectedStage}
                      onChange={(e) => setSelectedStage(e.target.value)}
                      className="w-full pl-3 pr-8 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm appearance-none"
                    >
                      <option value="">All Stages</option>
                      {uniqueStages.map(stage => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <FaCaretDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  
                  {/* Sort */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full pl-3 pr-8 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm appearance-none"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="id">Sort by ID</option>
                      <option value="stage">Sort by Stage</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <FaCaretDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Add Product Button - Always Visible */}
                <div className="flex justify-end">
                  <GlowingButton
                    onClick={() => navigate('/admin/add')}
                    className="w-full sm:w-auto px-6 py-3 font-semibold text-base sm:text-lg"
                    glowColor="green"
                  >
                    <FaPlusCircle className="mr-2" />
                    Add Product
                  </GlowingButton>
                </div>
              </div>
            </AnimatedCard>
          </motion.div>

          {/* Products Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {loading ? (
              // Skeleton loader for products
              <SkeletonLoader type="grid" count={6} />
            ) : filteredProducts.length === 0 ? (
              <AnimatedCard className="p-8 sm:p-12 text-center">
                <FaBoxOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchQuery || selectedStage ? 'Try adjusting your search or filters' : 
                   activeTab === 'my-products' ? 
                   `You have ${myProducts.length} products but they don't match the current filters` : 
                   'Start by adding your first product'}
                </p>
                <GlowingButton
                  onClick={() => navigate('/admin/add')}
                  className="w-full sm:w-auto px-6 py-3 font-semibold text-base sm:text-lg"
                  glowColor="blue"
                >
                  <FaPlusCircle className="mr-2" />
                  Add Product
                </GlowingButton>
              </AnimatedCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.productId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="group"
                  >
                    <AnimatedCard className="overflow-hidden h-full flex flex-col">
                      <div className="relative">
                        {/* Product Image */}
                        <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center overflow-hidden">
                          {isValidImage(product.imageFile) ? (
                            <img
                              src={getFullUrl(product.imageFile)}
                              alt={product.name}
                              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = PLACEHOLDER_IMG;
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-gray-400">
                              <FaBoxOpen className="text-4xl mb-2" />
                              <span className="text-sm">No Image</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Stage Badge */}
                        <div className="absolute top-2 right-2">
                          {product.stages && product.stages.length > 0 ? (
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${getStageColor(product.stages[product.stages.length - 1])}`}>
                              {product.stages[product.stages.length - 1]}
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-gray-500 bg-gray-200 dark:bg-gray-700">
                              No Status
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-4 sm:p-6 flex flex-col flex-grow">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 truncate">
                          {product.name}
                        </h3>
                        
                        <div className="space-y-2 mb-4 flex-grow">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <FaQrcode className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="font-mono truncate">{product.productId}</span>
                          </div>
                          
                          {product.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                        </div>
                        
                        {/* Certificate Link */}
                        {product.certFile && (
                          <div className="mb-4">
                            <a
                              href={getFullUrl(product.certFile)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FaFileAlt className="w-4 h-4 mr-1" />
                              View Certificate
                            </a>
                          </div>
                        )}
                        
                        {/* Action Button - Always Visible */}
                        <div className="sticky bottom-0 left-0 right-0 pt-4 mt-auto">
                          <GlowingButton
                            onClick={() => navigate(`/product/${product.productId}`)}
                            className="w-full py-3 font-semibold text-base sm:text-lg"
                            glowColor="blue"
                          >
                            <FaEye className="mr-2" />
                            View Details
                          </GlowingButton>
                        </div>
                      </div>
                    </AnimatedCard>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;