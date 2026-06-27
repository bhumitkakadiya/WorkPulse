import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';
import HeaderActions from '../components/HeaderActions';
import PageHeader from '../components/dashboard/PageHeader';

export default function NotFound() {
  return (
    <>
      <PageHeader breadcrumbs="Error" title="404 Not Found" />
      <div className="page page-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
        <AlertTriangle size={64} style={{ color: 'var(--warning)', marginBottom: 24 }} />
        <h2 style={{ fontSize: 32, marginBottom: 16 }}>Page Not Found</h2>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 400, marginBottom: 32 }}>
          The page you are looking for doesn't exist or you don't have permission to access it.
        </p>
        <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Home size={18} /> Back to Dashboard
        </Link>
      </div>
    </>
  );
}
