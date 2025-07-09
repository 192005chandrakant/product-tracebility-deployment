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
  FaSearch
} from 'react-icons/fa';
import { jwtDecode } from 'jwt-decode';
import ParticleBackground from '../components/UI/ParticleBackground';
import GlowingButton from '../components/UI/GlowingButton';
import AnimatedCard from '../components/UI/AnimatedCard';
import Scene3D from '../components/3D/Scene3D';
import FloatingCube from '../components/3D/FloatingCube';

function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [activeTab, setActiveTab] = useState('overview');

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
        productsAdded: 15,
        scansPerformed: 47,
        totalProducts: 23,
        recentActivity: [
          { type: 'scan', product: 'PROD-001', time: '2 hours ago' },
          { type: 'add', product: 'PROD-015', time: '1 day ago' },
          { type: 'update', product: 'PROD-008', time: '3 days ago' },
          { type: 'scan', product: 'PROD-003', time: '1 week ago' }
        ]
      };
      setUser(userData);
      setEditForm(userData);
    } catch (error) {
      console.error('Error decoding token:', error);
      navigate('/auth/login');
    }
  }, [navigate]);

  const handleSave = () => {
    setUser({ ...user, ...editForm });
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  const handleCancel = () => {
    setEditForm(user);
    setIsEditing(false);
  };

  function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, 70%, 80%)`;
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
            <div className="flex items-center gap-4 mb-6">
              <GlowingButton
                onClick={() => navigate('/')}
                variant="secondary"
                className="p-3"
                glowColor="blue"
              >
                <FaArrowLeft className="w-4 h-4" />
              </GlowingButton>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                User Profile
              </h1>
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
                      <FloatingCube size={0.3} />
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
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Recent Activity</h2>
                      
                      <div className="space-y-4">
                        {user.recentActivity.map((activity, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              activity.type === 'scan' ? 'bg-blue-500' : 
                              activity.type === 'add' ? 'bg-green-500' : 'bg-orange-500'
                            }`}>
                              {activity.type === 'scan' ? <FaEye className="w-4 h-4 text-white" /> :
                               activity.type === 'add' ? <FaPlus className="w-4 h-4 text-white" /> :
                               <FaEdit className="w-4 h-4 text-white" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {activity.type === 'scan' ? 'Scanned' : 
                                 activity.type === 'add' ? 'Added' : 'Updated'} product {activity.product}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'products' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Products</h2>
                        <GlowingButton
                          onClick={() => navigate('/add-product')}
                          className="px-4 py-2 font-semibold"
                          glowColor="green"
                        >
                          <FaPlus className="mr-2" />
                          Add Product
                        </GlowingButton>
                      </div>
                      
                      <div className="text-center py-12">
                        <FaBox className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No products found</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">Start by adding your first product</p>
                      </div>
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
                    />
                  ) : (
                    user.fullName
                  )}
                </h2>
                
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.role}
                      onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                      className="text-center bg-transparent border-b border-blue-500 focus:outline-none capitalize w-full"
                    />
                  ) : (
                    <span className="capitalize">{user.role}</span>
                  )}
                </p>
                
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                  Member since {user.createdAt}
                </p>
              </div>

              {/* Profile Details */}
              <div className="p-4 sm:p-6 space-y-4">
                {/* Contact Info */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <FaEnvelope className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
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
                    <FaBuilding className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Company</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
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
                    <FaMapMarkerAlt className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
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

                {/* Bio */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">Bio</h3>
                  {isEditing ? (
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      className="w-full bg-transparent border border-blue-500 rounded-lg p-2 focus:outline-none resize-none text-sm"
                      rows="3"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.bio}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  {isEditing ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                      >
                        <FaSave className="w-3 h-3" />
                        <span>Save</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCancel}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                      >
                        <FaTimes className="w-3 h-3" />
                        <span>Cancel</span>
                      </motion.button>
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsEditing(true)}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      <FaEdit className="w-3 h-3" />
                      <span>Edit Profile</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content - Responsive */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-3 order-1 xl:order-2"
          >
            {/* Desktop Tab Navigation */}
            <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8 px-6 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 sm:p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Stats Grid - Responsive */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-4 sm:p-6 border border-blue-500/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Products Added</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{user.productsAdded}</p>
                          </div>
                          <FaQrcode className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 sm:p-6 border border-green-500/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Scans Performed</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{user.scansPerformed}</p>
                          </div>
                          <FaHistory className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 sm:p-6 border border-purple-500/20 sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Products</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{user.totalProducts}</p>
                          </div>
                          <FaChartLine className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity - Responsive */}
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h3>
                      <div className="space-y-3">
                        {user.recentActivity.map((activity, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              activity.type === 'scan' ? 'bg-blue-100 text-blue-600' :
                              activity.type === 'add' ? 'bg-green-100 text-green-600' :
                              'bg-purple-100 text-purple-600'
                            }`}>
                              {activity.type === 'scan' ? <FaQrcode className="w-3 h-3 sm:w-4 sm:h-4" /> :
                               activity.type === 'add' ? <FaPlus className="w-3 h-3 sm:w-4 sm:h-4" /> :
                               <FaEdit className="w-3 h-3 sm:w-4 sm:h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 capitalize truncate">
                                {activity.type}ed product {activity.product}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'activity' && (
                  <div className="text-center py-8 sm:py-12">
                    <FaHistory className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Activity History</h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Detailed activity logs coming soon...</p>
                  </div>
                )}

                {activeTab === 'products' && (
                  <div className="text-center py-8 sm:py-12">
                    <FaQrcode className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">My Products</h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Product management features coming soon...</p>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg gap-4">
                      <div className="flex items-center space-x-3">
                        <FaBell className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">Notifications</h4>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Manage your notification preferences</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm whitespace-nowrap">
                        Configure
                      </button>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg gap-4">
                      <div className="flex items-center space-x-3">
                        <FaKey className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">Security</h4>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Change password and security settings</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm whitespace-nowrap">
                        Manage
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile; 