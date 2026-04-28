import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaUserPlus, FaSignInAlt, FaEye, FaEyeSlash, FaLock, FaEnvelope, FaUsers } from 'react-icons/fa';
import ParticleBackground from '../components/UI/ParticleBackground';
import GlowingButton from '../components/UI/GlowingButton';
import AnimatedCard from '../components/UI/AnimatedCard';
import Scene3D from '../components/3D/Scene3D';
import BrandLogo from '../components/BrandLogo';
import { buildAPIURL } from '../utils/apiConfig';
import { usePersistentForm } from '../hooks/usePersistentForm';

const REGISTER_INITIAL_FORM = { email: '', password: '', role: 'producer' };

function sanitizeRegisterDraft(value) {
  return {
    email: value?.email || '',
    role: value?.role || 'producer',
    password: ''
  };
}

function AuthRegister() {
  const [form, setForm, clearRegisterDraft] = usePersistentForm('register-form', REGISTER_INITIAL_FORM, {
    sanitize: sanitizeRegisterDraft
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(buildAPIURL('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      clearRegisterDraft();
      toast.success('Registration successful!');
      setTimeout(() => navigate('/auth/login'), 1200);
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden cyber-page">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Scene3D />
      </div>
      
      {/* Particle Background */}
      <ParticleBackground />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.20),transparent_34rem)] z-10"></div>
      
      <div className="relative z-20 min-h-screen flex items-center justify-center p-4">
        <ToastContainer position="top-center" />
        
        <AnimatedCard className="w-full max-w-md cyber-glass">
          <div className="p-8">
            {/* Header */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-5 flex justify-center">
                <div className="rounded-[24px] border border-white/10 bg-white/60 px-4 py-3 shadow-[0_18px_45px_rgba(15,23,42,0.08)] dark:bg-white/5">
                  <BrandLogo size="sm" animated />
                </div>
              </div>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#A855F7] to-[#2DD4BF] rounded-full flex items-center justify-center shadow-[0_0_28px_rgba(168,85,247,0.35)]">
                  <FaUserPlus className="text-white text-2xl" />
                </div>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-[#A855F7] to-[#2DD4BF] bg-clip-text text-transparent">
                Join Us Today
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mt-2">
                Create your account to get started
              </p>
            </motion.div>

            {/* Registration Form */}
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Email Input */}
              <div className="relative">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 text-slate-100 border border-white/10 focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all duration-200 backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="relative">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-12 py-3 rounded-lg bg-white/5 text-slate-100 border border-white/10 focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all duration-200 backdrop-blur-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div className="relative">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Role
                </label>
                <div className="relative">
                  <FaUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 text-slate-100 border border-white/10 focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all duration-200 backdrop-blur-sm"
                  >
                    <option value="producer">Producer</option>
                    <option value="consumer">Consumer</option>
                  </select>
                </div>
              </div>

              {/* Register Button */}
              <GlowingButton
                type="submit"
                disabled={loading}
                className="w-full py-3 text-lg font-semibold"
                glowColor="green"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <FaUserPlus className="mr-2" />
                    Create Account
                  </div>
                )}
              </GlowingButton>
            </motion.form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#1C1926] text-slate-400">
                  Already have an account?
                </span>
              </div>
            </div>

            {/* Login Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <GlowingButton
                onClick={() => navigate('/auth/login')}
                variant="secondary"
                className="w-full py-3 text-lg font-semibold"
                glowColor="blue"
              >
                <div className="flex items-center justify-center">
                  <FaSignInAlt className="mr-2" />
                  Sign In
                </div>
              </GlowingButton>
            </motion.div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}

export default AuthRegister; 
