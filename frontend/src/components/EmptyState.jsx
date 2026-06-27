import React from 'react';
import './EmptyState.css';

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="empty-state-container">
      <div className="empty-state-content">
        <div className="empty-state-icon">
          {typeof Icon === 'function' || typeof Icon === 'object' ? <Icon size={40} /> : <span>{Icon}</span>}
        </div>
        <h3 className="empty-state-title">{title}</h3>
        {description && <p className="empty-state-message">{description}</p>}
        {actionLabel && onAction && (
          <button className="btn btn-primary empty-state-action" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
