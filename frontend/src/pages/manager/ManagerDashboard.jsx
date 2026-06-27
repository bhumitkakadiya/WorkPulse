import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { managerAPI } from '../../api/index.js';
import HeaderActions from '../../components/HeaderActions';
import ManagerAlerts from '../../components/ManagerAlerts';
import AnimatedNumber from '../../components/AnimatedNumber';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Users, TrendingUp, Activity, Shield, RefreshCw, Download, ArrowRight } from 'lucide-react';
import PageHeader from '../../components/dashboard/PageHeader';
import StatCard from '../../components/dashboard/StatCard';
import LoadingSkeleton from '../../components/LoadingSkeleton';
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
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  const load = async () => {
    setLoading(true);
    try {
      const [teamRes, analyticsRes, alertsRes] = await Promise.all([
        managerAPI.getTeam(),
        managerAPI.getAnalytics({ days }),
        managerAPI.getAlerts().catch(() => ({ data: { alerts: [] } })),
      ]);
      setTeam(teamRes.data.team || []);
      setAnalytics(analyticsRes.data);
      setAlerts(alertsRes.data.alerts || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); };
  };

  useEffect(() => { load(); }, [days]);

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
              { label: 'Total Employees', value: employees.length, icon: Users, iconClass: 'blue', borderClass: 'border-blue', trendText: '+1 this week', trendColor: 'var(--success)', delay: '0ms' },
              { label: 'Online Now', value: online, icon: Activity, iconClass: 'green', borderClass: 'border-green', trendText: 'All active', trendColor: 'var(--success)', delay: '80ms' },
              { label: "Today's Avg Score", value: `${avgScore}%`, icon: TrendingUp, iconClass: 'purple', borderClass: 'border-purple', trendText: 'Target 75%', trendColor: 'var(--text-muted)', delay: '160ms' },
              { label: 'Active Alerts', value: alerts.filter(a => !a.isRead).length, icon: Shield, iconClass: 'amber', borderClass: 'border-amber', trendText: 'Requires attention', trendColor: 'var(--warning)', delay: '240ms' },
            ].map((stat, i) => (
              <div key={stat.label} className="animate-fade-in-up" style={{ animationDelay: stat.delay }}>
                <StatCard {...stat} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            {/* Team Score Trend */}
            <div className="glass-panel" style={{ flex: '1 1 600px', minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, marginBottom: 4 }}>Productivity Trend</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Average productivity score across all team members</div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div className="admin-filter-tabs">
                    <button className={`admin-filter-tab ${days === 7 ? 'active' : ''}`} onClick={() => setDays(7)}>7D</button>
                    <button className={`admin-filter-tab ${days === 14 ? 'active' : ''}`} onClick={() => setDays(14)}>14D</button>
                    <button className={`admin-filter-tab ${days === 30 ? 'active' : ''}`} onClick={() => setDays(30)}>30D</button>
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
                    <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
                  </button>
                </div>
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
                    <ReferenceLine y={75} label={{ position: 'insideTopRight', value: 'Target', fill: 'var(--warning)', fontSize: 11 }} stroke="var(--warning)" strokeDasharray="3 3" />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, backdropFilter: 'blur(10px)', boxShadow: 'var(--shadow)' }}
                      labelStyle={{ color: 'var(--text)' }}
                      formatter={(value) => [`${value}%`, 'Avg Score']}
                    />
                    <Area type="monotone" dataKey="avgScore" name="Avg Score" stroke="var(--accent-primary)" fill="url(#scoreGrad)" strokeWidth={3} dot={{ fill: 'var(--surface)', stroke: 'var(--accent-primary)', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Live Team Presence (New Feature) */}
            <div className="glass-panel card-3d" style={{ flex: '1 1 300px', minWidth: 0 }}>
              <h3 style={{ fontSize: 18, marginBottom: 16 }}>Live Team Presence</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {employees.slice(0, 5).map(emp => (
                  <div key={emp._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, borderRadius: 8, background: 'var(--bg-page)' }}>
                    <div style={{ position: 'relative' }}>
                      <div className="user-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>{emp.name.charAt(0)}</div>
                      <div style={{ position: 'absolute', bottom: -2, right: -2 }}>
                        {emp.onlineStatus === 'online' ? <div className="status-dot-pulse active" /> : <div className={`status-dot status-dot-${emp.onlineStatus}`} />}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{emp.department || '—'}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <div style={{ fontSize: 15, fontWeight: 'bold', color: scoreColor(emp.todayScore || 0) }}>
                        {emp.todayScore || 0}%
                      </div>
                      <Link to={`/manager/team/${emp._id}/activity`} style={{ fontSize: 11, color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>
                        Timeline
                      </Link>
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
            <div style={{ marginTop: 24 }}>
              <LoadingSkeleton type="table" count={5} />
            </div>
          ) : (
            <div className="admin-table-card" style={{ padding: 0, overflowY: 'auto', maxHeight: 400 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr>
                    <th>Employee</th>
                    <th>Current Status</th>
                    <th>Today's Score</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp._id}>
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
