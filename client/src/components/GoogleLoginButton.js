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
    bg-gradient-to-r from-gray-800 to-gray-700 text-white
    border-2 border-gray-600 hover:border-gray-500
    dark:from-slate-700 dark:to-slate-600 dark:border-slate-500
    dark:hover:border-slate-400 dark:hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]
    focus:ring-blue-400 dark:focus:ring-offset-slate-900
  `;

  const lightStyles = `
    bg-white text-gray-700 border-2 border-gray-300
    hover:border-gray-400 hover:bg-gray-50
    focus:ring-blue-400 focus:ring-offset-white
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
