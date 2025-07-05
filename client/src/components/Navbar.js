import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHome, FaQrcode, FaPlus, FaHistory, FaUser, FaSignOutAlt, FaBars, FaTimes, FaUserCircle, FaUserAlt } from 'react-icons/fa';

// Utility to generate a pastel color from a string (email)
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 70%, 80%)`;
}

const navLinks = [
  { to: '/', label: 'Home', icon: FaHome, roles: ['admin', 'producer', 'customer'] },
  { to: '/scan', label: 'Scan QR', icon: FaQrcode, roles: ['admin', 'producer', 'customer'] },
  { to: '/admin/dashboard', label: 'Dashboard', icon: FaUser, roles: ['admin', 'producer'] },
  { to: '/admin/add', label: 'Add Product', icon: FaPlus, roles: ['producer'] },
  { to: '/admin/update', label: 'Update Product', icon: FaHistory, roles: ['producer'] },
];

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const filteredNavLinks = navLinks.filter(l => !user || l.roles.includes(user.role));

  // Profile dropdown menu
  const profileMenu = (
    <AnimatePresence>
      {profileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18 }}
          className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 z-50"
        >
          <div className="py-2 min-w-0">
            <div className="px-4 py-2 text-gray-700 dark:text-gray-200 text-sm font-semibold break-all whitespace-normal min-w-0">
              {user && user.email}
            </div>
            <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
            <button
              className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => {
                console.log('Profile button clicked');
                console.log('Current user:', user);
                setProfileOpen(false);
                navigate('/profile');
              }}
            >
              <FaUserCircle className="inline mr-2" /> Profile
            </button>
            <button
              className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => {
                setProfileOpen(false);
                onLogout();
              }}
            >
              <FaSignOutAlt className="inline mr-2" /> Logout
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/10 dark:bg-black/20 border-b border-white/20 dark:border-gray-700/30"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <motion.div
            whileHover={{ scale: 1.05, rotate: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              TraceChain
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {filteredNavLinks.map((link) => (
              <motion.div
                key={link.to}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to={link.to}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/20 dark:hover:bg-gray-800/50 transition-all duration-200 font-medium"
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* User Section */}
          <div className="hidden md:flex items-center space-x-4 relative">
            {user ? (
              <>
                {/* Google-style profile icon */}
                <div className="relative">
                  <button
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-md border-2 border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    style={{ background: user.email ? stringToColor(user.email) : '#eee' }}
                    onClick={() => setProfileOpen((open) => !open)}
                  >
                    {user && user.email ? (
                      <span className="text-lg font-bold text-white uppercase">
                        {user.email[0].toUpperCase()}
                      </span>
                    ) : (
                      <FaUserAlt className="text-white text-lg" />
                    )}
                  </button>
                  {profileMenu}
                </div>
              </>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/auth/login"
                  className="flex items-center space-x-2 px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  <FaUser className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              </motion.div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-white/20 dark:hover:bg-gray-800/50 transition-all duration-200"
            >
              {isMobileMenuOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-white/20 dark:border-gray-700/30"
          >
            <div className="px-4 py-6 space-y-4">
              {filteredNavLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/20 dark:hover:bg-gray-800/50 transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <link.icon className="w-5 h-5" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))}
              
              {user ? (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  {/* Profile Section */}
                  <div className="flex items-center space-x-3 px-4 py-3 rounded-lg" style={{ background: user.email ? stringToColor(user.email) : '#eee' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center">
                      {user && user.email ? (
                        <span className="text-white font-bold text-lg uppercase">{user.email[0].toUpperCase()}</span>
                      ) : (
                        <FaUserAlt className="text-white text-lg" />
                      )}
                    </div>
                  <div className="flex-1 min-w-0">
  <p className="text-gray-900 dark:text-gray-100 font-medium break-all whitespace-normal">{user.email}</p>
  <p className="text-blue-600 dark:text-blue-400 text-sm capitalize">{user.role}</p>
</div>
                  </div>
                  
                  {/* Profile Actions */}
                  <div className="mt-3 space-y-2">
                    <Link
                      to="/profile"
                      className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 border border-blue-500/30 transition-all duration-200"
                      onClick={() => {
                        console.log('Mobile profile link clicked');
                        console.log('Current user:', user);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <FaUser className="w-5 h-5" />
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                      className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 border border-red-500/30 transition-all duration-200"
                    >
                      <FaSignOutAlt className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  to="/auth/login"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FaUser className="w-5 h-5" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

export default Navbar; 