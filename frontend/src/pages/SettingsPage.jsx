import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { adminAPI, employeeAPI } from '../api/index';
import HeaderActions from '../components/HeaderActions';
import { Save, User, Moon, Bell, Shield, Info } from 'lucide-react';
import './SettingsPage.css';

export default function SettingsPage() {
  const { user, updatePreferences } = useAuth();
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [adminSettings, setAdminSettings] = useState(null);
  
  const [form, setForm] = useState({
    theme: theme || 'dark',
    notifications: user?.preferences?.notifications ?? true,
    emailDigest: user?.preferences?.emailDigest || 'weekly'
  });

  const [orgForm, setOrgForm] = useState({
    idleThresholdMinutes: 30,
    screenshotIntervalMinutes: 10,
  });

  useEffect(() => {
    if (user?.role === 'employee' || user?.role === 'admin') {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      if (user?.role === 'admin') {
        const res = await adminAPI.getSettings();
        const s = res.data.settings;
        setAdminSettings(s);
        setOrgForm({
          idleThresholdMinutes: s.idleTimeoutMinutes || 30,
          screenshotIntervalMinutes: s.screenshotIntervalMinutes || 10,
        });
      } else if (user?.role === 'employee') {
        const res = await employeeAPI.getSettings();
        setAdminSettings(res.data.settings);
      }
    } catch (err) {
      console.error('Failed to fetch org settings', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updatePreferences({ ...form, theme: form.theme });
      setTheme(form.theme);
      alert('Settings saved successfully.');
    } catch {
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleOrgSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPI.updateSettings(orgForm);
      alert('Organization settings saved.');
    } catch {
      alert('Failed to save organization settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="breadcrumbs">Account / Settings</div>
          <h1>Settings</h1>
        </div>
        <HeaderActions />
      </div>

      <div className="page page-enter">
        <div className="settings-layout">
          {/* Sidebar */}
          <div className="settings-sidebar">
            <button type="button" className={`settings-nav-btn ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}><User size={18} /> Profile</button>
            <button type="button" className={`settings-nav-btn ${tab === 'appearance' ? 'active' : ''}`} onClick={() => setTab('appearance')}><Moon size={18} /> Appearance</button>
            <button type="button" className={`settings-nav-btn ${tab === 'notifications' ? 'active' : ''}`} onClick={() => setTab('notifications')}><Bell size={18} /> Notifications</button>
            
            {user?.role === 'employee' && (
              <button type="button" className={`settings-nav-btn ${tab === 'org' ? 'active' : ''}`} onClick={() => setTab('org')}><Shield size={18} /> Privacy & Monitoring</button>
            )}
            {user?.role === 'admin' && (
              <button type="button" className={`settings-nav-btn ${tab === 'org' ? 'active' : ''}`} onClick={() => setTab('org')}><Shield size={18} /> Organization Rules</button>
            )}
          </div>

          {/* Content Area */}
          <div className="settings-content">
            
            {/* Profile Settings */}
            {tab === 'profile' && (
              <div className="glass-panel card-3d">
                <div className="section-header" style={{ marginBottom: 20 }}>
                  <div className="section-title">Profile</div>
                </div>
                <div className="input-group">
                  <label className="input-label">Name</label>
                  <input className="input" type="text" value={user?.name || ''} disabled />
                  <div className="input-help">Contact your admin to change your legal name.</div>
                </div>
                <div className="input-group">
                  <label className="input-label">Email</label>
                  <input className="input" type="email" value={user?.email || ''} disabled />
                </div>
                <div className="input-group">
                  <label className="input-label">Role</label>
                  <input className="input" type="text" value={user?.role || ''} disabled style={{ textTransform: 'capitalize' }} />
                </div>
              </div>
            )}

            {/* App Preferences */}
            {tab === 'appearance' && (
              <div className="glass-panel card-3d">
                <div className="section-header" style={{ marginBottom: 20 }}>
                  <div className="section-title">Appearance</div>
                </div>
                <div className="input-group">
                  <label className="input-label" style={{ marginBottom: 12 }}>Theme</label>
                  <div className="segmented-control">
                    <button type="button" className={`segment-btn ${form.theme === 'light' ? 'active' : ''}`} onClick={() => { setForm(f => ({ ...f, theme: 'light' })); setTheme('light'); }}>Light</button>
                    <button type="button" className={`segment-btn ${form.theme === 'dark' ? 'active' : ''}`} onClick={() => { setForm(f => ({ ...f, theme: 'dark' })); setTheme('dark'); }}>Dark</button>
                    <button type="button" className={`segment-btn ${form.theme === 'system' ? 'active' : ''}`} onClick={() => { setForm(f => ({ ...f, theme: 'system' })); setTheme('system'); }}>System</button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {tab === 'notifications' && (
              <div className="glass-panel card-3d">
                <div className="section-header" style={{ marginBottom: 20 }}>
                  <div className="section-title">Notifications</div>
                </div>
                <div className="settings-row">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>In-App Alerts</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Show toast notifications for events</div>
                  </div>
                  <div 
                    className={`settings-toggle ${form.notifications ? 'active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, notifications: !f.notifications }))}
                  />
                </div>
                <div className="divider" style={{ margin: '16px 0', borderTop: '1px solid var(--border)' }} />
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Email Digest Frequency</label>
                  <select 
                    className="input" 
                    value={form.emailDigest}
                    onChange={e => setForm(f => ({ ...f, emailDigest: e.target.value }))}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="never">Never</option>
                  </select>
                </div>
              </div>
            )}

            {/* Role Specific Settings */}
            {tab === 'org' && (
              <div className="glass-panel card-3d">
                <div className="section-header" style={{ marginBottom: 20 }}>
                  <div className="section-title">{user?.role === 'employee' ? 'Privacy & Monitoring' : 'Organization Rules'}</div>
                </div>
                
                {user?.role === 'employee' && (
                  <div className="org-rules-notice">
                    <Info size={16} style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Transparency Notice</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {adminSettings ? (
                          <>
                            Your organization tracks idle time after <b>{adminSettings.idleTimeoutMinutes} minutes</b> of inactivity. 
                            {adminSettings.screenshotIntervalMinutes === 0 
                              ? ' Screenshots are captured at random intervals. '
                              : <> Screenshots are captured every <b>{adminSettings.screenshotIntervalMinutes} minutes</b>. </>
                            }
                            Data is retained for <b>{adminSettings.retentionDays} days</b>.
                          </>
                        ) : 'Loading organization settings...'}
                      </div>
                    </div>
                  </div>
                )}

                {user?.role === 'admin' && (
                  <>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Configure monitoring and tracking settings for your organization</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div className="input-group">
                        <label className="input-label">Idle Timeout Threshold</label>
                        <select
                          className="input"
                          value={orgForm.idleThresholdMinutes}
                          onChange={e => setOrgForm(f => ({ ...f, idleThresholdMinutes: parseInt(e.target.value) }))}
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label className="input-label">Screenshot Capture Interval</label>
                        <select
                          className="input"
                          value={orgForm.screenshotIntervalMinutes}
                          onChange={e => setOrgForm(f => ({ ...f, screenshotIntervalMinutes: parseInt(e.target.value) }))}
                        >
                          <option value={0}>Random Intervals</option>
                          <option value={5}>5 minutes</option>
                          <option value={10}>10 minutes</option>
                          <option value={20}>20 minutes</option>
                        </select>
                      </div>
                      <div className="settings-footer">
                        <button type="button" className="btn btn-primary" onClick={handleOrgSave} disabled={saving}>
                          <Save size={16} />
                          {saving ? 'Saving...' : 'Save Org Settings'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Save Button */}
            {tab !== 'org' && (
              <div className="settings-footer">
                <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
