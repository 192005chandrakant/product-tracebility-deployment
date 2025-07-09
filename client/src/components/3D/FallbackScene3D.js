import React from 'react';
import { motion } from 'framer-motion';

const FallbackScene3D = ({ variant = 'default' }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'hero':
        return {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        };
      case 'dashboard':
        return {
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        };
      default:
        return {
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        };
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
        className="w-32 h-32 rounded-2xl backdrop-blur-sm"
        style={getVariantStyles()}
      >
        <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
          🔗
        </div>
      </motion.div>
    </div>
  );
};

export default FallbackScene3D;
