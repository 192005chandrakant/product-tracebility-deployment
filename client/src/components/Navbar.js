import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { to: '/', label: 'Home', roles: ['admin', 'producer', 'customer'] },
  { to: '/scan', label: 'Scan', roles: ['admin', 'producer', 'customer'] },
  { to: '/admin/dashboard', label: 'Dashboard', roles: ['admin', 'producer'] },
  { to: '/admin/add', label: 'Add Product', roles: ['producer'] },
  { to: '/admin/update', label: 'Update Product', roles: ['producer'] },
];

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <motion.nav
      className="glass-card flex items-center justify-between px-4 py-3 rounded-b-2xl mb-4 relative z-10"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo/Brand */}
      <motion.span
        whileHover={{ scale: 1.08, rotate: -2 }}
        whileTap={{ scale: 0.97, rotate: 0 }}
        className="font-bold text-xl text-blue-600 dark:text-blue-400 cursor-pointer p-2 select-none transition-colors duration-200 hover:text-indigo-500"
        onClick={() => navigate('/')}
      >
        TraceChain
      </motion.span>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-4">
        {navLinks.filter(l => !user || l.roles.includes(user.role)).map(l => (
          <motion.div key={l.to} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.97 }}>
            <Link to={l.to} className="text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-lg transition-colors duration-200 font-medium">
              {l.label}
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Auth and User Info */}
      <div className="hidden md:flex items-center gap-4">
        {user ? (
          <>
            <span className="text-gray-700 dark:text-gray-200 text-sm">{user.email}</span>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.97 }}
              onClick={onLogout}
              className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors duration-200"
            >
              Logout
            </motion.button>
            <motion.div
              className="avatar-ring"
              whileHover={{ rotate: 10, scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                {user.email[0].toUpperCase()}
              </div>
            </motion.div>
          </>
        ) : (
          <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.97 }}>
            <Link to="/auth/login" className="bg-blue-600 text-white px-4 py-1 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium">Login</Link>
          </motion.div>
        )}
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button onClick={toggleMobileMenu} className="text-gray-800 dark:text-gray-100 focus:outline-none">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute top-full left-0 w-full glass-card rounded-b-2xl py-4 md:hidden"
          >
            <div className="flex flex-col items-center gap-3">
              {navLinks.filter(l => !user || l.roles.includes(user.role)).map(l => (
                <Link key={l.to} to={l.to} className="text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-lg transition-colors duration-200 w-full text-center font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              {user ? (
                <>
                  <span className="text-gray-700 dark:text-gray-200 text-sm mt-2">Logged in as: {user.email}</span>
                  <button onClick={() => { onLogout(); setIsMobileMenuOpen(false); }} className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors duration-200 w-fit">Logout</button>
                </>
              ) : (
                <Link to="/auth/login" className="bg-blue-600 text-white px-4 py-1 rounded-lg hover:bg-blue-700 transition-colors duration-200 w-fit font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
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