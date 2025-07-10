import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FaUser, 
  FaEnvelope, 
  FaShieldAlt, 
  FaCalendarAlt, 
  FaEdit, 
  FaSave, 
  FaTimes,
  FaQrcode,
  FaHistory,
  FaChartLine,
  FaCog,
  FaBell,
  FaKey,
  FaGlobe,
  FaBuilding,
  FaMapMarkerAlt,
  FaPlus,
  FaArrowLeft,
  FaPhone,
  FaCamera,
  FaCheck,
  FaBox,
  FaEye,
  FaSearch,
  FaSync
} from 'react-icons/fa';
import { jwtDecode } from 'jwt-decode';
import ParticleBackground from '../components/UI/ParticleBackground';
import GlowingButton from '../components/UI/GlowingButton';
import AnimatedCard from '../components/UI/AnimatedCard';
import Scene3D from '../components/3D/Scene3D';
import FloatingCubeWrapper from '../components/3D/FloatingCubeWrapper';
import { buildAPIURL } from '../utils/apiConfig';

function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const userData = {
        email: decoded.email,
        role: decoded.role,
        id: decoded.id,
        createdAt: new Date(decoded.iat * 1000).toLocaleDateString(),
        lastLogin: new Date().toLocaleDateString(),
        fullName: decoded.email.split('@')[0],
        company: 'TraceChain Solutions',
        location: 'Global',
        phone: '+1 (555) 123-4567',
        bio: 'Blockchain enthusiast and product traceability expert.',
        productsAdded: 0,
        scansPerformed: 0,
        totalProducts: 0,
        recentActivity: []
      };
      setUser(userData);
      setEditForm(userData);
      fetchProducts();
      fetchUserStats();
    } catch (error) {
      console.error('Error decoding token:', error);
      navigate('/auth/login');
    }
  }, [navigate]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(buildAPIURL('/api/products'));
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        setUser(prev => ({ ...prev, totalProducts: data.length }));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const res = await fetch(buildAPIURL('/api/statistics'));
      if (res.ok) {
        const stats = await res.json();
        setUser(prev => ({
          ...prev,
          productsAdded: stats.totalProducts || 0,
          scansPerformed: stats.totalScans || 0,
          recentActivity: [
            { type: 'scan', product: 'Recent Activity', time: 'Loading...' }
          ]
        }));
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleSave = () => {
    setUser({ ...user, ...editForm });
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  const handleCancel = () => {
    setEditForm(user);
    setIsEditing(false);
  };

  const handleRefresh = () => {
    fetchProducts();
    fetchUserStats();
    toast.success('Data refreshed successfully!');
  };

  function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, 70%, 80%)`;
  }

  function getImageUrl(imageFile) {
    if (!imageFile) return null;
    
    // Handle Google Drive format
    if (typeof imageFile === 'object' && imageFile.publicUrl) {
      return imageFile.publicUrl;
    }
    
    // Handle legacy local file format
    if (typeof imageFile === 'string') {
      // Use API config utility for resolving file URLs
      const { resolveFileURL } = require('../utils/apiConfig');
      return resolveFileURL(imageFile);
    }
    
    return null;
  }

  if (!user) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Scene3D />
        </div>
        <ParticleBackground />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-cyan-900/20 z-10"></div>
        
        <div className="relative z-20 min-h-screen flex items-center justify-center p-4">
          <AnimatedCard className="max-w-md w-full">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaUser className="text-white text-2xl" />
              </div>
              <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Access Denied
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                You must be logged in to view your profile.
              </p>
              <GlowingButton
                onClick={() => navigate('/auth/login')}
                className="w-full py-3 font-semibold"
                glowColor="blue"
              >
                Go to Login
              </GlowingButton>
            </div>
          </AnimatedCard>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaUser },
    { id: 'activity', label: 'Activity', icon: FaHistory },
    { id: 'products', label: 'Products', icon: FaQrcode },
    { id: 'settings', label: 'Settings', icon: FaCog }
  ];

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
      
      <div className="relative z-20 min-h-screen">
        <ToastContainer position="top-center" />
        
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
                    User Profile
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Manage your profile and track your products
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <GlowingButton
                  onClick={handleRefresh}
                  variant="secondary"
                  className="p-3"
                  glowColor="green"
                  disabled={loading}
                >
                  <FaSync className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </GlowingButton>
                <GlowingButton
                  onClick={() => navigate('/admin')}
                  className="px-4 py-2 font-semibold"
                  glowColor="purple"
                >
                  <FaChartLine className="mr-2" />
                  Dashboard
                </GlowingButton>
              </div>
            </div>
          </motion.div>

          {/* Mobile Tab Navigation */}
          <div className="sm:hidden mb-6">
            <AnimatedCard className="p-2">
              <div className="flex overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 flex flex-col items-center space-y-1 py-3 px-4 min-w-[80px] rounded-lg font-medium text-xs transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </AnimatedCard>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="xl:col-span-1 order-2 xl:order-1"
            >
              <AnimatedCard className="overflow-hidden">
                <div className="relative">
                  {/* Profile Background */}
                  <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute top-2 right-2">
                      <FloatingCubeWrapper size={0.3} className="w-8 h-8" />
                    </div>
                  </div>
                  
                  {/* Profile Picture */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                    <div className="relative">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg border-4 border-white dark:border-gray-800"
                        style={{ background: stringToColor(user.email) }}
                      >
                        {user.fullName[0].toUpperCase()}
                      </div>
                      {isEditing && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-600 transition-colors"
                        >
                          <FaCamera className="w-3 h-3" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="pt-12 pb-6 px-6 text-center">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.fullName}
                        onChange={(e) => setEditForm({...editForm, fullName: e.target.value})}
                        className="text-center bg-transparent border-b border-blue-500 focus:outline-none w-full text-xl font-bold"
                      />
                    ) : (
                      user.fullName
                    )}
                  </h2>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-1 capitalize">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.role}
                        onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                        className="text-center bg-transparent border-b border-blue-500 focus:outline-none capitalize w-full"
                      />
                    ) : (
                      user.role
                    )}
                  </p>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                    Member since {user.createdAt}
                  </p>

                  {/* Edit Button */}
                  <div className="flex justify-center">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <GlowingButton
                          onClick={handleSave}
                          className="px-4 py-2 text-sm font-semibold"
                          glowColor="green"
                        >
                          <FaCheck className="mr-2" />
                          Save
                        </GlowingButton>
                        <GlowingButton
                          onClick={handleCancel}
                          variant="secondary"
                          className="px-4 py-2 text-sm font-semibold"
                          glowColor="red"
                        >
                          <FaTimes className="mr-2" />
                          Cancel
                        </GlowingButton>
                      </div>
                    ) : (
                      <GlowingButton
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 text-sm font-semibold"
                        glowColor="blue"
                      >
                        <FaEdit className="mr-2" />
                        Edit Profile
                      </GlowingButton>
                    )}
                  </div>
                </div>

                {/* Contact Details */}
                <div className="px-6 pb-6 space-y-4">
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Contact Information</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <FaEnvelope className="w-4 h-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {isEditing ? (
                              <input
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                className="w-full bg-transparent border-b border-blue-500 focus:outline-none text-sm"
                              />
                            ) : (
                              user.email
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <FaPhone className="w-4 h-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {isEditing ? (
                              <input
                                type="tel"
                                value={editForm.phone}
                                onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                                className="w-full bg-transparent border-b border-blue-500 focus:outline-none text-sm"
                              />
                            ) : (
                              user.phone
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <FaBuilding className="w-4 h-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Company</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.company}
                                onChange={(e) => setEditForm({...editForm, company: e.target.value})}
                                className="w-full bg-transparent border-b border-blue-500 focus:outline-none text-sm"
                              />
                            ) : (
                              user.company
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <FaMapMarkerAlt className="w-4 h-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.location}
                                onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                                className="w-full bg-transparent border-b border-blue-500 focus:outline-none text-sm"
                              />
                            ) : (
                              user.location
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Bio</h3>
                    {isEditing ? (
                      <textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                        className="w-full bg-white/50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm backdrop-blur-sm"
                        rows="3"
                        placeholder="Tell us about yourself..."
                      />
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user.bio}</p>
                    )}
                  </div>
                </div>
              </AnimatedCard>
            </motion.div>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="xl:col-span-3 order-1 xl:order-2"
            >
              <div className="space-y-6">
                {/* Desktop Tab Navigation */}
                <div className="hidden sm:block">
                  <AnimatedCard className="p-2">
                    <div className="flex space-x-1">
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                            activeTab === tab.id
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          <tab.icon className="w-4 h-4" />
                          <span>{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  </AnimatedCard>
                </div>

                {/* Tab Content */}
                <AnimatedCard className="p-6">
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Overview</h2>
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-blue-100 text-sm">Products Added</p>
                              <p className="text-2xl font-bold">{user.productsAdded}</p>
                            </div>
                            <FaBox className="w-8 h-8 text-blue-200" />
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-6 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-100 text-sm">Scans Performed</p>
                              <p className="text-2xl font-bold">{user.scansPerformed}</p>
                            </div>
                            <FaQrcode className="w-8 h-8 text-green-200" />
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-purple-100 text-sm">Total Products</p>
                              <p className="text-2xl font-bold">{user.totalProducts}</p>
                            </div>
                            <FaChartLine className="w-8 h-8 text-purple-200" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'activity' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recent Activity</h2>
                        <GlowingButton
                          onClick={handleRefresh}
                          variant="secondary"
                          className="px-4 py-2 text-sm"
                          glowColor="blue"
                          disabled={loading}
                        >
                          <FaSync className={`mr-2 w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                          Refresh
                        </GlowingButton>
                      </div>
                      
                      <div className="space-y-4">
                        {products.length > 0 ? (
                          products.slice(0, 5).map((product, index) => (
                            <motion.div
                              key={product.productId}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors cursor-pointer"
                              onClick={() => navigate(`/product/${product.productId}`)}
                            >
                              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500">
                                <FaBox className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  Created product: {product.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Product ID: {product.productId}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'Recently'}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {product.stages && product.stages.length > 0 && (
                                  <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600">
                                    {product.stages[product.stages.length - 1]}
                                  </span>
                                )}
                                <FaEye className="w-4 h-4 text-gray-400" />
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-center py-12">
                            <FaHistory className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
                              Add products to see your activity history
                            </p>
                            <GlowingButton
                              onClick={() => navigate('/admin/add')}
                              className="px-6 py-3 font-semibold"
                              glowColor="green"
                            >
                              <FaPlus className="mr-2" />
                              Add Your First Product
                            </GlowingButton>
                          </div>
                        )}
                      </div>
                      
                      {products.length > 5 && (
                        <div className="text-center">
                          <GlowingButton
                            onClick={() => setActiveTab('products')}
                            variant="secondary"
                            className="px-6 py-2 font-semibold"
                            glowColor="blue"
                          >
                            View All Products
                          </GlowingButton>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'products' && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Products</h2>
                        <div className="flex gap-2">
                          <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              placeholder="Search products..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10 pr-4 py-2 bg-white/50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm w-48"
                            />
                          </div>
                          <GlowingButton
                            onClick={() => navigate('/admin/add')}
                            className="px-4 py-2 font-semibold"
                            glowColor="green"
                          >
                            <FaPlus className="mr-2" />
                            Add Product
                          </GlowingButton>
                        </div>
                      </div>
                      
                      {loading ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <FaBox className="text-white text-2xl" />
                          </div>
                          <p className="text-gray-500 dark:text-gray-400">Loading products...</p>
                        </div>
                      ) : products.length === 0 ? (
                        <div className="text-center py-12">
                          <FaBox className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">No products found</p>
                          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">Start by adding your first product</p>
                          <GlowingButton
                            onClick={() => navigate('/admin/add')}
                            className="px-6 py-3 font-semibold"
                            glowColor="blue"
                          >
                            <FaPlus className="mr-2" />
                            Add Your First Product
                          </GlowingButton>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {products
                            .filter(product => 
                              product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              product.productId?.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map((product, index) => (
                            <motion.div
                              key={product.productId}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ scale: 1.02, y: -5 }}
                              className="group"
                            >
                              <AnimatedCard className="overflow-hidden h-full">
                                <div className="relative">
                                  {/* Product Image */}
                                  <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center overflow-hidden">
                                    {getImageUrl(product.imageFile) ? (
                                      <img
                                        src={getImageUrl(product.imageFile)}
                                        alt={product.name}
                                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }}
                                      />
                                    ) : null}
                                    <div className="flex flex-col items-center justify-center text-gray-400" style={{display: getImageUrl(product.imageFile) ? 'none' : 'flex'}}>
                                      <FaBox className="text-2xl mb-1" />
                                      <span className="text-xs">No Image</span>
                                    </div>
                                  </div>
                                  
                                  {/* Stage Badge */}
                                  <div className="absolute top-2 right-2">
                                    {product.stages && product.stages.length > 0 ? (
                                      <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-green-500 to-green-600">
                                        {product.stages[product.stages.length - 1]}
                                      </span>
                                    ) : (
                                      <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold text-gray-500 bg-gray-200 dark:bg-gray-700">
                                        New
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="p-4">
                                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 truncate">
                                    {product.name}
                                  </h3>
                                  
                                  <div className="space-y-1 mb-3">
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                      <FaQrcode className="w-3 h-3 mr-2" />
                                      <span className="font-mono text-xs">{product.productId}</span>
                                    </div>
                                    
                                    {product.description && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                        {product.description.substring(0, 80)}...
                                      </p>
                                    )}
                                  </div>
                                  
                                  {/* Action Buttons */}
                                  <div className="flex gap-2">
                                    <GlowingButton
                                      onClick={() => navigate(`/product/${product.productId}`)}
                                      className="flex-1 py-2 text-sm font-semibold"
                                      glowColor="blue"
                                      size="sm"
                                    >
                                      <FaEye className="mr-1" />
                                      View
                                    </GlowingButton>
                                    <GlowingButton
                                      onClick={() => navigate(`/admin/update/${product.productId}`)}
                                      variant="secondary"
                                      className="flex-1 py-2 text-sm font-semibold"
                                      glowColor="green"
                                      size="sm"
                                    >
                                      <FaEdit className="mr-1" />
                                      Update
                                    </GlowingButton>
                                  </div>
                                </div>
                              </AnimatedCard>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'settings' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Settings</h2>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FaBell className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">Email Notifications</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Receive updates about your products</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FaKey className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">Two-Factor Authentication</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security</p>
                            </div>
                          </div>
                          <GlowingButton
                            variant="secondary"
                            className="px-4 py-2 text-sm"
                            glowColor="blue"
                          >
                            Enable
                          </GlowingButton>
                        </div>
                      </div>
                    </div>
                  )}
                </AnimatedCard>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
