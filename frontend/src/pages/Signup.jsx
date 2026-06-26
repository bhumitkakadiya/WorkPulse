import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Loader, ChevronLeft, Check, X as CloseIcon } from 'lucide-react';
import Logo from '../components/Logo';
import axios from 'axios';
import './Login.css';

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(''); // 'admin', 'manager', 'employee'
  const [orgs, setOrgs] = useState([]);

  const [form, setForm] = useState({ 
    name: '', email: '', password: '', confirmPassword: '', 
    companyName: '', companySize: '1-10', orgId: '',
    department: 'Engineering', jobTitle: '', consent1: false, consent2: false,
    userId: '', mobileNumber: '', countryCode: '+91'
  });

  const [handleStatus, setHandleStatus] = useState('idle'); // idle, loading, available, taken
  const [emailStatus, setEmailStatus] = useState('idle'); // idle, loading, available, taken

  useEffect(() => {
    if (!form.userId || validateUserId(form.userId) !== '') {
      setHandleStatus('idle');
      return;
    }
    const checkHandle = async () => {
      setHandleStatus('loading');
      try {
        const res = await axios.get(`/api/public/check-handle?handle=${form.userId}`);
        setHandleStatus(res.data.available ? 'available' : 'taken');
      } catch (err) {
        setHandleStatus('idle');
      }
    };
    const timeoutId = setTimeout(checkHandle, 400);
    return () => clearTimeout(timeoutId);
  }, [form.userId]);

  useEffect(() => {
    if (!form.email || validateEmail(form.email) !== '') {
      setEmailStatus('idle');
      return;
    }
    const checkEmail = async () => {
      setEmailStatus('loading');
      try {
        const res = await axios.get(`/api/public/check-email?email=${form.email}`);
        setEmailStatus(res.data.available ? 'available' : 'taken');
      } catch (err) {
        setEmailStatus('idle');
      }
    };
    const timeoutId = setTimeout(checkEmail, 400);
    return () => clearTimeout(timeoutId);
  }, [form.email]);

  useEffect(() => {
    if (step === 2 && (role === 'manager' || role === 'employee')) {
      const fetchOrgs = async () => {
        try {
          const res = await axios.get('/api/public/organizations');
          if (res.data.success) {
            setOrgs(res.data.organizations);
            if (res.data.organizations.length > 0 && !form.orgId) {
              setForm(f => ({ ...f, orgId: res.data.organizations[0]._id }));
            }
          }
        } catch (err) {
          console.error('Failed to fetch orgs', err);
        }
      };
      fetchOrgs();
    }
  }, [step, role, form.orgId]);
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Inline validation
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirmPassword: false });
  const [valErrors, setValErrors] = useState({ name: '', email: '', password: '', confirmPassword: '', consent: '' });

  const validateUserId = (userId) => {
    if (!userId) return 'Username is required';
    if (userId.length < 3) return 'Must be at least 3 characters';
    if (!/^[a-z0-9_]+$/.test(userId)) return 'Lowercase letters, numbers, underscores only';
    return '';
  };
  const validateMobile = (mobile) => {
    if (!mobile) return 'Mobile number is required';
    if (!/^[0-9]{7,15}$/.test(mobile)) return 'Invalid mobile number';
    return '';
  };

  const validateName = (name) => {
    if (!name) return 'Name is required';
    if (name.length < 2) return 'Name must be at least 2 characters';
    if (!/^[a-zA-Z\s-]+$/.test(name)) return 'Letters, spaces, and hyphens only';
    return '';
  };
  const validateEmail = (email) => {
    if (!email) return 'Email is required';
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Invalid email format';
    return '';
  };
  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return 'Must contain 1 uppercase and 1 number';
    return '';
  };
  const validateConfirmPassword = (confirm, password) => {
    if (!confirm) return 'Please confirm your password';
    if (confirm !== password) return 'Passwords do not match';
    return '';
  };

  const calculateStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };
  const pwdScore = calculateStrength(form.password);
  const pwdColors = ['#1E293B', '#EF4444', '#F59E0B', '#10B981'];

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'name') setValErrors(prev => ({ ...prev, name: validateName(form.name) }));
    if (field === 'userId') setValErrors(prev => ({ ...prev, userId: validateUserId(form.userId) }));
    if (field === 'mobileNumber') setValErrors(prev => ({ ...prev, mobileNumber: validateMobile(form.mobileNumber) }));
    if (field === 'email') setValErrors(prev => ({ ...prev, email: validateEmail(form.email) }));
    if (field === 'password') {
      setValErrors(prev => ({ ...prev, password: validatePassword(form.password), confirmPassword: validateConfirmPassword(form.confirmPassword, form.password) }));
    }
    if (field === 'confirmPassword') setValErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(form.confirmPassword, form.password) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nErr = validateName(form.name);
    const uErr = validateUserId(form.userId);
    const mErr = validateMobile(form.mobileNumber);
    const eErr = validateEmail(form.email);
    const pErr = validatePassword(form.password);
    const cpErr = validateConfirmPassword(form.confirmPassword, form.password);
    const cErr = (!form.consent1 || !form.consent2) ? 'You must accept the terms and policies' : '';

    setTouched({ name: true, userId: true, mobileNumber: true, email: true, password: true, confirmPassword: true });
    setValErrors({ name: nErr, userId: uErr, mobileNumber: mErr, email: eErr, password: pErr, confirmPassword: cpErr, consent: cErr });
    
    if (nErr || uErr || mErr || eErr || pErr || cpErr || cErr || handleStatus === 'taken' || emailStatus === 'taken') return;

    setError('');
    setLoading(true);
    
    const payload = {
      role,
      name: form.name,
      email: form.email,
      password: form.password,
      companyName: form.companyName,
      companySize: form.companySize,
      orgId: form.orgId,
      department: form.department,
      jobTitle: form.jobTitle,
      userId: form.userId,
      mobileNumber: `${form.countryCode}${form.mobileNumber}`
    };

    try {
      await register(payload);
      setSuccess(true);
      setTimeout(() => {
        if (role === 'admin') navigate('/admin');
        else navigate('/login'); // pending approval, redirect to login
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details.');
      setLoading(false);
    }
  };

  return (
    <div className="login-card signup-mode animate-entrance">
      <h2 className="login-card-title stagger-1">
            {step === 1 ? 'How will you use WorkPulse?' : 'Create Account'}
          </h2>
          <p className="login-card-sub stagger-1">
            {step === 1 ? 'Select a role to continue' : 'Enter your details to get started'}
          </p>

          {step === 1 ? (
            <div className="form-step">
              <div className="role-cards-container">
                <div className={`role-card admin ${role === 'admin' ? 'active' : ''}`} onClick={() => setRole('admin')}>
                  <div className="role-card-content">
                    <div className="role-card-title">Admin</div>
                    <div className="role-card-desc">Set up a new company workspace and manage your organization</div>
                  </div>
                  <div className="role-checkmark"><Check size={14} /></div>
                </div>
                <div className={`role-card manager ${role === 'manager' ? 'active' : ''}`} onClick={() => setRole('manager')}>
                  <div className="role-card-content">
                    <div className="role-card-title">Manager</div>
                    <div className="role-card-desc">Join your team and manage employees under you</div>
                  </div>
                  <div className="role-checkmark"><Check size={14} /></div>
                </div>
                <div className={`role-card employee ${role === 'employee' ? 'active' : ''}`} onClick={() => setRole('employee')}>
                  <div className="role-card-content">
                    <div className="role-card-title">Employee</div>
                    <div className="role-card-desc">Join your team and track your own productivity</div>
                  </div>
                  <div className="role-checkmark"><Check size={14} /></div>
                </div>
              </div>
              
              <button 
                className="btn-submit" 
                disabled={!role} 
                onClick={() => setStep(2)}
              >
                Continue
              </button>
              
              <div className="stagger-4" style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>Sign In</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form form-step" noValidate>
              <div className="step-indicator stagger-1">
                <button type="button" className="back-btn" onClick={() => setStep(1)}>
                  <ChevronLeft size={16} /> Back
                </button>
                <span>Step 2 of 2</span>
              </div>
              
            <div className="signup-grid">

            <div className="input-group stagger-2">
              <label className="input-label" htmlFor="signup-name">Full Name</label>
              <input
                id="signup-name"
                className={`input ${touched.name && valErrors.name ? 'error' : ''}`}
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={e => {
                  setForm(f => ({ ...f, name: e.target.value }));
                  if (touched.name) setValErrors(prev => ({ ...prev, name: validateName(e.target.value) }));
                }}
                onBlur={async () => {
                  handleBlur('name');
                  if (!form.userId && form.name) {
                    try {
                      const res = await axios.get(`/api/public/suggest-handle?name=${form.name}`);
                      if (res.data.success) {
                        setForm(f => ({ ...f, userId: res.data.handle }));
                      }
                    } catch(err) {}
                  }
                }}
                required
              />
              {touched.name && valErrors.name && <span className="input-error-text">{valErrors.name}</span>}
            </div>

            <div className="input-group stagger-2">
              <label className="input-label" htmlFor="signup-email">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="signup-email"
                  className={`input ${touched.email && valErrors.email ? 'error' : ''}`}
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={e => {
                    setForm(f => ({ ...f, email: e.target.value }));
                    if (touched.email) setValErrors(prev => ({ ...prev, email: validateEmail(e.target.value) }));
                  }}
                  onBlur={() => handleBlur('email')}
                  style={{ paddingRight: '40px' }}
                  required
                />
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                  {emailStatus === 'loading' && <Loader size={16} className="spin-icon" color="var(--text-secondary)" />}
                  {emailStatus === 'available' && <Check size={16} color="#10B981" />}
                  {emailStatus === 'taken' && <CloseIcon size={16} color="#EF4444" />}
                </div>
              </div>
              {touched.email && valErrors.email && <span className="input-error-text">{valErrors.email}</span>}
              {emailStatus === 'taken' && !valErrors.email && <span className="input-error-text">Email is already in use</span>}
            </div>

            <div className="input-group stagger-2">
              <label className="input-label" htmlFor="signup-userid">Username (@handle)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>@</span>
                <input
                  id="signup-userid"
                  className={`input ${touched.userId && valErrors.userId ? 'error' : ''}`}
                  type="text"
                  placeholder="johndoe"
                  value={form.userId}
                  onChange={e => {
                    setForm(f => ({ ...f, userId: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }));
                    if (touched.userId) setValErrors(prev => ({ ...prev, userId: validateUserId(e.target.value) }));
                  }}
                  onBlur={() => handleBlur('userId')}
                  style={{ paddingLeft: '32px', paddingRight: '40px' }}
                  required
                />
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                  {handleStatus === 'loading' && <Loader size={16} className="spin-icon" color="var(--text-secondary)" />}
                  {handleStatus === 'available' && <Check size={16} color="#10B981" />}
                  {handleStatus === 'taken' && <CloseIcon size={16} color="#EF4444" />}
                </div>
              </div>
              {touched.userId && valErrors.userId && <span className="input-error-text">{valErrors.userId}</span>}
              {handleStatus === 'taken' && !valErrors.userId && <span className="input-error-text">This username is already taken</span>}
            </div>

            <div className="input-group stagger-2">
              <label className="input-label" htmlFor="signup-mobile">Mobile Number</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  className="input"
                  value={form.countryCode}
                  onChange={e => setForm(f => ({ ...f, countryCode: e.target.value }))}
                  style={{ width: '90px', appearance: 'none', paddingLeft: '8px', paddingRight: '8px' }}
                >
                  <option value="+1">+1 (US)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+91">+91 (IN)</option>
                  <option value="+61">+61 (AU)</option>
                  <option value="+81">+81 (JP)</option>
                </select>
                <input
                  id="signup-mobile"
                  className={`input ${touched.mobileNumber && valErrors.mobileNumber ? 'error' : ''}`}
                  type="tel"
                  placeholder="9876543210"
                  value={form.mobileNumber}
                  onChange={e => {
                    setForm(f => ({ ...f, mobileNumber: e.target.value.replace(/\D/g, '') }));
                    if (touched.mobileNumber) setValErrors(prev => ({ ...prev, mobileNumber: validateMobile(e.target.value) }));
                  }}
                  onBlur={() => handleBlur('mobileNumber')}
                  style={{ flex: 1 }}
                  required
                />
              </div>
              {touched.mobileNumber && valErrors.mobileNumber && <span className="input-error-text">{valErrors.mobileNumber}</span>}
            </div>

            <div className="input-group stagger-3">
              <label className="input-label" htmlFor="signup-password">Password</label>
              <div className="login-pw-wrap">
                <input
                  id="signup-password"
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
              <div className="password-strength-container">
                <div className="password-strength-segment" style={{ background: pwdScore >= 1 ? pwdColors[pwdScore] : pwdColors[0] }} />
                <div className="password-strength-segment" style={{ background: pwdScore >= 2 ? pwdColors[pwdScore] : pwdColors[0] }} />
                <div className="password-strength-segment" style={{ background: pwdScore >= 3 ? pwdColors[pwdScore] : pwdColors[0] }} />
              </div>
              {touched.password && valErrors.password ? (
                <span className="input-error-text">{valErrors.password}</span>
              ) : (
                <div className="password-hint">8+ characters, letters & numbers</div>
              )}
            </div>

            <div className="input-group stagger-3">
              <label className="input-label" htmlFor="signup-confirm-password">Confirm Password</label>
              <div className="login-pw-wrap">
                <input
                  id="signup-confirm-password"
                  className={`input ${touched.confirmPassword && valErrors.confirmPassword ? 'error' : ''}`}
                  type={showCPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={e => {
                    setForm(f => ({ ...f, confirmPassword: e.target.value }));
                    if (touched.confirmPassword) setValErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(e.target.value, form.password) }));
                  }}
                  onBlur={() => handleBlur('confirmPassword')}
                  required
                />
                <button
                  type="button"
                  className="login-pw-toggle"
                  onClick={() => setShowCPw(s => !s)}
                  tabIndex={-1}
                >
                  {showCPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {touched.confirmPassword && valErrors.confirmPassword && <span className="input-error-text">{valErrors.confirmPassword}</span>}
            </div>

            {role === 'admin' && (
              <>
                <div className="input-group stagger-3">
                  <label className="input-label" htmlFor="signup-company-name">Company / Organization Name</label>
                  <input
                    id="signup-company-name"
                    className="input"
                    type="text"
                    placeholder="Acme Corp"
                    value={form.companyName}
                    onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                    required
                  />
                </div>
                <div className="input-group stagger-3">
                  <label className="input-label" htmlFor="signup-company-size">Company Size</label>
                  <select
                    id="signup-company-size"
                    className="input"
                    value={form.companySize}
                    onChange={e => setForm(f => ({ ...f, companySize: e.target.value }))}
                    style={{ appearance: 'none' }}
                  >
                    <option value="1-10">1-10</option>
                    <option value="11-50">11-50</option>
                    <option value="51-200">51-200</option>
                    <option value="200+">200+</option>
                  </select>
                </div>
              </>
            )}

            {(role === 'manager' || role === 'employee') && (
              <>
                <div className="input-group stagger-3 signup-grid-full">
                  <label className="input-label" htmlFor="signup-org">Organization</label>
                  <select
                    id="signup-org"
                    className="input"
                    value={form.orgId}
                    onChange={e => setForm(f => ({ ...f, orgId: e.target.value }))}
                    style={{ appearance: 'none' }}
                    required
                  >
                    <option value="">-- Select Organization --</option>
                    {orgs.map(org => (
                      <option key={org._id} value={org._id}>{org.name}</option>
                    ))}
                  </select>
                  {orgs.length === 0 && <div className="password-hint">Can't find your company? Ask your Admin to invite you.</div>}
                </div>

                <div className="input-group stagger-3">
                    <label className="input-label" htmlFor="signup-department">Department</label>
                    <select
                      id="signup-department"
                      className="input"
                      value={form.department}
                      onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                      style={{ appearance: 'none' }}
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Design">Design</option>
                      <option value="Sales">Sales</option>
                      <option value="Marketing">Marketing</option>
                      <option value="HR">HR</option>
                      <option value="Operations">Operations</option>
                      <option value="Finance">Finance</option>
                      <option value="Other">Other</option>
                    </select>
                </div>
                <div className="input-group stagger-3">
                    <label className="input-label" htmlFor="signup-job-title">Job Title (Optional)</label>
                    <input
                      id="signup-job-title"
                      className="input"
                      type="text"
                      placeholder="e.g. Developer"
                      value={form.jobTitle}
                      onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))}
                    />
                </div>
              </>
            )}

            <div className="input-group stagger-4 signup-grid-full" style={{ marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.consent1} onChange={e => { setForm(f => ({ ...f, consent1: e.target.checked })); setValErrors(prev => ({...prev, consent: ''})) }} style={{ marginTop: '4px', transform: 'scale(1.2)', accentColor: '#3B82F6' }} required />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary, #cbd5e1)', lineHeight: '1.5' }}>I agree to the <a href="#" style={{ color: '#3B82F6', textDecoration: 'none' }}>Terms of Service</a> and <a href="#" style={{ color: '#3B82F6', textDecoration: 'none' }}>Privacy Policy</a>.</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', marginTop: '8px' }}>
                <input type="checkbox" checked={form.consent2} onChange={e => { setForm(f => ({ ...f, consent2: e.target.checked })); setValErrors(prev => ({...prev, consent: ''})) }} style={{ marginTop: '4px', transform: 'scale(1.2)', accentColor: '#3B82F6' }} required />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary, #cbd5e1)', lineHeight: '1.5' }}>I understand WorkPulse monitors work activity for productivity insights, and I will always have access to my own data.</span>
              </label>
              {valErrors.consent && <span className="input-error-text" style={{ marginTop: '8px' }}>{valErrors.consent}</span>}
            </div>

            {error && <div className="login-error stagger-4 signup-grid-full">{error}</div>}

            {success ? (
              <div className="stagger-4 signup-grid-full" style={{ padding: '14px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', textAlign: 'center', marginTop: '8px', fontWeight: 500, lineHeight: 1.4 }}>
                Account created successfully!<br/>
                {role === 'admin' ? 'Redirecting to your workspace...' : 'Please wait for an Admin to approve your account before logging in. Redirecting to login...'}
              </div>
            ) : (
              <button
                id="signup-submit-btn"
                type="submit"
                className="btn-submit stagger-4 signup-grid-full"
                disabled={loading}
                style={{ marginTop: '8px' }}
              >
                {loading ? <><Loader size={16} className="spin-icon" /> Creating account...</> : 'Sign Up'}
              </button>
            )}

            <div className="stagger-4 signup-grid-full" style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>Sign In</Link>
            </div>
            
            </div>
          </form>
          )}
        </div>
  );
}
