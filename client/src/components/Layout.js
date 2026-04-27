import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { FaMoon, FaSun } from 'react-icons/fa';
import Navbar from './Navbar';
import { jwtDecode } from 'jwt-decode';

function Layout({ children }) {
  const location = useLocation();
  const isLandingRoute = location.pathname === '/';
  const isWideRoute = location.pathname.startsWith('/admin/dashboard');
  const [dark, setDark] = useState(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
      return true;
    }
    if (storedTheme === 'light') {
      return false;
    }
    return true;
  });
  const [user, setUser] = useState(null);

  // Function to check and set user from token
  const checkUserToken = () => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        const decoded = jwtDecode(token);
        
        // Check if token is expired
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          setUser(null);
          localStorage.removeItem('token');
          return;
        }
        
        setUser({ email: decoded.email, role: decoded.role });
      } catch (error) {
        console.error('Error decoding token:', error);
        setUser(null);
        localStorage.removeItem('token'); // Remove invalid token
      }
    } else {
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
      checkUserToken();
    };

    const handleThemeChange = (e) => {
      if (typeof e.detail?.dark === 'boolean') {
        setDark(e.detail.dark);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLogin', handleLogin);
    window.addEventListener('themeChange', handleThemeChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLogin', handleLogin);
      window.removeEventListener('themeChange', handleThemeChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  const handleThemeToggle = () => {
    setDark((previousDark) => {
      const nextDark = !previousDark;
      window.dispatchEvent(new CustomEvent('themeChange', { detail: { dark: nextDark } }));
      return nextDark;
    });
  };

  return (
    <div className="min-h-screen cyber-page transition-colors duration-500">
      {!isLandingRoute && <Navbar user={user} onLogout={handleLogout} />}
      
      {/* Theme Toggle */}
      {!isLandingRoute && (
        <div className="fixed top-20 right-4 z-40">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="h-11 w-11 rounded-full backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_0_24px_rgba(168,85,247,0.18)] text-purple-100 hover:text-teal-200"
            onClick={handleThemeToggle}
            aria-label="Toggle theme"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <FaSun className="mx-auto" /> : <FaMoon className="mx-auto" />}
          </motion.button>
        </div>
      )}

      {/* Main Content */}
      <div className={isLandingRoute ? '' : 'pt-16'}>
        <AnimatePresence mode="wait">
          <motion.div
            key={dark ? 'dark' : 'light'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className={isLandingRoute ? '' : isWideRoute ? 'mx-auto w-full max-w-[1600px] px-3 sm:px-5 lg:px-8 py-8' : 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8'}
          >
              {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Layout; 
