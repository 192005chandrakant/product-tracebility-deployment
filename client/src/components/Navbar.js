import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHome, FaQrcode, FaPlus, FaHistory, FaUser, FaSignOutAlt, FaBars, FaTimes, FaUserCircle, FaUserAlt, FaRobot } from 'react-icons/fa';

// Utility to generate a pastel color from a string (email)
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 70%, 80%)`;
}

const navLinkTemplates = [
  { key: 'home', label: 'Home', icon: FaHome, guestTo: '/', userTo: '/home', roles: ['admin', 'producer', 'customer', 'consumer', 'user'] },
  { key: 'scan', label: 'Scan QR', icon: FaQrcode, guestTo: '/scan', userTo: '/scan', roles: ['admin', 'producer', 'customer', 'consumer', 'user'] },
  { key: 'dashboard', label: 'Dashboard', icon: FaUser, guestTo: null, userTo: '/admin/dashboard', roles: ['admin', 'producer'] },
  { key: 'add', label: 'Add Product', icon: FaPlus, guestTo: null, userTo: '/admin/add', roles: ['producer'] },
  { key: 'update', label: 'Update Product', icon: FaHistory, guestTo: null, userTo: '/admin/update', roles: ['producer'] },
  { key: 'ai', label: 'AI Console', icon: FaRobot, guestTo: null, userTo: '/ai', roles: ['admin', 'producer', 'customer', 'consumer', 'user'] },
];

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((open) => !open);
  };

  const filteredNavLinks = useMemo(() => {
    return navLinkTemplates
      .filter((link) => (user ? link.roles.includes(user.role) : Boolean(link.guestTo)))
      .map((link) => ({
        key: link.key,
        label: link.label,
        icon: link.icon,
        to: user ? link.userTo : link.guestTo,
      }))
      .filter((link) => Boolean(link.to));
  }, [user]);

  useEffect(() => {
    const closeMenuOnResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    const closeOnOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setProfileOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', closeMenuOnResize);
    document.addEventListener('mousedown', closeOnOutsideClick);
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      window.removeEventListener('resize', closeMenuOnResize);
      document.removeEventListener('mousedown', closeOnOutsideClick);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfileOpen(false);
    }
  }, [user]);

  // Profile dropdown menu
  const profileMenu = (
    <AnimatePresence>
      {profileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18 }}
          className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 z-50 backdrop-blur-lg"
        >
          <div className="py-2 min-w-0">
            <div className="px-4 py-2 text-gray-700 dark:text-gray-200 text-sm font-semibold break-all whitespace-normal min-w-0 bg-gray-50 dark:bg-slate-700 rounded-t-xl">
                {user && user.email}
            </div>
            <div className="border-t border-gray-200 dark:border-slate-600 my-1" />
            <button
              className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => {
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
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500
        backdrop-blur-xl shadow-lg
        bg-white/95 border-b-2 border-gray-200/60 
        dark:bg-slate-900/95 dark:border-cyan-400/40 
        dark:shadow-[0_4px_20px_rgba(0,255,255,0.15)]"
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
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => navigate(user ? '/home' : '/')}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg
              bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 
              group-hover:shadow-xl group-hover:scale-110
              dark:bg-gradient-to-br dark:from-cyan-400 dark:via-blue-500 dark:to-purple-500 
              dark:shadow-[0_0_15px_rgba(0,255,255,0.4)]
              dark:group-hover:shadow-[0_0_25px_rgba(0,255,255,0.6)]">
              <span className="text-white font-bold text-xl drop-shadow-lg
                dark:drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]">T</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent transition-all duration-300
              from-indigo-600 via-purple-600 to-pink-600 
              dark:from-cyan-300 dark:via-blue-300 dark:to-purple-300
              dark:drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]
              group-hover:scale-105">
              TraceChain
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {filteredNavLinks.map((link) => (
              <motion.div
                key={link.key}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 group border ${
                      isActive
                        ? 'text-indigo-700 bg-indigo-50 border-indigo-200 shadow-md dark:text-cyan-200 dark:bg-slate-700/70 dark:border-cyan-400/40'
                        : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/80 hover:shadow-lg dark:text-slate-300 dark:hover:text-cyan-300 dark:hover:bg-slate-700/50 dark:hover:shadow-[0_4px_15px_rgba(0,255,255,0.15)] border-transparent hover:border-indigo-200/50 dark:hover:border-cyan-400/30'
                    }`
                  }
                >
                  <link.icon className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
                  <span className="tracking-wide">{link.label}</span>
                </NavLink>
              </motion.div>
            ))}
          </div>

          {/* User Section */}
          <div className="hidden md:flex items-center space-x-4 relative">
            {user ? (
              <>
                {/* Google-style profile icon */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-md border-2 border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    style={{ background: user.email ? stringToColor(user.email) : '#eee' }}
                    onClick={() => setProfileOpen((open) => !open)}
                    aria-label="Open profile menu"
                    aria-expanded={profileOpen}
                    aria-haspopup="menu"
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
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
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
                <NavLink
                  key={link.key}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-slate-700 dark:text-cyan-200 dark:border-cyan-400/30'
                        : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/20 dark:hover:bg-gray-800/50'
                    }`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <link.icon className="w-5 h-5" />
                  <span className="font-medium">{link.label}</span>
                </NavLink>
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
                      onClick={() => setIsMobileMenuOpen(false)}
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