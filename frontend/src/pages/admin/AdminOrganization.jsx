import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/index.js';
import DashboardLayout from '../../components/DashboardLayout';
import HeaderActions from '../../components/HeaderActions';
import { Save, Building2, Camera, Database, Clock, CheckCircle } from 'lucide-react';

import '../../components/dashboard/dashboard-shared.css';

export default function AdminOrganization() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({
    orgName: '',
    screenshotsEnabled: true,
    screenshotIntervalMinutes: 20,
    retentionDays: 90,
    workdayStart: '09:00',
    workdayEnd: '18:00',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    adminAPI.getSettings().then(res => {
      const s = res.data.settings;
      setSettings(s);
      setForm({
        orgName: s.orgName || '',
        screenshotsEnabled: s.screenshotsEnabled ?? true,
        screenshotIntervalMinutes: s.screenshotIntervalMinutes || 20,
        retentionDays: s.retentionDays || 90,
        workdayStart: s.workdayStart || '09:00',
        workdayEnd: s.workdayEnd || '18:00',
      });
    }).catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setSaved(false);
    try {
      await adminAPI.updateSettings(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="breadcrumbs">Admin / Organization</div>
          <h1>Organization Settings</h1>
        </div>
        <HeaderActions />
      </div>

      <div className="page page-enter">
        <form onSubmit={handleSave} style={{ maxWidth: 680 }}>

          {/* General */}
          <div className="admin-settings-card">
            <div className="admin-settings-card-title"><Building2 size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />General</div>
            <div className="admin-settings-card-sub">Basic organization profile information.</div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Organization Name</label>
              <input className="input" type="text" value={form.orgName}
                onChange={e => setForm(p => ({ ...p, orgName: e.target.value }))} placeholder="WorkPulse Org" />
            </div>
          </div>

          {/* Monitoring */}
          <div className="admin-settings-card">
            <div className="admin-settings-card-title"><Camera size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Monitoring Policy</div>
            <div className="admin-settings-card-sub">Configure screenshot capture and activity tracking for all employees.</div>

            <div className="admin-settings-row">
              <div>
                <div className="admin-settings-row-label">Enable Screenshots</div>
                <div className="admin-settings-row-sub">Capture periodic screenshots on employee desktops</div>
              </div>
              <button type="button" className={`admin-toggle ${form.screenshotsEnabled ? 'on' : ''}`}
                onClick={() => setForm(p => ({ ...p, screenshotsEnabled: !p.screenshotsEnabled }))} />
            </div>

            <div className="admin-settings-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 10 }}>
              <div>
                <div className="admin-settings-row-label">Screenshot Interval</div>
                <div className="admin-settings-row-sub">How often to capture screenshots</div>
              </div>
              <select className="input" style={{ maxWidth: 220 }} value={form.screenshotIntervalMinutes}
                onChange={e => setForm(p => ({ ...p, screenshotIntervalMinutes: Number(e.target.value) }))}>
                <option value={10}>Every 10 minutes</option>
                <option value={20}>Every 20 minutes</option>
                <option value={30}>Every 30 minutes</option>
                <option value={60}>Every hour</option>
              </select>
            </div>
          </div>

          {/* Data Retention */}
          <div className="admin-settings-card">
            <div className="admin-settings-card-title"><Database size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Data Retention</div>
            <div className="admin-settings-card-sub">Auto-delete raw activity logs and screenshots after the selected period.</div>
            <div className="admin-settings-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 10 }}>
              <div>
                <div className="admin-settings-row-label">Retention Period</div>
                <div className="admin-settings-row-sub">Older data will be automatically purged</div>
              </div>
              <select className="input" style={{ maxWidth: 220 }} value={form.retentionDays}
                onChange={e => setForm(p => ({ ...p, retentionDays: Number(e.target.value) }))}>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
              </select>
            </div>
          </div>

          {/* Work Hours */}
          <div className="admin-settings-card">
            <div className="admin-settings-card-title"><Clock size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Default Working Hours</div>
            <div className="admin-settings-card-sub">Used to contextualize idle time calculations. Activity outside these hours won't count against productivity.</div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div className="input-group" style={{ flex: 1, minWidth: 140, marginBottom: 0 }}>
                <label className="input-label">Work Day Start</label>
                <input className="input" type="time" value={form.workdayStart}
                  onChange={e => setForm(p => ({ ...p, workdayStart: e.target.value }))} />
              </div>
              <div className="input-group" style={{ flex: 1, minWidth: 140, marginBottom: 0 }}>
                <label className="input-label">Work Day End</label>
                <input className="input" type="time" value={form.workdayEnd}
                  onChange={e => setForm(p => ({ ...p, workdayEnd: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Save */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
            {saved && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success, #0D9488)', fontSize: 14, fontWeight: 500 }}>
                <CheckCircle size={16} /> Saved successfully!
              </span>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
