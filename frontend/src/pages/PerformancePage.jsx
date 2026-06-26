import { useState, useEffect } from 'react';
import { managerAPI } from '../api/index.js';
import HeaderActions from '../components/HeaderActions';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Users, TrendingUp, Clock, Zap, RefreshCw, AlertTriangle } from 'lucide-react';
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

  // Build per-member radar data from today's scores
  const radarData = team.slice(0, 6).map(m => ({
    name: m.name.split(' ')[0],
    score: m.todayScore || 0,
  }));

  return (
    <>
        <div className="page-header">
          <div>
            <div className="breadcrumbs">Team / Analytics</div>
            <h1>Team Analytics</h1>
          </div>
          <HeaderActions />
        </div>
        <div className="page page-enter">

          {/* KPI row */}
          <div className="grid-4" style={{ marginBottom: 24 }}>
            {[
              { label: 'Team Avg Score', value: `${avgScore}`, icon: TrendingUp, color: '#3B82F6', sub: 'Today' },
              { label: 'Members Online', value: `${onlineCount}/${team.length}`, icon: Users, color: '#10B981', sub: 'Live' },
              { label: 'Top App Usage', value: data?.topApps?.[0]?.appName?.split(' ')[0] || '—', icon: Zap, color: '#818CF8', sub: 'Most used today' },
              { label: 'Avg Active', value: team.length ? '6h 12m' : '—', icon: Clock, color: '#F59E0B', sub: 'Estimated today' },
            ].map(s => (
              <div key={s.label} className="glass-panel card-3d" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: `${s.color}20`, color: s.color, padding: 12, borderRadius: 12 }}>
                  <s.icon size={24} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</div>
                </div>
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
                      <rect key={i} fill={app.category === 'productive' ? '#10B981' : app.category === 'distracting' ? '#EF4444' : '#60A5FA'} />
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
                  <Radar name="Score" dataKey="score" stroke="#818CF8" fill="#818CF8" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Status table */}
            <div className="glass-panel card-3d" style={{ gridColumn: 'span 2' }}>
              <div className="section-title" style={{ marginBottom: 16 }}>Live Team Status</div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Today's Score</th>
                      <th>Score Bar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.map(m => {
                      const sc = m.todayScore ?? 0;
                      const color = sc >= 75 ? 'var(--success)' : sc >= 45 ? 'var(--warning)' : 'var(--danger)';
                      return (
                        <tr key={m._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="analytics-avatar">{m.name.charAt(0)}</div>
                              <span style={{ fontWeight: 600 }}>{m.name}</span>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{m.department || '—'}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span className={`status-dot status-dot-${m.onlineStatus}`} />
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                                {m.onlineStatus}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, color, fontSize: 18 }}>{m.todayScore ?? '—'}</span>
                          </td>
                          <td style={{ width: 160 }}>
                            <div className="score-bar-track">
                              <div className="score-bar-fill" style={{ width: `${sc}%`, background: color }} />
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
