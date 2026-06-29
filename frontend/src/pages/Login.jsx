import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Loader } from 'lucide-react';
import Logo from '../components/Logo';
import './Login.css';

const DEMO_USERS = [
  { label: 'Admin', email: 'admin@workpulse.dev', role: 'admin', color: '#EF4444' },
  { label: 'Manager', email: 'manager@workpulse.dev', role: 'manager', color: '#F59E0B' },
  { label: 'Employee', email: 'jordan@workpulse.dev', role: 'employee', color: '#3B82F6' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [valErrors, setValErrors] = useState({ email: '', password: '' });
  const [activeRole, setActiveRole] = useState(null);

  const validateEmail = (email) => {
    if (!email) return 'Email is required';
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Invalid email format';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    return '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'email') setValErrors(prev => ({ ...prev, email: validateEmail(form.email) }));
    if (field === 'password') setValErrors(prev => ({ ...prev, password: validatePassword(form.password) }));
  };

  const performLogin = async (email, password) => {
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'manager') navigate('/manager');
      else navigate('/employee');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const eErr = validateEmail(form.email);
    const pErr = validatePassword(form.password);
    setTouched({ email: true, password: true });
    setValErrors({ email: eErr, password: pErr });
    if (eErr || pErr) return;
    await performLogin(form.email, form.password);
  };

  // Auto-fills credentials when a demo pill is clicked
  const quickLogin = (demoUser) => {
    setActiveRole(demoUser.role);
    const email = demoUser.email;
    const password = 'password123';
    setForm({ email, password });
    setTouched({ email: true, password: true });
    setValErrors({ email: '', password: '' });
  };

  return (
    <div className="login-card animate-entrance">
      <h2 className="login-card-title stagger-1">Welcome back</h2>
      <p className="login-card-sub stagger-1">Sign in to your WorkPulse account</p>

      <div className="role-selector stagger-2">
        {activeRole && (
          <div
            className="role-slider"
            style={{
              width: `${100 / DEMO_USERS.length}%`,
              transform: `translateX(${DEMO_USERS.findIndex(u => u.role === activeRole) * 100}%)`,
              background: DEMO_USERS.find(u => u.role === activeRole)?.color,
              boxShadow: `0 0 12px ${DEMO_USERS.find(u => u.role === activeRole)?.color}66`
            }}
          />
        )}
        {DEMO_USERS.map(u => (
          <button
            key={u.role}
            type="button"
            id={`demo-${u.role}-btn`}
            className={`role-pill ${activeRole === u.role ? 'active' : ''}`}
            onClick={() => quickLogin(u)}
            disabled={loading}
          >
            {u.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="login-form">
        <div className="input-group stagger-3">
          <label className="input-label" htmlFor="login-email">Email Address</label>
          <input
            id="login-email"
            className={`input ${touched.email && valErrors.email ? 'error' : ''}`}
            type="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={e => {
              setForm(f => ({ ...f, email: e.target.value }));
              if (touched.email) setValErrors(prev => ({ ...prev, email: validateEmail(e.target.value) }));
            }}
            onBlur={() => handleBlur('email')}
            required
            autoComplete="email"
          />
          {touched.email && valErrors.email && <span className="input-error-text">{valErrors.email}</span>}
        </div>

        <div className="input-group stagger-3">
          <label className="input-label" htmlFor="login-password">Password</label>
          <div className="login-pw-wrap">
            <input
              id="login-password"
              className={`input ${touched.password && valErrors.password ? 'error' : ''}`}
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.password}
              onChange={e => {
                setForm(f => ({ ...f, password: e.target.value }));
                if (touched.password) setValErrors(prev => ({ ...prev, password: validatePassword(e.target.value) }));
              }}
              onBlur={() => handleBlur('password')}
              required
            />
            <button
              type="button"
              className="login-pw-toggle"
              onClick={() => setShowPw(s => !s)}
              tabIndex={-1}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {touched.password && valErrors.password && <span className="input-error-text">{valErrors.password}</span>}
        </div>

        {error && <div className="login-error stagger-4">{error}</div>}

        <button
          id="login-submit-btn"
          type="submit"
          className="btn-submit stagger-4"
          disabled={loading}
        >
          {loading ? <><Loader size={16} className="spin-icon" /> Signing in...</> : 'Sign In'}
        </button>

        <div className="stagger-4" style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Don't have an account? <Link to="/signup" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>Sign Up</Link>
        </div>
      </form>
    </div>
  );
}
