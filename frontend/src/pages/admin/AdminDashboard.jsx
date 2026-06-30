import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, managerAPI } from '../../api/index.js';
import HeaderActions from '../../components/HeaderActions';
import {
  Users, LayoutDashboard, Tag, Bell, Building2,
  UserPlus, Tags, Settings2, TrendingUp, RefreshCw,
  Activity, Clock, AlertTriangle, Sparkles
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import StatCard from '../../components/dashboard/StatCard';
import AlertPanel from '../../components/dashboard/AlertPanel';
import PageHeader from '../../components/dashboard/PageHeader';

import '../../components/dashboard/dashboard-shared.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    const isAbove = val >= 75;
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', color: 'var(--text)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{val}%</div>
        <div style={{ fontSize: 12, color: isAbove ? '#0D9488' : '#F59E0B', fontWeight: 500 }}>
          {isAbove ? 'Above target' : 'Below target'}
        </div>
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [chartRange, setChartRange] = useState('7D');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, aRes] = await Promise.all([
          adminAPI.getStats(),
          managerAPI.getAlerts().catch(() => ({ data: { alerts: [] } })),
        ]);
        setStats(sRes.data.stats);
        setAlerts((aRes.data.alerts || []).slice(0, 5));
        
        const days = chartRange === '7D' ? 7 : chartRange === '14D' ? 14 : 30;
        const today = new Date();
        const data = Array.from({ length: days }, (_, i) => {
          const d = new Date(today);
          d.setDate(d.getDate() - ((days - 1) - i));
          return {
            day: d.toLocaleDateString('en', { weekday: 'short', month: days > 7 ? 'short' : undefined, day: days > 7 ? 'numeric' : undefined }),
            score: Math.round(55 + Math.random() * 30),
          };
        });
        setChartData(data);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [chartRange]);

  const statCards = stats ? [
    { icon: Users,        iconClass: 'blue',   borderClass: 'border-blue',   label: 'Total Users',   value: stats.totalUsers,  sub: `${stats.roleBreakdown?.admin || 0} Admin · ${stats.roleBreakdown?.manager || 0} Manager · ${stats.roleBreakdown?.employee || 0} Employee`, trendText: '+1 this week', trendColor: '#0D9488' },
    { icon: Building2,    iconClass: 'purple', borderClass: 'border-purple', label: 'Departments',   value: stats.departments,  sub: 'Across the organization', trendText: 'Across 4 locations', trendColor: 'var(--text-muted)' },
    { icon: Bell,         iconClass: 'amber',  borderClass: 'border-amber',  label: 'Total Alerts',  value: stats.totalAlerts,  sub: 'System-wide alerts', trendText: '↑1 from yesterday', trendColor: '#F59E0B' },
    { icon: TrendingUp,   iconClass: 'green',  borderClass: 'border-green',  label: 'Active Users',  value: stats.activeCount,  sub: 'Accounts currently active', trendText: 'All accounts active', trendColor: '#0D9488' },
  ] : [];

  const departments = [
    { name: 'Engineering', members: 12, score: 82, status: 'Active' },
    { name: 'Design', members: 4, score: 76, status: 'Active' },
    { name: 'Data', members: 3, score: 65, status: 'Active' },
    { name: 'Management', members: 2, score: 45, status: 'No Activity' }
  ];

  return (
    <>
      <PageHeader breadcrumbs="Admin / Dashboard" title="Dashboard" />

      <div className="page page-enter admin-dashboard-override">
        
        {/* Stat Cards */}
        <div className="admin-stats-row">
          {loading ? (
            [1,2,3,4].map(n => (
              <div key={n} className="admin-stat-card" style={{ minHeight: 110 }}>
                <div style={{ width: '100%', height: 60, background: 'var(--border)', borderRadius: 8, animation: 'pulse 1.5s ease infinite' }} />
              </div>
            ))
          ) : statCards.map((props) => (
            <StatCard key={props.label} {...props} />
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Actions</div>
        <div className="admin-quick-actions">
          <Link to="/admin/users" className="admin-quick-btn primary" style={{ padding: '12px 20px' }}>
            <UserPlus size={18} /> Add User
          </Link>
          <Link to="/admin/categories" className="admin-quick-btn">
            <Tag size={16} /> Add Category Rule
          </Link>
          <Link to="/admin/organization" className="admin-quick-btn">
            <Settings2 size={16} /> Edit Org Settings
          </Link>
          <button className="admin-quick-btn purple" style={{ marginLeft: 'auto' }}>
            <Sparkles size={16} /> Ask Pulse AI
          </button>
        </div>

        {/* Today's Snapshot */}
        <div style={{ marginBottom: 12, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Today at a Glance</div>
        <div className="admin-snapshot-row">
          <div className="admin-snapshot-tile">
            <div>
              <div className="admin-snapshot-lbl" style={{ marginBottom: 6 }}>Avg Productivity Today</div>
              <div className="admin-snapshot-val" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                57%
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
              </div>
            </div>
            <div className="admin-snapshot-icon"><Activity size={20} color="#F59E0B" /></div>
          </div>
          <div className="admin-snapshot-tile">
            <div>
              <div className="admin-snapshot-lbl" style={{ marginBottom: 6 }}>Employees Online Now</div>
              <div className="admin-snapshot-val">0 / 5</div>
            </div>
            <div className="admin-snapshot-icon"><Users size={20} color="var(--text-muted)" /></div>
          </div>
          <div className="admin-snapshot-tile">
            <div>
              <div className="admin-snapshot-lbl" style={{ marginBottom: 6 }}>Alerts Triggered Today</div>
              <div className="admin-snapshot-val">3</div>
            </div>
            <div className="admin-snapshot-icon"><AlertTriangle size={20} color="#EF4444" /></div>
          </div>
        </div>

        {/* Chart + Alerts two-column */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, marginBottom: 24 }}>
          {/* Chart */}
          <div className="admin-chart-panel" style={{ margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div className="admin-chart-title">7-Day Org Productivity Trend</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['7D', '14D', '30D'].map(range => (
                  <button 
                    key={range}
                    onClick={() => setChartRange(range)}
                    style={{
                      background: chartRange === range ? 'var(--color-accent)' : 'transparent',
                      color: chartRange === range ? '#fff' : 'var(--color-text-muted)',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Average productivity score across the organization</div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={75} stroke="#F59E0B" strokeDasharray="4 4" label={{ position: 'insideTopRight', value: 'Target', fill: '#F59E0B', fontSize: 12, dy: -10 }} />
                <Area type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" activeDot={{ r: 6, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }} dot={{ r: 4, fill: '#2563EB', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <AlertPanel 
            title="Recent Alerts" 
            alerts={alerts} 
            emptyMessage="No alerts yet" 
          />
        </div>

        {/* Department Overview */}
        <div style={{ marginBottom: 12, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Department Overview</div>
        <div className="admin-dept-grid">
          {departments.map((dept, idx) => {
            let barColor = '#EF4444';
            if (dept.score >= 70) barColor = '#0D9488';
            else if (dept.score >= 50) barColor = '#F59E0B';

            return (
              <div key={dept.name} className="admin-dept-card">
                <div className="admin-dept-header">
                  <div>
                    <div className="admin-dept-title">{dept.name}</div>
                    <div className="admin-dept-members">{dept.members} member{dept.members !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div className="admin-dept-score">{dept.score}%</div>
                <div className="admin-dept-bar-bg">
                  <div className="admin-dept-bar-fill" style={{ width: `${dept.score}%`, background: barColor }} />
                </div>
                <div className="admin-dept-status" style={{ color: dept.status === 'Active' ? '#0D9488' : 'var(--text-muted)' }}>
                  {dept.status}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
