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
import GoogleLoginButton from '../components/GoogleLoginButton';
import { optimizedAnimations } from '../utils/performanceOptimizations';
import { buildAPIURL, apiRequest } from '../utils/apiConfig';
import { usePersistentForm } from '../hooks/usePersistentForm';
import { useGoogleLogin } from '../hooks/useGoogleLogin';

const LOGIN_INITIAL_FORM = { email: '', password: '' };

function sanitizeLoginDraft(value) {
  return { email: value?.email || '', password: '' };
}

function AuthLogin() {
  const [form, setForm] = usePersistentForm('login-form', LOGIN_INITIAL_FORM, {
    sanitize: sanitizeLoginDraft
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  
  // Google login hook
  const { googleLogin, loading: googleLoading, error: googleError, clearError } = useGoogleLogin();

  // Memoized handlers for better performance
  const handleChange = useCallback((e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);
  
  // Handle Google login
  const handleGoogleLogin = useCallback(async () => {
    const result = await googleLogin();
    
    if (result.success) {
      toast.success('Google login successful! Redirecting...');
      window.dispatchEvent(new Event('userLogin'));
      setTimeout(() => navigate('/home', { replace: true }), 1000);
    } else {
      toast.error(result.error || 'Google login failed');
    }
  }, [googleLogin, navigate]);

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
    <div className="min-h-screen relative overflow-hidden transition-all duration-1000 cyber-page">
      
      {/* 3D Background */}
      <div className="absolute inset-0 z-0 opacity-30 dark:opacity-60 transition-opacity duration-1000">
        <Scene3D />
      </div>
      
      {/* Particle Background */}
      <div className="opacity-40 dark:opacity-70 transition-opacity duration-1000">
        <ParticleBackground />
      </div>
      
      {/* Light Mode: Soft gradient overlay */}
      <div className="absolute inset-0 z-10 transition-opacity duration-1000
        bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.20),transparent_34rem)]"></div>
      
      {/* Dark Mode: Cyberpunk grid pattern */}
      <div className="absolute inset-0 z-10 opacity-40 transition-opacity duration-1000"
        style={{
          backgroundImage: `
            linear-gradient(rgba(168, 85, 247, 0.10) 1px, transparent 1px),
            linear-gradient(90deg, rgba(45, 212, 191, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-blue-900/30 to-cyan-900/40"></div>
      </div>
      
      <div className="relative z-20 min-h-screen flex items-center justify-center p-4">
        <ToastContainer position="top-center" />
        
        <AnimatedCard className="w-full max-w-md cyber-glass shadow-2xl transition-all duration-500 hover:border-purple-300/50">
          <div className="p-8">
            {/* Header */}
            <motion.div
              className="text-center mb-8"
              {...animationVariants.headerAnimation}
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500
                  bg-gradient-to-br from-[#A855F7] via-purple-500 to-[#2DD4BF]
                  ring-1 ring-white/10 ring-offset-2 ring-offset-slate-950
                  hover:scale-110 hover:rotate-6 hover:ring-2 hover:ring-cyan-300/40">
                  <FaSignInAlt className="text-white text-3xl drop-shadow-lg" />
                </div>
              </div>
              <h2 className="text-4xl font-bold mb-3 transition-all duration-500
                bg-gradient-to-r from-[#A855F7] to-[#2DD4BF]
                bg-clip-text text-transparent
                dark:drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
                Welcome Back
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 transition-all duration-500">
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
                <label className="block text-sm font-semibold mb-3 text-slate-700 transition-all duration-300 group-focus-within:text-purple-600 dark:text-slate-300 dark:group-focus-within:text-cyan-400">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 transition-all duration-300 group-focus-within:text-purple-500 dark:group-focus-within:text-cyan-400">
                    <FaEnvelope className="text-lg" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="form-control input-enhanced w-full rounded-xl py-4 pl-12 pr-4 font-medium shadow-sm hover-lift"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="relative group">
                <label className="block text-sm font-semibold mb-3 text-slate-700 transition-all duration-300 group-focus-within:text-purple-600 dark:text-slate-300 dark:group-focus-within:text-cyan-400">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 transition-all duration-300 group-focus-within:text-purple-500 dark:group-focus-within:text-cyan-400">
                    <FaLock className="text-lg" />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="form-control input-enhanced w-full rounded-xl py-4 pl-12 pr-14 font-medium shadow-sm hover-lift"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-all duration-300 hover:bg-white/60 hover:text-purple-600 focus:text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-200/50 dark:hover:bg-slate-600/50 dark:hover:text-cyan-400 dark:focus:ring-cyan-400/30 dark:focus:text-cyan-400"
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
                <div className="w-full border-t-2 border-slate-200/80 transition-all duration-300 dark:border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="rounded-full border border-white/10 bg-white/75 px-4 py-1 font-medium text-slate-500 transition-all duration-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Login Button */}
            <motion.div
              className="pt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <GoogleLoginButton
                onClick={handleGoogleLogin}
                loading={googleLoading}
                variant="dark"
              />
              {googleError && (
                <div className="mt-3 rounded-2xl border border-rose-300/30 bg-rose-500/10 p-3 dark:bg-rose-900/20">
                  <p className="text-sm text-red-600 dark:text-red-400">{googleError}</p>
                  <button
                    type="button"
                    onClick={clearError}
                    className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 mt-1 underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </motion.div>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-slate-200/80 transition-all duration-300 dark:border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="rounded-full border border-white/10 bg-white/75 px-4 py-1 font-medium text-slate-500 transition-all duration-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600">
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
