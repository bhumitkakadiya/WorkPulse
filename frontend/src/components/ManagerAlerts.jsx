import { useState, useEffect } from 'react';
import { managerAPI } from '../api/index.js';
import axios from 'axios';
import { Bell, CheckCircle, AlertTriangle, Info, Clock, HeartPulse, BarChart2 } from 'lucide-react';
import './dashboard/dashboard-shared.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

function timeAgo(dt) {
  const diff = Date.now() - new Date(dt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ManagerAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [burnoutFlags, setBurnoutFlags] = useState([]);
  const [pulseResults, setPulseResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts', 'wellbeing'

  const load = async () => {
    setLoading(true);
    try {
      const res = await managerAPI.getAlerts();
      setAlerts(res.data.alerts || []);
      
      const [flagsRes, pulseRes] = await Promise.all([
        axios.get('/api/wellbeing/burnout-flags'),
        axios.get('/api/wellbeing/pulse-results')
      ]);
      setBurnoutFlags(flagsRes.data.flags || []);
      setPulseResults(pulseRes.data.results || []);
    } catch (e) {
      console.error('Failed to load alerts/wellbeing data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleMarkRead = async (id) => {
    try {
      await managerAPI.markAlertRead(id);
      setAlerts(alerts.map(a => a._id === id ? { ...a, isRead: true } : a));
    } catch {}
  };

  const handleAcknowledgeFlag = async (id) => {
    try {
      await axios.put(`/api/wellbeing/burnout-flags/${id}/acknowledge`);
      setBurnoutFlags(burnoutFlags.filter(f => f._id !== id));
    } catch {}
  };

  const unreadCount = alerts.filter(a => !a.isRead).length;
  const flagCount = burnoutFlags.length;

  if (loading) {
    return <div className="loading-center" style={{ height: 150 }}><div className="spinner" /></div>;
  }

  const chartData = pulseResults.map(r => ({
    name: new Date(r.weekStartDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    Mood: r.avgMood,
    Workload: r.avgWorkload
  })).reverse();

  return (
    <div className="admin-alerts-panel">
      <div className="admin-alerts-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        <div style={{ display: 'flex', gap: 24 }}>
          <button 
            onClick={() => setActiveTab('alerts')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', border: 'none', background: 'none', color: activeTab === 'alerts' ? 'var(--text)' : 'var(--text-muted)', borderBottom: activeTab === 'alerts' ? '2px solid var(--accent-primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600 }}
          >
            <Bell size={18} />
            <span>Alerts</span>
            {unreadCount > 0 && <span className="badge badge-danger">{unreadCount}</span>}
          </button>
          
          <button 
            onClick={() => setActiveTab('wellbeing')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', border: 'none', background: 'none', color: activeTab === 'wellbeing' ? 'var(--text)' : 'var(--text-muted)', borderBottom: activeTab === 'wellbeing' ? '2px solid var(--accent-primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600 }}
          >
            <HeartPulse size={18} />
            <span>Team Wellbeing</span>
            {flagCount > 0 && <span className="badge badge-warning">{flagCount}</span>}
          </button>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load} style={{ fontSize: 12 }}>Refresh</button>
      </div>
      
      <div style={{ paddingTop: 16 }}>
        {activeTab === 'alerts' ? (
          alerts.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No active alerts for your team.</div>
          ) : (
            alerts.slice(0, 10).map(alert => (
              <div key={alert._id} className="admin-alert-item" style={{ opacity: alert.isRead ? 0.6 : 1 }}>
                <div className="admin-alert-dot" style={{ background: alert.isRead ? 'var(--text-muted)' : 'var(--danger)' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="admin-alert-title">
                    {alert.employeeId?.name ? <span style={{ fontWeight: 600 }}>{alert.employeeId.name}: </span> : ''}
                    {alert.title}
                  </div>
                  <div className="admin-alert-msg">{alert.message}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{timeAgo(alert.createdAt)}</div>
                </div>
                {!alert.isRead && (
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleMarkRead(alert._id)} title="Mark as read">
                    <CheckCircle size={16} />
                  </button>
                )}
              </div>
            ))
          )
        ) : (
          <div style={{ padding: '0 16px' }}>
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 12, fontSize: 14, color: 'var(--text-muted)' }}>Action Required: Burnout Risk Flags</h4>
              {burnoutFlags.length === 0 ? (
                <div style={{ padding: 16, background: 'var(--surface-50)', borderRadius: 8, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>No burnout flags detected.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {burnoutFlags.map(flag => (
                    <div key={flag._id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: 16, background: 'var(--surface-50)', borderRadius: 8, borderLeft: `3px solid ${flag.severity === 'high' ? 'var(--danger)' : 'var(--warning)'}` }}>
                      <div>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {flag.userId?.name}
                          <span className={`badge ${flag.severity === 'high' ? 'badge-danger' : 'badge-warning'}`}>{flag.severity} Risk</span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                          Detected: {new Date(flag.triggeredAt).toLocaleDateString()}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                          {flag.reason.map(r => (
                            <span key={r} style={{ fontSize: 11, background: 'var(--surface)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-muted)' }}>{r.replace(/_/g, ' ')}</span>
                          ))}
                        </div>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => handleAcknowledgeFlag(flag._id)}>Acknowledge</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 style={{ marginBottom: 12, fontSize: 14, color: 'var(--text-muted)' }}>Weekly Pulse Survey Averages</h4>
              {pulseResults.length === 0 ? (
                <div style={{ padding: 16, background: 'var(--surface-50)', borderRadius: 8, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>No pulse survey data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{ background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }} />
                    <Bar dataKey="Mood" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Workload" fill="var(--warning)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
