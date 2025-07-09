import React from 'react';
import { motion } from 'framer-motion';

const AnimatedCard = ({ 
  children, 
  className = "", 
  delay = 0, 
  direction = "up",
  hover = true,
  ...props 
}) => {
  const directions = {
    up: { y: 50, x: 0 },
    down: { y: -50, x: 0 },
    left: { y: 0, x: -50 },
    right: { y: 0, x: 50 }
  };

  const hoverEffects = hover ? {
    scale: 1.02,
    rotateY: 2,
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)"
  } : {};

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        ...directions[direction] 
      }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        x: 0 
      }}
      transition={{ 
        duration: 0.6, 
        delay,
        ease: "easeOut"
      }}
      whileHover={hoverEffects}
      className={`rounded-xl backdrop-blur-lg ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
