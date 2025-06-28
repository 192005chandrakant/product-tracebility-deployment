import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { jwtDecode } from 'jwt-decode';

function Layout({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [user, setUser] = useState(null);

  // Function to check and set user from token
  const checkUserToken = () => {
    const token = localStorage.getItem('token');
    console.log('Checking token:', token ? 'exists' : 'not found');
    
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('Decoded token:', decoded);
        
        // Check if token is expired
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          console.log('Token is expired, removing...');
          setUser(null);
          localStorage.removeItem('token');
          return;
        }
        
        setUser({ email: decoded.email, role: decoded.role });
        console.log('User set successfully:', { email: decoded.email, role: decoded.role });
      } catch (error) {
        console.error('Error decoding token:', error);
        setUser(null);
        localStorage.removeItem('token'); // Remove invalid token
      }
    } else {
      console.log('No token found, setting user to null');
      setUser(null);
    }
  };

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  useEffect(() => {
    // Check user token on mount
    checkUserToken();

    // Listen for storage changes (when token is added/removed)
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        checkUserToken();
      }
    };

    // Listen for custom login event
    const handleLogin = () => {
      console.log('Login event received, checking token...');
      checkUserToken();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLogin', handleLogin);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLogin', handleLogin);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-cyan-900/20 transition-colors duration-500">
      <Navbar user={user} onLogout={handleLogout} />
      
      {/* Theme Toggle */}
      <div className="fixed top-20 right-4 z-40">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-3 rounded-full backdrop-blur-md bg-white/20 dark:bg-black/20 border border-white/30 dark:border-gray-700/30 shadow-lg"
          onClick={() => setDark(d => !d)}
        >
          {dark ? '🌙' : '☀️'}
        </motion.button>
      </div>

      {/* Main Content */}
      <div className="pt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={dark ? 'dark' : 'light'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="container mx-auto px-4 sm:px-6 lg:px-8 py-8"
          >
              {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Layout; 