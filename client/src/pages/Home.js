import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaQrcode, FaEye, FaPlus, FaHistory, FaShieldAlt, FaGlobe, FaChartLine, FaBox, FaExclamationCircle } from 'react-icons/fa';
import Scene3D from '../components/3D/Scene3D';
import AnimatedCard from '../components/UI/AnimatedCard';
import GlowingButton from '../components/UI/GlowingButton';
import ParticleBackground from '../components/UI/ParticleBackground';
import StatisticsPanel from '../components/UI/StatisticsPanel';
import ProductSearch from '../components/ProductSearch';
import SkeletonLoader from '../components/UI/SkeletonLoader';

function Home() {
  const navigate = useNavigate();
  const [productId, setProductId] = useState('');
  const [certHash, setCertHash] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentProductsLoading, setRecentProductsLoading] = useState(false);
  const [recentProductsError, setRecentProductsError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        if (decoded && decoded.email && decoded.role) {
          setUser({ email: decoded.email, role: decoded.role });
        } else {
          console.error('Invalid token payload:', decoded);
          setUser(null);
        }
      } catch (error) {
        console.error('Error parsing token:', error);
        setUser(null);
        localStorage.removeItem('token');
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  // Fetch recent products when user logs in
  useEffect(() => {
    if (user) {
      fetchRecentProducts();
      
      // Set up a periodic refresh interval for recent products
      const refreshInterval = setInterval(fetchRecentProducts, 60000); // Refresh every minute
      
      return () => {
        clearInterval(refreshInterval); // Clean up on component unmount
      };
    }
  }, [user]);

  const fetchRecentProducts = async () => {
    setRecentProductsLoading(true);
    setRecentProductsError(null);
    try {
      console.log('Fetching recent products...');
      
      // Import the API config utility
      const apiConfig = await import('../utils/apiConfig');
      const apiUrl = apiConfig.buildAPIURL('/api/recent-products?limit=6');
      
      const response = await fetch(apiUrl);
      
      console.log('Response status:', response.status);
      console.log('Response OK:', response.ok);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recent products: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (Array.isArray(data)) {
        setRecentProducts(data);
        if (data.length === 0) {
          console.log('No recent products found in database');
        } else {
          console.log(`Retrieved ${data.length} recent products`);
        }
      } else {
        console.error('Unexpected response format:', data);
        setRecentProductsError('Unexpected response format from server');
      }
    } catch (error) {
      console.error('Error fetching recent products:', error);
      setRecentProductsError(error.message);
      
      // Try with API config as fallback
      try {
        console.log('Trying with API config...');
        const apiConfig = await import('../utils/apiConfig');
        const apiUrl = apiConfig.buildAPIURL('/api/recent-products?limit=6');
        console.log('API URL:', apiUrl);
        
        const fallbackResponse = await fetch(apiUrl);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setRecentProducts(fallbackData);
          setRecentProductsError(null);
          console.log('Fallback API call successful');
        }
      } catch (fallbackError) {
        console.error('Fallback API call also failed:', fallbackError);
      }
    } finally {
      setRecentProductsLoading(false);
    }
  };

  // Show loading state with consistent background
  if (loading) {
    return (
      <div className="min-h-screen transition-all duration-300
        bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 
        dark:bg-gradient-to-br dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard for logged-in users
  if (user) {
    return (
      <div className="min-h-screen relative overflow-hidden
        bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 
        dark:bg-gradient-to-br dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900
        transition-all duration-500">
        
        {/* Subtle Background Effects - Professional */}
        <div className="absolute inset-0 opacity-20 dark:opacity-30">
          <ParticleBackground count={30} />
        </div>
        
        {/* Professional grid background */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        
        <ToastContainer position="top-center" theme="auto" />
        
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section - Professional */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 leading-tight
              text-gray-900 dark:text-white">
              Welcome back, 
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 
                dark:from-blue-400 dark:to-indigo-400 
                bg-clip-text text-transparent block mt-2">
                {user.email ? user.email.split('@')[0] : 'User'}!
              </span>
            </h1>
            <p className="text-xl max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
              Manage your product traceability with enterprise-grade blockchain technology
            </p>
          </motion.div>

          {/* 3D Scene */}
          <div className="max-w-md mx-auto h-64 mb-12">
            <Scene3D variant="blockchain" />
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 max-w-6xl mx-auto">
            <AnimatedCard
              delay={0.1}
              className="group cursor-pointer"
              onClick={() => navigate('/scan')}
            >
              <div className="p-6 rounded-xl transition-all duration-300 shadow-lg 
                bg-white hover:bg-gray-50 border border-gray-200
                dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-600
                hover:shadow-xl transform hover:-translate-y-1">
                <div className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center 
                  bg-gradient-to-r from-blue-500 to-indigo-500 
                  group-hover:scale-105 transition-transform duration-300">
                  <FaQrcode className="text-white text-xl" />
                </div>
                <h3 className="text-xl font-semibold mb-2
                  text-gray-800 dark:text-white">Scan QR Code</h3>
                <p className="text-gray-600 dark:text-gray-300">Quickly verify product authenticity</p>
              </div>
            </AnimatedCard>

            {user && user.role === 'producer' && (
              <AnimatedCard
                delay={0.2}
                className="group cursor-pointer"
                onClick={() => navigate('/admin/add')}
              >
                <div className="p-6 rounded-xl transition-all duration-300 shadow-lg
                  bg-white hover:bg-gray-50 border border-gray-200
                  dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-600
                  hover:shadow-xl transform hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center
                    bg-gradient-to-r from-green-500 to-emerald-500
                    group-hover:scale-105 transition-transform duration-300">
                    <FaPlus className="text-white text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2
                    text-gray-800 dark:text-white">Add Product</h3>
                  <p className="text-gray-600 dark:text-gray-300">Register new products on blockchain</p>
                </div>
              </AnimatedCard>
            )}

            <AnimatedCard
              delay={0.3}
              className="group cursor-pointer"
              onClick={() => navigate('/admin/dashboard')}
            >
              <div className="p-6 rounded-xl transition-all duration-300 shadow-lg
                bg-white hover:bg-gray-50 border border-gray-200
                dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-600
                hover:shadow-xl transform hover:-translate-y-1">
                <div className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center
                  bg-gradient-to-r from-purple-500 to-pink-500
                  group-hover:scale-105 transition-transform duration-300">
                  <FaChartLine className="text-white text-xl" />
                </div>
                <h3 className="text-xl font-semibold mb-2
                  text-gray-800 dark:text-white">Dashboard</h3>
                <p className="text-gray-600 dark:text-gray-300">View analytics and insights</p>
              </div>
            </AnimatedCard>
          </div>

          {/* Real-time Statistics Panel for logged-in users */}
          <AnimatedCard delay={0.35} className="max-w-4xl mx-auto mb-12">
            <StatisticsPanel className="p-8" refreshInterval={8000} />
          </AnimatedCard>

          {/* Product Search Section */}
          <AnimatedCard delay={0.38} className="max-w-2xl mx-auto mb-12">
            <ProductSearch user={user} />
          </AnimatedCard>

          {/* Recent Products Section */}
          <AnimatedCard delay={0.42} className="max-w-6xl mx-auto mb-12">
            <div className="p-8 rounded-xl shadow-lg transition-all duration-300
              bg-white border border-gray-200
              dark:bg-slate-800 dark:border-slate-600">
              
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Recent Products
                </h2>
                <button 
                  onClick={fetchRecentProducts}
                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2 transition-colors"
                >
                  <span>Refresh</span>
                  <FaHistory className={recentProductsLoading ? "animate-spin" : ""} />
                </button>
              </div>

              {recentProductsError && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6 flex items-center gap-3">
                  <FaExclamationCircle />
                  <span>Error loading recent products: {recentProductsError}</span>
                </div>
              )}

              {recentProductsLoading ? (
                <SkeletonLoader type="grid" count={6} />
              ) : recentProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentProducts.map(product => (
                    <div 
                      key={product.productId || product._id}
                      className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 flex flex-col"
                    >
                      <div className="h-40 bg-gray-100 dark:bg-gray-700 relative">
                        {product.imageFile?.publicUrl ? (
                          <img 
                            src={product.imageFile.publicUrl} 
                            alt={product.name || 'Product'} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://via.placeholder.com/400x200?text=No+Image";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FaBox className="text-gray-400 text-4xl" />
                          </div>
                        )}
                        
                        {/* Stage badge */}
                        {product.stages && product.stages.length > 0 && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold py-1 px-2 rounded-full">
                            {product.stages[product.stages.length - 1] || product.stage || 'Created'}
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4 flex-grow">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1 truncate">
                          {product.name || "Unnamed Product"}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 truncate">
                          ID: {product.productId || product._id || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                          {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'Unknown date'}
                        </p>
                      </div>
                      
                      <div className="p-4 pt-0 mt-auto">
                        <button
                          onClick={() => navigate(`/product/${product.productId}`)}
                          className="w-full py-2 text-center bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <FaEye />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaBox className="text-gray-400 text-4xl mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No products found</p>
                  {user && user.role === 'producer' && (
                    <button
                      onClick={() => navigate('/admin/add')}
                      className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm inline-flex items-center gap-2"
                    >
                      <FaPlus />
                      <span>Add Your First Product</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </AnimatedCard>
        </div>
      </div>
    );
  }

  // Public landing for non-logged-in users
  return (
    <div className="min-h-screen relative overflow-hidden transition-all duration-1000
      bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100 
      dark:bg-gradient-to-br dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950">
      
      {/* Dynamic Particle Background */}
      <div className="absolute inset-0 opacity-40 dark:opacity-70 transition-opacity duration-1000">
        <ParticleBackground count={80} />
      </div>
      
      {/* Light Mode: Floating orbs */}
      <div className="absolute inset-0 opacity-30 dark:opacity-0 transition-opacity duration-1000">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-blue-200/50 to-purple-200/50 animate-pulse blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-gradient-to-r from-purple-200/50 to-pink-200/50 animate-pulse delay-1000 blur-2xl"></div>
        <div className="absolute top-1/2 right-1/3 w-32 h-32 rounded-full bg-gradient-to-r from-cyan-200/50 to-blue-200/50 animate-bounce blur-xl"></div>
      </div>
      
      {/* Dark Mode: Matrix-style rain effect */}
      <div className="absolute inset-0 opacity-0 dark:opacity-20 transition-opacity duration-1000 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 bg-gradient-to-b from-transparent via-cyan-400 to-transparent animate-pulse"
            style={{
              left: `${5 + i * 4}%`,
              height: '100%',
              animationDelay: `${i * 0.1}s`,
              animationDuration: '3s'
            }}
          ></div>
        ))}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-purple-900/10 to-transparent"></div>
      </div>
      
      <ToastContainer position="top-center" theme="auto" />
      
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="max-w-md mx-auto h-64 mb-8">
              <Scene3D variant="hero" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight
              text-gray-800 dark:text-transparent
              dark:bg-gradient-to-r dark:from-cyan-300 dark:via-purple-300 dark:to-pink-300 
              dark:bg-clip-text dark:animate-pulse">
              Welcome to 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 
                dark:from-cyan-400 dark:via-purple-400 dark:to-pink-400 
                bg-clip-text text-transparent block
                dark:drop-shadow-[0_0_30px_rgba(0,255,255,0.6)]
                dark:filter dark:brightness-125">
                TraceChain
              </span>
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto
              text-gray-600 dark:text-cyan-100 
              dark:drop-shadow-[0_0_10px_rgba(0,255,255,0.4)]">
              Experience transparent, secure product traceability powered by blockchain technology
            </p>
            
            {/* Dark mode exclusive holographic effect */}
            <div className="hidden dark:block absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                w-[800px] h-[800px] bg-gradient-conic from-cyan-500/20 via-purple-500/20 to-pink-500/20 
                rounded-full blur-3xl animate-spin" style={{ animationDuration: '20s' }}></div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <GlowingButton
              variant="primary"
              size="lg"
              onClick={() => {
                console.log('Get Started button clicked');
                navigate('/auth/login');
              }}
            >
              Get Started
            </GlowingButton>
            <GlowingButton
              variant="ghost"
              size="lg"
              onClick={() => {
                console.log('Scan QR Code button clicked');
                navigate('/scan');
              }}
            >
              <FaQrcode className="mr-2" />
              Scan QR Code
            </GlowingButton>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Home;
