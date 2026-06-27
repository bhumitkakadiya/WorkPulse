import { useState, useEffect } from 'react';
import { managerAPI } from '../api/index.js';
import HeaderActions from '../components/HeaderActions';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell
} from 'recharts';
import { Users, TrendingUp, Clock, Zap, RefreshCw, AlertTriangle, Download } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import './PerformancePage.css';

function fmtSecs(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)', fontSize: 11 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontSize: 12 }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function PerformancePage() {
  const [data, setData] = useState(null);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(7);

  const load = async () => {
    setLoading(true);
    try {
      const [aRes, tRes] = await Promise.all([
        managerAPI.getAnalytics(),
        managerAPI.getTeam(),
      ]);
      setData(aRes.data);
      setTeam((tRes.data.team || []).filter(m => m.role === 'employee'));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [range]);

  const avgScore = team.length
    ? Math.round(team.reduce((a, m) => a + (m.todayScore || 0), 0) / team.length)
    : 0;
  const onlineCount = team.filter(m => m.onlineStatus === 'online').length;

  // Use actual avg active time from analytics data
  const avgActiveStr = data?.avgActiveSecondsToday !== undefined 
    ? fmtSecs(data.avgActiveSecondsToday) 
    : '—';

  // Build per-member radar data from today's scores
  const radarData = team.slice(0, 6).map(m => ({
    name: m.name.split(' ')[0],
    score: m.todayScore || 0,
  }));

  const deptData = {};
  team.forEach(m => {
    const dept = m.department || 'Unassigned';
    if (!deptData[dept]) deptData[dept] = { name: dept, totalScore: 0, count: 0 };
    if (m.todayScore != null) {
      deptData[dept].totalScore += m.todayScore;
      deptData[dept].count += 1;
    }
  });
  const deptChartData = Object.values(deptData).map(d => ({
    name: d.name,
    avgScore: d.count > 0 ? Math.round(d.totalScore / d.count) : 0
  }));

  const handleExport = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await managerAPI.exportData(today);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `workpulse-analytics-${today}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (e) { console.error('Export failed', e); }
  };

  return (
    <>
        <div className="page-header">
          <div>
            <div className="breadcrumbs">Team / Analytics</div>
            <h1>Team Analytics</h1>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn btn-outline btn-sm" onClick={handleExport}><Download size={14}/> Export Report</button>
            <HeaderActions />
          </div>
        </div>
        <div className="page page-enter">

          {/* KPI row */}
          <div className="admin-stats-row" style={{ marginBottom: 24 }}>
            {[
              { label: 'Team Avg Score', value: avgScore, icon: TrendingUp, iconClass: 'blue', borderClass: 'border-blue' },
              { label: 'Members Online', value: `${onlineCount}/${team.length}`, icon: Users, iconClass: 'green', borderClass: 'border-green' },
              { label: 'Top App', value: data?.topApps?.[0]?.appName?.split(' ')[0] || '—', icon: Zap, iconClass: 'purple', borderClass: 'border-purple' },
              { label: 'Avg Active Time', value: avgActiveStr, icon: Clock, iconClass: 'amber', borderClass: 'border-amber' },
            ].map((stat, i) => (
              <div key={stat.label} className="animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                <StatCard {...stat} />
              </div>
            ))}
          </div>

          <div className="analytics-main-grid">
            {/* 7-day trend */}
            <div className="glass-panel" style={{ gridColumn: 'span 2' }}>
              <div className="section-header">
                <div>
                  <div className="section-title">7-Day Productivity Trend</div>
                  <div className="section-subtitle">Average score across entire team</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
                  <RefreshCw size={13} className={loading ? 'spin-icon' : ''} /> Refresh
                </button>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data?.trendData || []}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area dataKey="avgScore" name="Avg Score" stroke="#3B82F6" fill="url(#areaGrad)" strokeWidth={2.5} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Member score comparison */}
            <div className="glass-panel">
              <div className="section-title" style={{ marginBottom: 16 }}>Member Scores Today</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={team.map(m => ({ name: m.name.split(' ')[0], score: m.todayScore || 0 }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={70} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" name="Score" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top apps across team */}
            <div className="glass-panel" style={{ gridColumn: 'span 2' }}>
              <div className="section-title" style={{ marginBottom: 16 }}>Top Apps Across Team (Today)</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(data?.topApps || []).slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="appName" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={n => n.split(' ')[0]} />
                  <YAxis tickFormatter={v => `${Math.round(v / 60)}m`} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} formatter={v => [fmtSecs(v), 'Duration']} />
                  <Bar dataKey="durationSeconds" name="Duration" radius={[4, 4, 0, 0]}>
                    {(data?.topApps || []).slice(0, 8).map((app, i) => (
                      <Cell key={i} fill={app.category === 'productive' ? 'var(--success)' : app.category === 'distracting' ? 'var(--danger)' : 'var(--accent-primary)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="analytics-legend">
                {[['Productive', '#10B981'], ['Neutral', '#60A5FA'], ['Distracting', '#EF4444']].map(([l, c]) => (
                  <div key={l} className="analytics-legend-item">
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: 'inline-block' }} />
                    {l}
                  </div>
                ))}
              </div>
            </div>

            {/* Individual scores radar */}
            <div className="glass-panel">
              <div className="section-title" style={{ marginBottom: 16 }}>Member Score Radar</div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} />
                  <Radar name="Score" dataKey="score" stroke="var(--accent-primary)" fill="url(#areaGrad)" fillOpacity={0.6} strokeWidth={2} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Department Comparison */}
            <div className="glass-panel" style={{ gridColumn: 'span 2' }}>
              <div className="section-title" style={{ marginBottom: 16 }}>Department Comparison</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deptChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="avgScore" name="Avg Score" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Status table */}
            <div className="admin-table-card" style={{ gridColumn: 'span 3', padding: 0, overflowY: 'auto', maxHeight: 400 }}>
              <div className="section-title" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 11 }}>
                Live Team Status
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 58, zIndex: 10, background: 'var(--bg-secondary)' }}>
                  <tr>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Member</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Department</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Today's Score</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Score Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map(m => {
                      const sc = m.todayScore ?? 0;
                      const color = sc >= 75 ? 'var(--success)' : sc >= 45 ? 'var(--warning)' : 'var(--danger)';
                      return (
                        <tr key={m._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div className="user-avatar">{m.name.charAt(0)}</div>
                              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{m.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{m.department || '—'}</td>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span className={`status-dot status-dot-${m.onlineStatus}`} style={{ width: 10, height: 10 }} />
                              <span style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                                {m.onlineStatus}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <span style={{ fontWeight: 700, color, fontSize: 16 }}>{m.todayScore ?? '—'}</span>
                          </td>
                          <td style={{ padding: '16px 24px', width: 200 }}>
                            <div style={{ width: '100%', height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${sc}%`, height: '100%', background: color, borderRadius: 3 }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </>
  );
}
