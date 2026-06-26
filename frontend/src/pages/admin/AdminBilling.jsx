import { Zap, Shield, BarChart3, CreditCard } from 'lucide-react';
import HeaderActions from '../../components/HeaderActions';
import '../../components/dashboard/dashboard-shared.css';

const FEATURES = [
  { icon: Zap,       label: 'Automated Payroll Integration' },
  { icon: Shield,    label: 'SSO & Advanced Security Policies' },
  { icon: BarChart3, label: 'Custom Report Builder' },
  { icon: CreditCard, label: 'Multi-workspace Billing' },
];

export default function AdminBilling() {
  return (
    <>
      <div className="page-header">
        <div>
          <div className="breadcrumbs">Admin / Billing</div>
          <h1>Billing &amp; Policies</h1>
        </div>
        <HeaderActions />
      </div>

      <div className="page page-enter">
        <div className="admin-settings-card" style={{ maxWidth: 640, textAlign: 'center' }}>
          <div className="admin-coming-soon">
            <div className="admin-coming-soon-icon"><CreditCard size={36} /></div>
            <h2>Billing &amp; Subscription Policies</h2>
            <p>
              Manage your plan, seat count, invoices, and advanced compliance policies — all in one place.
              This section is currently under active development.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 28, textAlign: 'left', width: '100%', maxWidth: 360 }}>
              {FEATURES.map(({ icon: Icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 10, background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.12)' }}>
                  <Icon size={16} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: 'var(--text-body)' }}>{label}</span>
                </div>
              ))}
            </div>

            <div className="coming-badge">
              <Zap size={12} /> Coming in next release
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
