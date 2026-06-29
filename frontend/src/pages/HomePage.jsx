import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, BarChart3, Bot, Shield, ArrowRight, CheckCircle2, Search, Zap, Info, LogOut, Sun, Moon } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import PulseBackground from '../components/PulseBackground';
import './HomePage.css';

export default function HomePage() {
  const { user, logout } = useAuth();
  const { activeTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate an animated background effect logic if needed
    // The main background is now handled purely via CSS mesh gradients
  }, []);

  const handleAction = () => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'manager') navigate('/manager');
      else navigate('/employee');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="home-page">
      {/* Background System */}
      <PulseBackground />

      {/* Content */}
      <nav className="home-nav">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="home-brand" style={{ gap: 12 }}>
            <Logo size={32} />
            <span className="sidebar-logo">Work<span style={{ color: 'var(--accent-primary)' }}>Pulse</span></span>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <button 
              onClick={toggleTheme} 
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-body)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Toggle Theme"
            >
              {activeTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            {user ? (
              <>
                <button 
                  onClick={logout} 
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', fontWeight: 500, fontSize: 15, transition: 'opacity 0.2s' }}
                >
                  <LogOut size={16} />
                  Logout
                </button>
                <span style={{ color: 'var(--color-border-strong)', fontSize: '18px', fontWeight: 'bold', userSelect: 'none' }}>|</span>
                <button className="btn btn-primary" onClick={handleAction}>Go to Dashboard</button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link-hover" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500, padding: '0 4px' }}>Login</Link>
                <span style={{ color: 'var(--color-border-strong)', fontSize: '18px', fontWeight: 'bold', userSelect: 'none' }}>|</span>
                <Link to="/login" className="btn btn-primary" style={{ transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}>Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="home-main">
        {/* HERO SECTION */}
        <div className="container hero-section">
          <div className="hero-centered">
            <div className="hero-eyebrow">
              <Shield size={14} style={{ marginRight: 6 }} />
              Transparency-first productivity tracking
            </div>
            <div className="hero-title-container">
              <div className="inline-pulse-wrapper">
                <svg
                  className="pulse-waveform-svg"
                  viewBox="0 0 1000 200"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="pulse-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(96, 165, 250, 0)" />
                      <stop offset="50%" stopColor="rgba(96, 165, 250, 1)" />
                      <stop offset="100%" stopColor="rgba(96, 165, 250, 0)" />
                    </linearGradient>
                  </defs>
                  
                  {/* Deep Outer Shadow */}
                  <path
                    className="pulse-path-traveler"
                    d="M 0 100 L 50 100 L 70 70 L 90 130 L 110 50 L 130 150 L 150 70 L 170 130 L 190 50 L 210 150 L 230 70 L 250 130 L 270 100 L 730 100 L 750 70 L 770 130 L 790 50 L 810 150 L 830 70 L 850 130 L 870 50 L 890 150 L 910 70 L 930 130 L 950 100 L 1000 100"
                    fill="none"
                    stroke="#1e3a8a"
                    strokeWidth="14"
                    opacity="0.6"
                  />
                  {/* Neon Body */}
                  <path
                    className="pulse-path-traveler"
                    d="M 0 100 L 50 100 L 70 70 L 90 130 L 110 50 L 130 150 L 150 70 L 170 130 L 190 50 L 210 150 L 230 70 L 250 130 L 270 100 L 730 100 L 750 70 L 770 130 L 790 50 L 810 150 L 830 70 L 850 130 L 870 50 L 890 150 L 910 70 L 930 130 L 950 100 L 1000 100"
                    fill="none"
                    stroke="url(#pulse-gradient)"
                    strokeWidth="6"
                  />
                  {/* Intense Hot Core */}
                  <path
                    className="pulse-path-traveler"
                    d="M 0 100 L 50 100 L 70 70 L 90 130 L 110 50 L 130 150 L 150 70 L 170 130 L 190 50 L 210 150 L 230 70 L 250 130 L 270 100 L 730 100 L 750 70 L 770 130 L 790 50 L 810 150 L 830 70 L 850 130 L 870 50 L 890 150 L 910 70 L 930 130 L 950 100 L 1000 100"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <h1 className="hero-title">
                <span style={{ position: 'relative', zIndex: 2 }}>Track productivity.</span>
                <br />
                <span className="gradient-text" style={{ position: 'relative', zIndex: 2 }}>Empower teams.</span>
              </h1>
            </div>
            <p className="hero-subtitle">
              Real-time activity insights for managers. Transparent self-tracking for employees. With Pulse AI as your personal productivity assistant.
            </p>
            <div className="hero-actions">
              <Link to="/login" className="btn btn-primary btn-lg">Get Started</Link>
              <button className="btn btn-outline btn-lg" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
                See it in action <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* FEATURES ROW */}
        <div className="container section-spacing" id="features">
          <div className="features-grid">
            {[
              { icon: Bot, title: 'Pulse AI Assistant', desc: 'Chat with your data using our integrated AI.' },
              { icon: Shield, title: 'Full Transparency', desc: 'Employees own their data and see exactly what managers see.' }
            ].map((f, i) => (
              <div key={i} className="feature-card glass-panel card-interactive">
                <div className="feature-icon"><f.icon size={28} /></div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ROLE-BASED VALUE */}
        <div className="container section-spacing roles-section">
          <div className="role-column">
            <div className="role-icon"><Search size={24} /></div>
            <h4>For Employees</h4>
            <p>Prove your focus and manage your own time with full transparency. No hidden surveillance.</p>
          </div>
          <div className="role-column">
            <div className="role-icon"><BarChart3 size={24} /></div>
            <h4>For Managers</h4>
            <p>Monitor team health, prevent burnout, and spot blockers in real-time with actionable insights.</p>
          </div>
          <div className="role-column">
            <div className="role-icon"><Shield size={24} /></div>
            <h4>For Admins</h4>
            <p>Set org-wide policies, screenshot rules, and data retention limits securely.</p>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div className="container section-spacing how-it-works-section">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-strip">
            <div className="step-item">
              <div className="step-number">1</div>
              <h5>Install the Agent</h5>
              <p>Quick setup on macOS, Windows, or Linux.</p>
            </div>
            <div className="step-connector" />
            <div className="step-item">
              <div className="step-number">2</div>
              <h5>Track Automatically</h5>
              <p>Silent data collection of active apps and URLs.</p>
            </div>
            <div className="step-connector" />
            <div className="step-item">
              <div className="step-number">3</div>
              <h5>Review Your Data</h5>
              <p>Both employees and managers see the exact same stats.</p>
            </div>
            <div className="step-connector" />
            <div className="step-item">
              <div className="step-number">4</div>
              <h5>Stay Aligned</h5>
              <p>Use insights to prevent burnout and boost efficiency.</p>
            </div>
          </div>
        </div>

        {/* TRUST & TRANSPARENCY BAND */}
        <div className="trust-band section-spacing">
          <div className="container trust-band-content">
            <div className="trust-icon"><CheckCircle2 size={32} /></div>
            <div className="trust-text">
              <h2>Employees always see their own data</h2>
              <p>We believe in absolute transparency. There is no hidden tracking. If it's recorded, it's visible to the employee. Configurable by your organization to ensure ethical monitoring.</p>
            </div>
          </div>
        </div>

        {/* FINAL CTA BAND */}
        <div className="container section-spacing final-cta-section">
          <h2>Ready to empower your team?</h2>
          <p>Join forward-thinking companies building transparent, productive cultures.</p>
          <Link to="/login" className="btn btn-primary btn-lg" style={{ marginTop: 'var(--space-6)' }}>Start for free</Link>
        </div>
      </main>

      <footer className="home-footer">
        <div className="container footer-grid">
          <div className="footer-brand-col">
            <div className="home-brand" style={{ marginBottom: 12, gap: 10 }}>
              <Logo size={28} />
              <span className="sidebar-logo" style={{ fontSize: '22px' }}>Work<span style={{ color: 'var(--accent-primary)' }}>Pulse</span></span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Transparency-first productivity tracking for modern teams.
            </p>
          </div>
          
          <div className="footer-links-col">
            <h4>Product</h4>
            <Link to="#">Features</Link>
            <Link to="#">Pricing</Link>
            <Link to="/login">Sign In</Link>
          </div>
          
          <div className="footer-links-col">
            <h4>Company</h4>
            <Link to="#">About Us</Link>
            <Link to="#">Privacy Policy</Link>
            <Link to="#">Consent Info</Link>
          </div>
        </div>
        
        <div className="container footer-bottom">
          <span>WorkPulse © 2026. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
