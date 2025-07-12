import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEye, FaEyeSlash, FaSignInAlt, FaUserPlus, FaLock, FaEnvelope } from 'react-icons/fa';
import ParticleBackground from '../components/UI/ParticleBackground';
import GlowingButton from '../components/UI/GlowingButton';
import AnimatedCard from '../components/UI/AnimatedCard';
import Scene3D from '../components/3D/Scene3D';
import { optimizedAnimations } from '../utils/performanceOptimizations';
import { buildAPIURL, apiRequest } from '../utils/apiConfig';

function AuthLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Memoized handlers for better performance
  const handleChange = useCallback((e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // Optimized animation variants
  const animationVariants = useMemo(() => ({
    headerAnimation: {
      ...optimizedAnimations.fadeIn,
      transition: { duration: 0.6 }
    },
    formAnimation: {
      ...optimizedAnimations.slideUp,
      transition: { duration: 0.6, delay: 0.2 }
    },
    buttonAnimation: {
      ...optimizedAnimations.scaleIn,
      transition: { duration: 0.6, delay: 0.4 }
    }
  }), []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('Attempting login with:', form.email);
      
      // Use the enhanced API request function
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      
      console.log('Login response data:', data);
      
      if (!data.token) {
        throw new Error('No token received from server');
      }
      
      localStorage.setItem('token', data.token);
      
      // Dispatch custom event to notify Layout component
      window.dispatchEvent(new Event('userLogin'));
      
      toast.success('Login successful! Redirecting...');
      
      // Redirect to home dashboard immediately
      console.log('Navigating to /home');
      navigate('/home', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      toast.error(err.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  }, [form, navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden transition-all duration-1000
      bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 
      dark:bg-gradient-to-br dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950">
      
      {/* 3D Background */}
      <div className="absolute inset-0 z-0 opacity-30 dark:opacity-60 transition-opacity duration-1000">
        <Scene3D />
      </div>
      
      {/* Particle Background */}
      <div className="opacity-40 dark:opacity-70 transition-opacity duration-1000">
        <ParticleBackground />
      </div>
      
      {/* Light Mode: Soft gradient overlay */}
      <div className="absolute inset-0 z-10 opacity-100 dark:opacity-0 transition-opacity duration-1000
        bg-gradient-to-br from-blue-100/30 via-purple-100/20 to-cyan-100/30"></div>
      
      {/* Dark Mode: Cyberpunk grid pattern */}
      <div className="absolute inset-0 z-10 opacity-0 dark:opacity-40 transition-opacity duration-1000"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-blue-900/30 to-cyan-900/40"></div>
      </div>
      
      <div className="relative z-20 min-h-screen flex items-center justify-center p-4">
        <ToastContainer position="top-center" />
        
        <AnimatedCard className="w-full max-w-md backdrop-blur-xl border shadow-2xl transition-all duration-500
          bg-white/95 border-gray-200/50 shadow-gray-300/20
          dark:bg-slate-800/95 dark:border-cyan-400/30 dark:shadow-cyan-500/20
          hover:shadow-3xl hover:border-indigo-300/60 dark:hover:border-cyan-300/50">
          <div className="p-8">
            {/* Header */}
            <motion.div
              className="text-center mb-8"
              {...animationVariants.headerAnimation}
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-500
                  bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500
                  dark:bg-gradient-to-br dark:from-cyan-400 dark:via-blue-500 dark:to-purple-500
                  dark:shadow-[0_0_30px_rgba(0,255,255,0.4)]
                  hover:scale-110 hover:rotate-6 hover:shadow-2xl">
                  <FaSignInAlt className="text-white text-3xl drop-shadow-lg" />
                </div>
              </div>
              <h2 className="text-4xl font-bold mb-3 transition-all duration-500
                bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 
                dark:from-cyan-300 dark:via-blue-300 dark:to-purple-300 
                bg-clip-text text-transparent
                dark:drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
                Welcome Back
              </h2>
              <p className="text-lg transition-all duration-500
                text-gray-600 dark:text-cyan-100/80 
                dark:drop-shadow-[0_0_5px_rgba(0,255,255,0.3)]">
                Sign in to your account
              </p>
            </motion.div>

            {/* Login Form */}
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-6"
              {...animationVariants.formAnimation}
            >
              {/* Email Input */}
              <div className="relative group">
                <label className="block text-sm font-semibold mb-3 transition-all duration-300
                  text-gray-700 group-focus-within:text-indigo-600 
                  dark:text-slate-300 dark:group-focus-within:text-cyan-400">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300
                    text-gray-400 group-focus-within:text-indigo-500 dark:group-focus-within:text-cyan-400">
                    <FaEnvelope className="text-lg" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-4 rounded-xl transition-all duration-300 font-medium input-enhanced
                      bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-500
                      focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200/50
                      hover:border-gray-300 hover:bg-gray-50/80
                      dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400
                      dark:focus:bg-slate-700/80 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/30
                      dark:hover:border-slate-500 dark:hover:bg-slate-700/70
                      shadow-sm hover:shadow-md focus:shadow-lg hover-lift
                      dark:shadow-slate-800/50 dark:focus:shadow-cyan-500/20"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="relative group">
                <label className="block text-sm font-semibold mb-3 transition-all duration-300
                  text-gray-700 group-focus-within:text-indigo-600 
                  dark:text-slate-300 dark:group-focus-within:text-cyan-400">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300
                    text-gray-400 group-focus-within:text-indigo-500 dark:group-focus-within:text-cyan-400">
                    <FaLock className="text-lg" />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-14 py-4 rounded-xl transition-all duration-300 font-medium input-enhanced
                      bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-500
                      focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200/50
                      hover:border-gray-300 hover:bg-gray-50/80
                      dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400
                      dark:focus:bg-slate-700/80 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/30
                      dark:hover:border-slate-500 dark:hover:bg-slate-700/70
                      shadow-sm hover:shadow-md focus:shadow-lg hover-lift
                      dark:shadow-slate-800/50 dark:focus:shadow-cyan-500/20"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 transition-all duration-300
                      text-gray-400 hover:text-indigo-600 focus:text-indigo-600
                      dark:text-slate-400 dark:hover:text-cyan-400 dark:focus:text-cyan-400
                      p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600/50
                      focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-cyan-400/30"
                  >
                    {showPassword ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <div className="pt-2">
                <GlowingButton
                  type="submit"
                  disabled={loading}
                  variant="primary"
                  size="lg"
                  className="w-full font-bold tracking-wide"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <FaSignInAlt className="mr-3 text-lg" />
                      <span>Sign In</span>
                    </div>
                  )}
                </GlowingButton>
              </div>
            </motion.form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 transition-all duration-300
                  border-gray-200 dark:border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 py-1 rounded-full font-medium transition-all duration-300
                  bg-white text-gray-500 border border-gray-200
                  dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600">
                  Don't have an account?
                </span>
              </div>
            </div>

            {/* Register Button */}
            <motion.div
              {...animationVariants.buttonAnimation}
            >
              <GlowingButton
                onClick={() => navigate('/auth/register')}
                variant="outline"
                size="lg"
                className="w-full font-bold tracking-wide"
              >
                <div className="flex items-center justify-center">
                  <FaUserPlus className="mr-3 text-lg" />
                  <span>Create Account</span>
                </div>
              </GlowingButton>
            </motion.div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}

export default AuthLogin; 