import React, { useState } from 'react';
import { Zap, Shield, BarChart3, CreditCard, Check, X } from 'lucide-react';
import PageHeader from '../../components/dashboard/PageHeader';
import '../../components/dashboard/dashboard-shared.css';

const PLANS = [
  {
    id: 'free',
    name: 'Starter',
    price: '$0',
    interval: 'forever',
    features: ['Up to 5 users', 'Basic activity tracking', '7-day data retention', 'Community support'],
    missing: ['Advanced analytics', 'SSO', 'Custom roles'],
    isCurrent: false
  },
  {
    id: 'pro',
    name: 'Professional',
    price: '$12',
    interval: 'per user/month',
    features: ['Up to 50 users', 'Advanced analytics', '90-day data retention', 'Priority email support', 'Custom roles'],
    missing: ['SSO'],
    isCurrent: false
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    interval: 'contact sales',
    features: ['Unlimited users', 'Real-time monitoring', 'Unlimited data retention', '24/7 dedicated support', 'SSO & Advanced Security', 'Custom integrations'],
    missing: [],
    isCurrent: true
  }
];

export default function AdminBilling() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const openUpgradeModal = (plan) => {
    if (plan.isCurrent) return;
    setSelectedPlan(plan);
    setModalOpen(true);
  };

  return (
    <>
      <PageHeader breadcrumbs="Admin / Billing" title="Billing & Subscription" />

      <div className="page page-enter">
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Subscription Plans</h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage your plan, billing cycle, and payment methods.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 40 }}>
          {PLANS.map((plan) => (
            <div 
              key={plan.id}
              style={{
                background: 'var(--surface)',
                border: plan.isCurrent ? '2px solid var(--brand-primary)' : '1px solid var(--border)',
                borderRadius: 16,
                padding: 24,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {plan.isCurrent && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--brand-primary)', color: '#fff', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  Current Plan
                </div>
              )}
              
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{plan.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>{plan.price}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/{plan.interval}</span>
                </div>
              </div>

              <div style={{ flex: 1, marginBottom: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text)' }}>
                      <Check size={16} color="var(--brand-primary)" /> {f}
                    </div>
                  ))}
                  {plan.missing.map(m => (
                    <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                      <X size={16} color="var(--text-muted)" /> {m}
                    </div>
                  ))}
                </div>
              </div>

              <button 
                className={`btn ${plan.isCurrent ? 'btn-outline' : 'btn-primary'}`}
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={plan.isCurrent}
                onClick={() => openUpgradeModal(plan)}
              >
                {plan.isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        <div className="admin-settings-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <CreditCard size={20} color="var(--text)" />
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Payment Method</h3>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Visa ending in 4242</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Expires 12/2028</div>
            </div>
            <button className="btn btn-outline btn-sm">Update Method</button>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {modalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <button className="admin-drawer-close" onClick={() => setModalOpen(false)}><X size={20} /></button>
            <h3 style={{ fontSize: 20, marginBottom: 8 }}>Change Plan</h3>
            <p className="modal-sub">You are about to change your subscription to the <strong>{selectedPlan?.name}</strong> plan.</p>
            
            <div style={{ background: 'var(--surface-50)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>New Plan</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{selectedPlan?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Price</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{selectedPlan?.price}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>Effective Date</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>Immediately</span>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Confirm Change</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
