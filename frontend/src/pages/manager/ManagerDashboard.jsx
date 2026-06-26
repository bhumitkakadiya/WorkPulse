import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { managerAPI } from '../../api/index.js';
import HeaderActions from '../../components/HeaderActions';
import ManagerAlerts from '../../components/ManagerAlerts';
import AnimatedNumber from '../../components/AnimatedNumber';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Users, TrendingUp, Activity, Shield, RefreshCw, Download, ArrowRight } from 'lucide-react';
import PageHeader from '../../components/dashboard/PageHeader';
import StatCard from '../../components/dashboard/StatCard';
import './ManagerDashboard.css';

function formatDuration(secs) {
  const h = Math.floor(secs / 3600); const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`; return `${m}m`;
}
function scoreColor(s) { if (s >= 75) return 'var(--success)'; if (s >= 45) return 'var(--warning)'; return 'var(--danger)'; }

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [team, setTeam] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [teamRes, analyticsRes] = await Promise.all([
        managerAPI.getTeam(),
        managerAPI.getAnalytics(),
      ]);
      setTeam(teamRes.data.team || []);
      setAnalytics(analyticsRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const employees = team.filter(m => m.role === 'employee');
  const online = employees.filter(m => m.onlineStatus === 'online').length;
  const avgScore = employees.length
    ? Math.round(employees.reduce((a, m) => a + (m.todayScore || 0), 0) / employees.length)
    : 0;

  const handleExport = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await managerAPI.exportData(today);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `workpulse-export-${today}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (e) {
      console.error('Export failed', e);
    }
  };

  return (
    <>
        <PageHeader breadcrumbs="Team / Overview" title="Dashboard" />

        <div className="page page-enter">
          {/* Stat row */}
          <div className="admin-stats-row">
            {[
              { label: 'Total Employees', value: employees.length, icon: Users, iconClass: 'blue' },
              { label: 'Online Now', value: online, icon: Activity, iconClass: 'green' },
              { label: "Today's Avg Score", value: `${avgScore}%`, icon: TrendingUp, iconClass: 'purple' },
              { label: 'Total Alerts', value: team.length, icon: Shield, iconClass: 'amber' },
            ].map(stat => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>

          <div className="data-grid">
            {/* Team Score Trend */}
            <div className="glass-panel" style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, marginBottom: 4 }}>7-Day Team Score Trend</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Average productivity score across all team members</div>
                </div>
                <button className="btn btn-outline" onClick={load} disabled={loading}>
                  <RefreshCw size={14} className={loading ? 'spin-icon' : ''} /> Refresh
                </button>
              </div>
              {analytics?.trendData && (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={analytics.trendData}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                    <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, backdropFilter: 'blur(10px)' }}
                      labelStyle={{ color: 'var(--text)' }}
                    />
                    <Area type="monotone" dataKey="avgScore" name="Avg Score" stroke="var(--accent-primary)" fill="url(#scoreGrad)" strokeWidth={3} dot={{ fill: 'var(--bg-primary)', stroke: 'var(--accent-primary)', strokeWidth: 2, r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Live Team Presence (New Feature) */}
            <div className="glass-panel card-3d">
              <h3 style={{ fontSize: 18, marginBottom: 16 }}>Live Team Presence</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {employees.slice(0, 5).map(emp => (
                  <div key={emp._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, borderRadius: 8, background: 'var(--bg-page)' }}>
                    <div style={{ position: 'relative' }}>
                      <div className="user-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>{emp.name.charAt(0)}</div>
                      <div className={`status-dot status-dot-${emp.onlineStatus}`} style={{ position: 'absolute', bottom: -2, right: -2, border: '2px solid var(--bg-secondary)' }}>
                         {emp.onlineStatus === 'online' && <div className="ping" />}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{emp.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{emp.onlineStatus === 'online' ? 'Working (Active)' : 'Away / Idle'}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 'bold', color: scoreColor(emp.todayScore || 0) }}>
                      {emp.todayScore || 0}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Alerts Panel */}
          <div className="glass-panel" style={{ marginTop: 24 }}>
            <ManagerAlerts />
          </div>

          {/* Employee Cards */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 22, marginBottom: 4 }}>Team Directory</h2>
              <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Select a team member to view their detailed timeline</div>
            </div>
            <button className="btn btn-outline" onClick={handleExport}>
              <Download size={14} /> Export CSV
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
          ) : (
            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Employee</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Current Status</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Today's Score</th>
                    <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp._id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="user-avatar">{emp.name.charAt(0)}</div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text)' }}>{emp.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{emp.department}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className={`status-dot status-dot-${emp.onlineStatus}`} style={{ width: 10, height: 10 }} />
                          <span style={{ fontSize: 13, color: emp.onlineStatus === 'online' ? 'var(--success)' : 'var(--text-muted)' }}>
                            {emp.onlineStatus === 'online' ? 'Active Now' : 'Idle / Offline'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ fontSize: 16, fontWeight: 'bold', color: scoreColor(emp.todayScore || 0), minWidth: 40 }}>
                            {emp.todayScore != null ? <><AnimatedNumber value={emp.todayScore} duration={600} />%</> : '—'}
                          </div>
                          {emp.todayScore != null && (
                            <div style={{ width: 100, height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${emp.todayScore}%`, height: '100%', background: scoreColor(emp.todayScore), borderRadius: 3 }} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <Link to={`/manager/team/${emp._id}/activity`} className="btn btn-outline btn-sm">
                          View timeline <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
  );
}
