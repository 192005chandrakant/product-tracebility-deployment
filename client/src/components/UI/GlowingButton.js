import React from 'react';
import { motion } from 'framer-motion';

const GlowingButton = ({ 
  children, 
  variant = "primary", 
  size = "md", 
  className = "",
  onClick,
  disabled = false,
  glowColor = "blue", // Added default value, but won't pass to DOM
  ...props 
}) => {
  const variants = {
    primary: `relative overflow-hidden group
      bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600
      hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500
      dark:from-cyan-500 dark:via-blue-500 dark:to-purple-500
      dark:hover:from-cyan-400 dark:hover:via-blue-400 dark:hover:to-purple-400
      text-white font-semibold shadow-xl
      shadow-indigo-500/30 hover:shadow-purple-500/50
      dark:shadow-cyan-500/40 dark:hover:shadow-blue-500/60
      border-0 focus:ring-4 focus:ring-purple-300 dark:focus:ring-cyan-300
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300`,
    
    secondary: `relative overflow-hidden group
      bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500
      hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400
      dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400
      dark:hover:from-emerald-300 dark:hover:via-teal-300 dark:hover:to-cyan-300
      text-white font-semibold shadow-xl
      shadow-emerald-500/30 hover:shadow-teal-500/50
      dark:shadow-emerald-400/40 dark:hover:shadow-teal-400/60
      border-0 focus:ring-4 focus:ring-emerald-300 dark:focus:ring-teal-300
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300`,
    
    accent: `relative overflow-hidden group
      bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500
      hover:from-rose-400 hover:via-pink-400 hover:to-fuchsia-400
      dark:from-rose-400 dark:via-pink-400 dark:to-fuchsia-400
      dark:hover:from-rose-300 dark:hover:via-pink-300 dark:hover:to-fuchsia-300
      text-white font-semibold shadow-xl
      shadow-rose-500/30 hover:shadow-pink-500/50
      dark:shadow-rose-400/40 dark:hover:shadow-pink-400/60
      border-0 focus:ring-4 focus:ring-rose-300 dark:focus:ring-pink-300
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300`,
    
    ghost: `relative overflow-hidden group
      bg-white/80 hover:bg-white/95 border-2 border-gray-300/50 hover:border-indigo-400/50
      dark:bg-slate-800/50 dark:hover:bg-slate-700/70 dark:border-slate-600/50 dark:hover:border-cyan-400/70
      text-gray-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-cyan-300
      font-semibold shadow-lg hover:shadow-xl backdrop-blur-sm
      shadow-gray-300/20 hover:shadow-indigo-300/30
      dark:shadow-slate-700/30 dark:hover:shadow-cyan-400/20
      focus:ring-4 focus:ring-indigo-200 dark:focus:ring-cyan-300/30
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-indigo-50 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
      dark:before:from-cyan-900/20`,
      
    outline: `relative overflow-hidden group
      bg-transparent border-2 border-indigo-500 hover:border-indigo-400
      dark:border-cyan-400 dark:hover:border-cyan-300
      text-indigo-600 hover:text-white dark:text-cyan-400 dark:hover:text-slate-900
      font-semibold shadow-lg hover:shadow-xl
      shadow-indigo-200/30 hover:shadow-indigo-400/40
      dark:shadow-cyan-400/20 dark:hover:shadow-cyan-300/40
      focus:ring-4 focus:ring-indigo-200 dark:focus:ring-cyan-300/30
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-indigo-500 before:to-purple-500 before:scale-x-0 hover:before:scale-x-100 before:transition-transform before:duration-300 before:origin-left
      dark:before:from-cyan-400 dark:before:to-blue-400`
  };

  const sizes = {
    sm: "px-4 py-2.5 text-sm",
    md: "px-6 py-3.5 text-base",
    lg: "px-8 py-4 text-lg",
    xl: "px-10 py-5 text-xl"
  };

  return (
    <motion.button
      whileHover={{ 
        scale: 1.02,
        y: -2,
        boxShadow: variant === 'primary' 
          ? "0 20px 40px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)" 
          : variant === 'secondary'
          ? "0 20px 40px rgba(16, 185, 129, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)"
          : variant === 'accent'
          ? "0 20px 40px rgba(236, 72, 153, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)"
          : "0 10px 30px rgba(148, 163, 184, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)"
      }}
      whileTap={{ scale: 0.98, y: 0 }}
      transition={{ 
        duration: 0.15,
        ease: "easeOut"
      }}
      className={`
        ${variants[variant]} 
        ${sizes[size]} 
        ${className}
        rounded-xl transition-all duration-300 ripple-effect
        transform active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        relative z-10
      `}
      onClick={onClick}
      disabled={disabled}
      // Remove glowColor from props before passing to DOM
      {...Object.entries(props).reduce((acc, [key, value]) => {
        if (key !== 'glowColor') acc[key] = value;
        return acc;
      }, {})}
    >
      <span className="relative z-10 flex items-center justify-center">
        {children}
      </span>
      
      {/* Shimmer effect for primary buttons */}
      {variant === 'primary' && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer"></div>
        </div>
      )}
    </motion.button>
  );
};

export default GlowingButton;
