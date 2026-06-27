import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function PageError({ message, onRetry }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '24px', borderRadius: '50%', marginBottom: '24px' }}>
        <AlertTriangle size={48} style={{ color: 'var(--danger)' }} />
      </div>
      <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>Something went wrong</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '400px', marginBottom: '32px' }}>
        {message || 'An unexpected error occurred while loading this page.'}
      </p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={18} /> Retry
        </button>
      )}
    </div>
  );
}
