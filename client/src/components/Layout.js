import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { jwtDecode } from 'jwt-decode';

function Layout({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [user, setUser] = useState(null);

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
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({ email: decoded.email, role: decoded.role });
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <div className={"min-h-screen bg-gradient-to-br from-glass to-glassDark dark:from-glassDark dark:to-black transition-colors duration-500"}>
      <Navbar user={user} onLogout={handleLogout} />
      <div className="flex justify-end p-4">
        <button
          className="rounded-full px-4 py-2 bg-glass dark:bg-glassDark text-gray-800 dark:text-gray-100 shadow-glass"
          onClick={() => setDark(d => !d)}
        >
          {dark ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={dark ? 'dark' : 'light'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="container mx-auto px-2"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default Layout; 