import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaQrcode, FaEye, FaPlus, FaHistory, FaShieldAlt, FaGlobe, FaChartLine } from 'react-icons/fa';
import Scene3D from '../components/3D/Scene3D';
import AnimatedCard from '../components/UI/AnimatedCard';
import GlowingButton from '../components/UI/GlowingButton';
import ParticleBackground from '../components/UI/ParticleBackground';

function Home() {
  const navigate = useNavigate();
  const [productId, setProductId] = useState('');
  const [certHash, setCertHash] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Dashboard for logged-in users
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        <ParticleBackground count={60} />
        <ToastContainer position="top-center" theme="dark" />
        
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 text-white leading-tight">
              Welcome back, 
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent block mt-2">
                {user.email ? user.email.split('@')[0] : 'User'}!
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Ready to manage your product traceability with blockchain technology?
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
              <div className="p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FaQrcode className="text-white text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Scan QR Code</h3>
                <p className="text-gray-300">Quickly verify product authenticity</p>
              </div>
            </AnimatedCard>

            {user && user.role === 'producer' && (
              <AnimatedCard
                delay={0.2}
                className="group cursor-pointer"
                onClick={() => navigate('/admin/add')}
              >
                <div className="p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <FaPlus className="text-white text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Add Product</h3>
                  <p className="text-gray-300">Register new products on blockchain</p>
                </div>
              </AnimatedCard>
            )}

            <AnimatedCard
              delay={0.3}
              className="group cursor-pointer"
              onClick={() => navigate('/admin/dashboard')}
            >
              <div className="p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FaChartLine className="text-white text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Dashboard</h3>
                <p className="text-gray-300">View analytics and insights</p>
              </div>
            </AnimatedCard>
          </div>

          {/* Product Search Section */}
          <AnimatedCard delay={0.4} className="max-w-2xl mx-auto mb-12">
            <div className="p-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl">
              <h2 className="text-2xl font-bold text-center mb-6 text-white">
                Search Product by ID
              </h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  className="flex-1 px-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-300"
                  type="text"
                  placeholder="Enter Product ID"
                  value={productId}
                  onChange={e => setProductId(e.target.value)}
                />
                <GlowingButton
                  variant="primary"
                  onClick={() => {
                    if (productId) {
                      navigate(`/product/${productId}`);
                    } else {
                      toast.error('Please enter a Product ID');
                    }
                  }}
                >
                  <FaEye className="mr-2" />
                  View Details
                </GlowingButton>
              </div>
            </div>
          </AnimatedCard>

          {/* Certification Hash Search */}
          <AnimatedCard delay={0.5} className="max-w-2xl mx-auto">
            <div className="p-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl">
              <h2 className="text-2xl font-bold text-center mb-6 text-white">
                Search by Certification Hash
              </h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  className="flex-1 px-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-300"
                  type="text"
                  placeholder="Enter Certification Hash"
                  value={certHash}
                  onChange={e => setCertHash(e.target.value)}
                />
                <GlowingButton
                  variant="secondary"
                  onClick={async () => {
                    if (!certHash) {
                      toast.error('Please enter a Certification Hash');
                      return;
                    }
                    try {
                      const res = await fetch(`/api/product/by-cert-hash/${certHash}`);
                      if (!res.ok) throw new Error('Product not found');
                      const data = await res.json();
                      if (data && data.productId) {
                        navigate(`/product/${data.productId}`);
                      } else {
                        toast.error('Product not found');
                      }
                    } catch (err) {
                      toast.error('Product not found');
                    }
                  }}
                >
                  <FaShieldAlt className="mr-2" />
                  Verify
                </GlowingButton>
              </div>
            </div>
          </AnimatedCard>
        </div>
      </div>
    );
              >
                <FaEye />
                View
              </motion.button>
            </div>
          </div>
          {/* Certification Hash Search */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-white/20 dark:border-gray-700/30">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6 text-gray-900 dark:text-gray-100">
              Search Product by Certification Hash
            </h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                className="flex-1 px-4 py-2 sm:py-3 rounded-xl bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                type="text"
                placeholder="Enter Certification Hash"
                value={certHash}
                onChange={e => setCertHash(e.target.value)}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 flex items-center gap-2 text-base"
                onClick={async () => {
                  if (!certHash) {
                    toast.error('Please enter a Certification Hash');
                    return;
                  }
                  try {
                    const res = await fetch(`/api/product/by-cert-hash/${certHash}`);
                    if (!res.ok) throw new Error('Product not found');
                    const data = await res.json();
                    if (data && data.productId) {
                      navigate(`/product/${data.productId}`);
                    } else {
                      toast.error('Product not found');
                    }
                  } catch (err) {
                    toast.error('Product not found');
                  }
                }}
              >
                <FaEye />
                View
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Landing page for non-logged-in users
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <ToastContainer position="top-center" />
      
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-4xl mx-auto"
      >
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          Product Traceability
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
          Blockchain-powered transparency for every product journey
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-base sm:text-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 flex items-center justify-center gap-2"
            onClick={() => navigate('/auth/login')}
          >
            Get Started
          </motion.button>
          <a
            href="/scan"
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl border border-blue-400 text-blue-500 font-semibold bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            style={{ textDecoration: 'none' }}
          >
            <FaQrcode className="text-lg" />
            Try QR Scan
          </a>
        </div>
      </motion.div>
    </div>
  );
}

export default Home;