import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Eye, Download, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import './OnboardingPage.css';

export default function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const completeOnboarding = () => {
    // In a real app, we'd save this to the DB. For now, just navigate.
    if (user.role === 'admin') navigate('/admin');
    else if (user.role === 'manager') navigate('/manager');
    else navigate('/employee');
  };

  return (
    <div className="login-page login-bg-mesh" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="pulse-bg-wrapper" style={{ zIndex: 0, opacity: 0.15, color: 'var(--accent-primary)' }}>
        <svg className="pulse-line" viewBox="0 0 100 20" preserveAspectRatio="none">
          <path d="M0,10 L30,10 L35,2 L40,18 L45,10 L100,10" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      </div>
      
      <div className="glass-panel card-3d onboarding-card">
        {/* Step Indicators */}
        <div className="onboarding-steps">
          {[1, 2, 3].map(i => (
            <div key={i} className={`onboarding-step-dot ${step >= i ? 'active' : ''}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="onboarding-content">
            <div className="onboarding-icon"><Shield size={40} /></div>
            <h2>Transparency First</h2>
            <p>Welcome to WorkPulse, <b>{user?.name || 'User'}</b>! We believe in transparent productivity tracking.</p>
            <div className="onboarding-list">
              <div className="onboarding-list-item">
                <CheckCircle size={18} color="var(--success)" />
                <span><b>What we track:</b> App usage, active time, and periodic screenshots.</span>
              </div>
              <div className="onboarding-list-item">
                <CheckCircle size={18} color="var(--success)" />
                <span><b>What we don't:</b> We never record keystroke content, passwords, or personal messages.</span>
              </div>
            </div>
            <div className="onboarding-actions">
              <button className="btn btn-primary" onClick={() => setStep(2)}>Next <ArrowRight size={16}/></button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-content">
            <div className="onboarding-icon"><Eye size={40} /></div>
            <h2>You own your data</h2>
            <p>Everything your manager sees, you can see too.</p>
            <div className="onboarding-list">
              <div className="onboarding-list-item">
                <CheckCircle size={18} color="var(--success)" />
                <span>Review your own activity timeline and productivity score at any time.</span>
              </div>
              <div className="onboarding-list-item">
                <CheckCircle size={18} color="var(--success)" />
                <span>Access all captured screenshots from your dashboard. Nothing is hidden.</span>
              </div>
            </div>
            <div className="onboarding-actions">
              <button className="btn btn-ghost" onClick={() => setStep(1)}><ArrowLeft size={16}/> Back</button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>Next <ArrowRight size={16}/></button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-content">
            <div className="onboarding-icon"><Download size={40} /></div>
            <h2>Desktop Agent</h2>
            <p>To start tracking your focus sessions, you'll need the Desktop Agent running.</p>
            <div className="agent-download-box">
              <div style={{ fontWeight: 600 }}>WorkPulse Agent for {navigator.platform || 'Desktop'}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Version 2.0.0 (Latest)</div>
              <button className="btn btn-outline" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>
                Download Agent
              </button>
            </div>
            <div className="onboarding-actions">
              <button className="btn btn-ghost" onClick={() => setStep(2)}><ArrowLeft size={16}/> Back</button>
              <button className="btn btn-primary" onClick={completeOnboarding}>Go to Dashboard</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
