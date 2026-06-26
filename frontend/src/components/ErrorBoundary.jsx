import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', padding: 24, background: 'var(--bg-base)', color: 'var(--text)'
        }}>
          <div className="glass-panel card-3d" style={{ maxWidth: 400, textAlign: 'center' }}>
            <div style={{ color: 'var(--danger)', marginBottom: 16 }}>
              <AlertTriangle size={48} />
            </div>
            <h2 style={{ marginBottom: 8, fontSize: 20 }}>Something went wrong</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              {this.state.error?.message || 'An unexpected error occurred in this view.'}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <RefreshCw size={14} /> Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
