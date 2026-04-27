import React from 'react';
import { motion } from 'framer-motion';

function BrandMark({ size = 'md', animated = false }) {
  const sizes = {
    sm: 'h-9 w-9',
    md: 'h-11 w-11',
    lg: 'h-14 w-14'
  };

  const Wrapper = animated ? motion.div : 'div';

  return (
    <Wrapper
      {...(animated
        ? {
            whileHover: { y: -2, rotate: -3, scale: 1.04 },
            whileTap: { scale: 0.96 }
          }
        : {})}
      className={`${sizes[size] || sizes.md} brand-mark relative flex flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" className="h-full w-full" role="img" aria-label="TraceChain mark">
        <defs>
          <linearGradient id="tracechain-mark-gradient" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#A855F7" />
            <stop offset="0.52" stopColor="#7C3AED" />
            <stop offset="1" stopColor="#2DD4BF" />
          </linearGradient>
          <filter id="tracechain-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.8" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.66 0 0 0 0 0.33 0 0 0 0 0.97 0 0 0 0.55 0" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M32 4 55.4 17.5v29L32 60 8.6 46.5v-29L32 4Z"
          fill="#13111C"
          stroke="url(#tracechain-mark-gradient)"
          strokeWidth="3"
          filter="url(#tracechain-glow)"
        />
        <path d="M20 22h24" stroke="#E9D5FF" strokeWidth="4" strokeLinecap="round" />
        <path d="M32 22v23" stroke="#E9D5FF" strokeWidth="4" strokeLinecap="round" />
        <circle cx="20" cy="22" r="4" fill="#2DD4BF" />
        <circle cx="44" cy="22" r="4" fill="#A855F7" />
        <circle cx="32" cy="45" r="4" fill="#2DD4BF" />
        <path d="m20 22 12 23 12-23" fill="none" stroke="rgba(45,212,191,0.65)" strokeWidth="2" />
      </svg>
    </Wrapper>
  );
}

export default function BrandLogo({ compact = false, size = 'md', className = '', animated = false }) {
  return (
    <div className={`brand-logo inline-flex items-center gap-3 ${className}`}>
      <BrandMark size={size} animated={animated} />
      {!compact ? (
        <span className="leading-none">
          <span className="block text-xl font-black tracking-tight brand-wordmark">TraceChain</span>
          <span className="hidden text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-slate-400 sm:block">
            Verified Product Intelligence
          </span>
        </span>
      ) : null}
    </div>
  );
}

export { BrandMark };
