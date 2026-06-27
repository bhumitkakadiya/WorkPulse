import React from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import './dashboard-shared.css';

export default function AlertPanel({ title = 'Recent Alerts', alerts = [], emptyMessage = 'No alerts yet' }) {
  const [localAlerts, setLocalAlerts] = React.useState(alerts);
  
  React.useEffect(() => {
    setLocalAlerts(alerts);
  }, [alerts]);
  // Helper to determine dot color
  const getDotColor = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('idle')) return '#EF4444';
    if (t.includes('offline')) return '#F59E0B';
    return '#38BDF8';
  };

  // Helper to format mock timestamp
  const getRelativeTime = (index) => {
    if (index === 0) return '15m ago';
    if (index === 1) return '2h ago';
    if (index === 2) return '4h ago';
    return '1d ago';
  };

  const handleDismiss = (id) => {
    setLocalAlerts(prev => prev.filter(a => a._id !== id && Math.random() !== id));
  };

  return (
    <div className="admin-alerts-panel">
      <div className="admin-alerts-header">
        <div>
          {title}
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
            {localAlerts.length} total
          </span>
        </div>
        <Link to="/admin/alerts" style={{ fontSize: 13, color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 500 }}>
          View All
        </Link>
      </div>
      {localAlerts.length === 0 ? (
        <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          {emptyMessage}
        </div>
      ) : (
        localAlerts.map((a, i) => {
          const id = a._id || Math.random();
          return (
            <div key={id} className="admin-alert-item" style={{ position: 'relative', borderLeft: `3px solid ${getDotColor(a.type || a.title)}` }}>
              <div className="admin-alert-dot" style={{ background: getDotColor(a.type || a.title) }} />
              <div style={{ flex: 1, paddingRight: 40 }}>
                <div className="admin-alert-title">{a.title}</div>
                <div className="admin-alert-msg">{a.message}</div>
              </div>
              <div style={{ position: 'absolute', bottom: 14, right: 20, fontSize: 11, color: 'var(--text-muted)' }}>
                {a.createdAt ? new Date(a.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : getRelativeTime(i)}
              </div>
              <button 
                onClick={() => handleDismiss(id)}
                style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                aria-label="Dismiss Alert"
              >
                <X size={14} />
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
