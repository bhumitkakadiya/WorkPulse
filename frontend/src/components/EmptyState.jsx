import React from 'react';
import './EmptyState.css';

export default function EmptyState({ icon: Icon, title, message, action, actionLabel }) {
  return (
    <div className="empty-state-container">
      {/* Pulse waveform background signature */}
      <div className="pulse-bg-wrapper">
        <svg className="pulse-line" viewBox="0 0 100 20" preserveAspectRatio="none">
          <path d="M0,10 L30,10 L35,2 L40,18 L45,10 L100,10" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      </div>
      
      <div className="empty-state-content">
        <div className="empty-state-icon">
          {Icon && <Icon size={32} />}
        </div>
        <h3 className="empty-state-title">{title}</h3>
        <p className="empty-state-message">{message}</p>
        {action && actionLabel && (
          <button className="btn btn-primary empty-state-action" onClick={action}>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
