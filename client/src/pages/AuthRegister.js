import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaUserPlus, FaSignInAlt } from 'react-icons/fa';

function AuthRegister() {
  const [form, setForm] = useState({ email: '', password: '', role: 'producer' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      toast.success('Registration successful!');
      setTimeout(() => navigate('/auth/login'), 1200);
    } catch (err) {
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
        <h2 className="text-3xl font-bold mb-6 text-center">Register</h2>
        <form onSubmit={handleSubmit}>
          <input className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary w-full mb-4 py-3 text-lg btn-icon"
            type="submit"
            disabled={loading}
          >
            <FaUserPlus />
            {loading ? 'Registering...' : 'Register'}
          </motion.button>
        </form>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="btn-secondary w-full py-3 text-lg btn-icon"
          onClick={() => navigate('/auth/login')}
        >
          <FaSignInAlt />
          Login
        </motion.button>
      </motion.div>
    </div>
  );
}

export default AuthRegister; 