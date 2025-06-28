import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AuthLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('Attempting login with:', form.email);
      
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);
      
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      if (!data.token) {
        throw new Error('No token received from server');
      }
      
      localStorage.setItem('token', data.token);
      
      // Dispatch custom event to notify Layout component
      window.dispatchEvent(new Event('userLogin'));
      
      toast.success('Login successful! Redirecting...');
      
      // Redirect to home dashboard instead of landing page
      console.log('Navigating to /home');
      navigate('/home');
    } catch (err) {
      console.error('Login error:', err);
      toast.error(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4">
      <ToastContainer position="top-center" />
      <motion.div
        className="card p-8 w-full max-w-md text-gray-900 dark:text-gray-100"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold mb-6 text-center">Login</h2>
        <form onSubmit={handleSubmit}>
          <input className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold text-lg"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </motion.button>
        </form>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="btn-primary mt-6 w-full py-3 text-lg"
          onClick={() => navigate('/auth/register')}
        >
          Register
        </motion.button>
      </motion.div>
    </div>
  );
}

export default AuthLogin; 