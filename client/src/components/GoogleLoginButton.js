import React from 'react';
import { FaGoogle } from 'react-icons/fa';
import { toast } from 'react-toastify';

/**
 * GoogleLoginButton Component
 * Modern Google login button matching the app's cyberpunk design
 * 
 * Props:
 * - onClick: Callback when button is clicked
 * - loading: Loading state
 * - disabled: Disable the button
 * - variant: 'dark' or 'light' theme
 */
const GoogleLoginButton = ({ 
  onClick, 
  loading = false, 
  disabled = false,
  variant = 'dark',
  className = ''
}) => {
  const handleClick = async () => {
    try {
      await onClick();
    } catch (err) {
      console.error('Google login button error:', err);
      toast.error('An unexpected error occurred');
    }
  };

  const baseStyles = `
    w-full px-4 py-3 rounded-xl font-semibold text-base
    transition-all duration-300 flex items-center justify-center gap-3
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    hover:scale-105 active:scale-95
    shadow-lg hover:shadow-xl
  `;

  const darkStyles = `
    bg-[linear-gradient(135deg,rgba(28,25,38,0.96),rgba(19,17,28,0.96))] text-white
    border border-white/10 hover:border-purple-300/40
    dark:hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]
    focus:ring-purple-400 dark:focus:ring-offset-slate-900
  `;

  const lightStyles = `
    bg-white/90 text-slate-700 border border-slate-200
    hover:border-purple-300/40 hover:bg-white
    focus:ring-purple-400 focus:ring-offset-white
  `;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || disabled}
      className={`${baseStyles} ${variant === 'dark' ? darkStyles : lightStyles} ${className}`}
      title={loading ? 'Signing in with Google...' : 'Continue with Google'}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
          <span>Signing in with Google...</span>
        </>
      ) : (
        <>
          <FaGoogle className="text-xl" />
          <span>Continue with Google</span>
        </>
      )}
    </button>
  );
};

export default GoogleLoginButton;
