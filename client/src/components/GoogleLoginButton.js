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
 * - label: Button text when idle
 * - loadingLabel: Button text while loading
 * - title: Accessible title attribute
 */
const GoogleLoginButton = ({ 
  onClick, 
  loading = false, 
  disabled = false,
  className = '',
  label = 'Continue with Google',
  loadingLabel = 'Signing in with Google...',
  title
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

  const responsiveStyles = `
    bg-white text-slate-700 border border-slate-200
    hover:border-purple-300/40 hover:bg-slate-50
    focus:ring-purple-400 focus:ring-offset-white

    dark:bg-[linear-gradient(135deg,rgba(28,25,38,0.96),rgba(19,17,28,0.96))] dark:text-white
    dark:border-white/10 dark:hover:border-purple-300/40
    dark:hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]
    dark:focus:ring-purple-400 dark:focus:ring-offset-slate-900
  `;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || disabled}
      className={`${baseStyles} ${responsiveStyles} ${className}`}
      title={title || (loading ? loadingLabel : label)}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
          <span>{loadingLabel}</span>
        </>
      ) : (
        <>
          <FaGoogle className="text-xl" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};

export default GoogleLoginButton;
