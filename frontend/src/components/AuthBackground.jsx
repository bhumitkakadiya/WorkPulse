import React, { useEffect, useState } from 'react';
import { Activity, Clock, Users, Sparkles, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { useTheme } from '../contexts/ThemeContext';

export default function AuthBackground({ children }) {
  const { activeTheme, toggleTheme } = useTheme();
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDuration: `${10 + Math.random() * 20}s`,
      animationDelay: `${-Math.random() * 20}s`,
      size: `${2 + Math.random() * 4}px`
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="auth-immersive-container">
      {/* 1. Large Gradient Mesh */}
      <div className="auth-gradient-mesh"></div>

      {/* 2. Floating Blobs */}
      <div className="auth-blob auth-blob-1"></div>
      <div className="auth-blob auth-blob-2"></div>
      <div className="auth-blob auth-blob-3"></div>

      {/* 3. Grid Overlay */}
      <div className="auth-grid-overlay"></div>

      {/* 4. Light Particles */}
      <div className="auth-particles">
        {particles.map(p => (
          <div 
            key={p.id} 
            className="auth-particle"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              animationDuration: p.animationDuration,
              animationDelay: p.animationDelay
            }}
          ></div>
        ))}
      </div>

      {/* 5. Floating UI Elements (Background layer) */}
      <div className="auth-floating-elements">
        {/* Card 1: Productivity Score - Top Left */}
        <div className="auth-float-card card-tl float-anim-1 glass-panel blur-heavy">
          <div className="float-card-header">
            <div className="icon-wrap bg-blue"><Activity size={14} /></div>
            <span>Productivity</span>
          </div>
          <div className="float-card-value">94<span>%</span></div>
        </div>

        {/* Card 2: Deep Work - Top Right */}
        <div className="auth-float-card card-tr float-anim-2 glass-panel blur-heavy">
          <div className="float-card-header">
            <div className="icon-wrap bg-blue"><Clock size={14} /></div>
            <span>Deep Work</span>
          </div>
          <div className="float-card-value">6<span>h</span> 42<span>m</span></div>
        </div>

        {/* Card 3: AI Insights - Bottom Left */}
        <div className="auth-float-card card-bl float-anim-3 glass-panel blur-heavy">
          <div className="float-card-header">
            <div className="icon-wrap bg-blue"><Sparkles size={14} /></div>
            <span>AI Insights</span>
          </div>
          <div className="float-card-text">High Performance</div>
        </div>

        {/* Card 4: Team Alignment - Bottom Right */}
        <div className="auth-float-card card-br float-anim-4 glass-panel blur-heavy">
          <div className="float-card-header">
            <div className="icon-wrap bg-blue"><Users size={14} /></div>
            <span>Team Alignment</span>
          </div>
          <div className="float-card-value" style={{ fontSize: '20px' }}>Optimal</div>
        </div>
        
        {/* Abstract shapes */}
        <svg className="auth-abstract-wave float-anim-5" viewBox="0 0 400 100" preserveAspectRatio="none">
          <path d="M0,50 Q100,0 200,50 T400,50" fill="none" stroke="rgba(30, 167, 255, 0.15)" strokeWidth="2" strokeDasharray="10 5" />
        </svg>
      </div>

      {/* Form Content Layer */}
      <div className="auth-content-layer">
        <button 
          onClick={toggleTheme} 
          style={{ position: 'absolute', top: 24, right: 24, background: 'transparent', border: 'none', cursor: 'pointer', padding: 8, color: 'var(--text-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          title="Toggle Theme"
        >
          {activeTheme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
        </button>
        <Link to="/" className="auth-logo-top animate-entrance" style={{ textDecoration: 'none' }}>
          <Logo size={48} />
          <span className="sidebar-logo" style={{ fontSize: '38px' }}>Work<span style={{ color: '#1EA7FF' }}>Pulse</span></span>
        </Link>
        
        {children}
      </div>
    </div>
  );
}
