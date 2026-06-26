import React from 'react';
import { Activity, Clock, Users, TrendingUp, Sparkles } from 'lucide-react';
import Logo from './Logo';

export default function AuthShowcase() {
  return (
    <div className="auth-showcase">
      <div className="auth-showcase-content">
        <div className="auth-showcase-header animate-entrance">
          <div className="auth-showcase-brand">
            <Logo size={42} />
            <span className="auth-showcase-logo-text">Work<span style={{ color: 'var(--accent-primary)' }}>Pulse</span></span>
          </div>
          <h1 className="auth-showcase-title stagger-1">
            Supercharge your team's productivity
          </h1>
          <p className="auth-showcase-subtitle stagger-2">
            AI-powered insights, seamless time tracking, and powerful analytics built for modern, high-performing teams.
          </p>
        </div>

        <div className="auth-showcase-visuals stagger-3">
          {/* Card 1: Productivity Score */}
          <div className="showcase-card float-slow-1 showcase-card-tl">
            <div className="showcase-card-header">
              <div className="showcase-icon-bg bg-blue">
                <Activity size={16} color="#3B82F6" />
              </div>
              <span className="showcase-card-title">Productivity</span>
            </div>
            <div className="showcase-card-value">94<span className="text-sm">%</span></div>
            <div className="showcase-card-trend trend-up"><TrendingUp size={12} /> +12% this week</div>
          </div>

          {/* Card 2: Active Time */}
          <div className="showcase-card float-slow-2 showcase-card-tr">
            <div className="showcase-card-header">
              <div className="showcase-icon-bg bg-cyan">
                <Clock size={16} color="#22D3EE" />
              </div>
              <span className="showcase-card-title">Deep Work</span>
            </div>
            <div className="showcase-card-value">6<span className="text-sm">h</span> 42<span className="text-sm">m</span></div>
            <div className="showcase-card-trend trend-up"><TrendingUp size={12} /> +1.5h today</div>
          </div>

          {/* Card 3: Team Performance */}
          <div className="showcase-card float-slow-3 showcase-card-bl">
            <div className="showcase-card-header">
              <div className="showcase-icon-bg bg-indigo">
                <Users size={16} color="#8B5CF6" />
              </div>
              <span className="showcase-card-title">Team Alignment</span>
            </div>
            <div className="showcase-card-value">Optimal</div>
            <div className="showcase-progress-bar">
              <div className="showcase-progress-fill" style={{ width: '85%' }}></div>
            </div>
          </div>

          {/* Card 4: AI Insights */}
          <div className="showcase-card float-slow-4 showcase-card-br ai-glow">
            <div className="showcase-card-header">
              <div className="showcase-icon-bg bg-gradient">
                <Sparkles size={16} color="#fff" />
              </div>
              <span className="showcase-card-title">WorkPulse AI</span>
            </div>
            <p className="showcase-card-text">
              "Your team is highly focused during morning hours. Consider scheduling complex tasks before noon."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
