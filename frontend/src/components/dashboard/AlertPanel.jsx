import React from 'react';
import './dashboard-shared.css';

export default function AlertPanel({ title = 'Recent Alerts', alerts = [], emptyMessage = 'No alerts yet' }) {
  return (
    <div className="admin-alerts-panel">
      <div className="admin-alerts-header">
        {title}
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>
          {alerts.length} total
        </span>
      </div>
      {alerts.length === 0 ? (
        <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          {emptyMessage}
        </div>
      ) : (
        alerts.map(a => (
          <div key={a._id || Math.random()} className="admin-alert-item">
            <div className="admin-alert-dot" />
            <div>
              <div className="admin-alert-title">{a.title}</div>
              <div className="admin-alert-msg">{a.message}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
