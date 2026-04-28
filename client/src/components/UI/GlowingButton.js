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
      bg-gradient-to-r from-[#A855F7] via-purple-500 to-[#2DD4BF]
      hover:from-purple-400 hover:via-[#A855F7] hover:to-teal-300
      text-white font-semibold shadow-xl
      shadow-purple-500/30 hover:shadow-purple-500/50
      border border-white/10 focus:ring-4 focus:ring-purple-300/40
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300`,
    
    secondary: `relative overflow-hidden group
      bg-gradient-to-r from-[#2DD4BF] via-teal-400 to-cyan-300
      hover:from-teal-300 hover:via-cyan-300 hover:to-[#A855F7]
      text-white font-semibold shadow-xl
      shadow-teal-500/30 hover:shadow-teal-400/50
      border border-white/10 focus:ring-4 focus:ring-teal-300/40
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
      bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/60
      text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white
      font-semibold shadow-lg hover:shadow-xl backdrop-blur-sm
      shadow-purple-950/20 hover:shadow-purple-400/20
      focus:ring-4 focus:ring-purple-300/30
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-purple-500/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300`,
      
    outline: `relative overflow-hidden group
      bg-transparent border border-purple-400/70 hover:border-teal-300
      text-purple-700 dark:text-purple-200 hover:text-slate-900 dark:hover:text-white
      font-semibold shadow-lg hover:shadow-xl
      shadow-purple-400/20 hover:shadow-purple-300/40
      focus:ring-4 focus:ring-purple-300/30
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-purple-500 before:to-teal-400 before:scale-x-0 hover:before:scale-x-100 before:transition-transform before:duration-300 before:origin-left`
  };

  const sizes = {
    sm: "px-4 py-2.5 text-sm min-h-[2.5rem]",
    md: "px-6 py-3.5 text-base min-h-[3rem]",
    lg: "px-8 py-4 text-lg min-h-[3.5rem]",
    xl: "px-10 py-5 text-xl min-h-[4rem]"
  };

  return (
    <motion.button
      whileHover={{ 
        scale: 1.02,
        y: -2,
        boxShadow: variant === 'primary' 
          ? "0 20px 40px rgba(168, 85, 247, 0.34), 0 0 0 1px rgba(255, 255, 255, 0.1)" 
          : variant === 'secondary'
          ? "0 20px 40px rgba(45, 212, 191, 0.32), 0 0 0 1px rgba(255, 255, 255, 0.1)"
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
        rounded-xl transition-all duration-300 ripple-effect whitespace-nowrap
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
      <span className="relative z-10 flex items-center justify-center gap-2">
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
