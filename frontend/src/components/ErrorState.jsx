import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({ title = "Something went wrong", message = "We couldn't load this data.", onRetry }) {
  return (
    <div className="empty-state-container" style={{ border: '1px solid var(--danger-light)', background: 'rgba(239, 68, 68, 0.05)' }}>
      <div className="empty-state-content">
        <div className="empty-state-icon" style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)' }}>
          <AlertCircle size={32} />
        </div>
        <h3 className="empty-state-title">{title}</h3>
        <p className="empty-state-message">{message}</p>
        {onRetry && (
          <button className="btn btn-outline" onClick={onRetry} style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
            <RefreshCw size={16} /> Retry
          </button>
        )}
      </div>
    </div>
  );
}
