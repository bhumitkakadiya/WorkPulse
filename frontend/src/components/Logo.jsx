import React, { useId } from 'react';

export default function Logo({ size = 32, className = '' }) {
  // useId() generates a unique ID per instance so multiple Logos on the
  // same page don't share SVG def IDs (gradients, filters, clipPaths).
  const uid = useId().replace(/:/g, '_');

  const id = (name) => `${uid}_${name}`;

  return (
    <div className={`workpulse-logo-ribbon ${className}`} style={{ width: size, height: size, minWidth: size, minHeight: size, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>
        {`
          .workpulse-logo-ribbon {
            position: relative;
          }
          .workpulse-logo-ribbon svg {
            transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.6s ease;
            animation: iconPulseGlow 3s ease-in-out infinite;
          }
          .workpulse-logo-ribbon:hover svg {
            transform: scale(1.05) translateY(-2px);
          }
          @keyframes iconPulseGlow {
            0%, 100% { filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.4)); }
            50% { filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.8)); }
          }
          .pulse-ekg {
            stroke-dasharray: 250;
            stroke-dashoffset: 250;
            animation: drawEkg 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
          @keyframes drawEkg {
            0% { stroke-dashoffset: 250; opacity: 0; }
            5% { opacity: 1; }
            70% { stroke-dashoffset: 0; opacity: 1; }
            90% { stroke-dashoffset: -50; opacity: 0; }
            100% { stroke-dashoffset: -50; opacity: 0; }
          }
          .pulse-ekg-glow { stroke: rgba(255, 255, 255, 0.5); }
          .pulse-ekg-core { stroke: #ffffff; }
          [data-theme='light'] .pulse-ekg-glow { stroke: rgba(0, 0, 0, 0.15); filter: none; }
          [data-theme='light'] .pulse-ekg-core { stroke: #000000; }
        `}
      </style>
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 15 100 70" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <clipPath id={id('cutTops')}>
            <rect x="0" y="20" width="100" height="100" />
          </clipPath>

          {/* Expanded bounds to prevent filter clipping */}
          <filter id={id('shadowRight')} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="3" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.4" />
          </filter>
          
          <filter id={id('shadowBoth')} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.4" />
          </filter>

          <filter id={id('glowPulse')} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Gradients to perfectly match the 3D lighting of the reference image */}
          <linearGradient id={id('gradLeftDown')} x1="10" y1="20" x2="32" y2="75" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="40%" stopColor="#0EA5E9" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>

          <linearGradient id={id('gradMiddleUp')} x1="32" y1="75" x2="50" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#172554" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>

          <linearGradient id={id('gradMiddleDown')} x1="50" y1="28" x2="68" y2="75" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="40%" stopColor="#0EA5E9" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>

          <linearGradient id={id('gradRightUp')} x1="68" y1="75" x2="90" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#172554" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>

        {/* --- 3D W RIBBON --- */}
        {/* Back Strokes (Z=1) */}
        <g clipPath={`url(#${id('cutTops')})`}>
          <path 
            d="M 32 75 L 50 28" 
            stroke={`url(#${id('gradMiddleUp')})`}
            strokeWidth="16" 
            strokeLinecap="round" 
          />
          <path 
            d="M 68 75 L 90 10" 
            stroke={`url(#${id('gradRightUp')})`}
            strokeWidth="16" 
            strokeLinecap="round" 
          />
        </g>

        {/* --- HEARTBEAT PULSE --- */}
        {/* Heartbeat rendered BETWEEN back and front strokes (Z=2) to weave through the W */}
        <path 
          className="pulse-ekg pulse-ekg-glow"
          d="M -5 50 L 35 50 L 44 20 L 58 80 L 68 50 L 105 50"
          strokeWidth="3.5"
          strokeLinejoin="miter"
          strokeLinecap="round"
          filter={`url(#${id('glowPulse')})`}
        />
        <path 
          className="pulse-ekg pulse-ekg-core"
          d="M -5 50 L 35 50 L 44 20 L 58 80 L 68 50 L 105 50"
          strokeWidth="1.5"
          strokeLinejoin="miter"
          strokeLinecap="round"
        />

        {/* Front Strokes (Z=3) */}
        <g clipPath={`url(#${id('cutTops')})`}>
          <path 
            d="M 10 10 L 32 75" 
            stroke={`url(#${id('gradLeftDown')})`}
            strokeWidth="16" 
            strokeLinecap="round" 
            filter={`url(#${id('shadowRight')})`}
          />
          <path 
            d="M 50 28 L 68 75" 
            stroke={`url(#${id('gradMiddleDown')})`}
            strokeWidth="16" 
            strokeLinecap="round" 
            filter={`url(#${id('shadowBoth')})`}
          />
        </g>

      </svg>
    </div>
  );
}
