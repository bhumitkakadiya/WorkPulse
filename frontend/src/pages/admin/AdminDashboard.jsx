import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, managerAPI } from '../../api/index.js';
import HeaderActions from '../../components/HeaderActions';
import {
  Users, LayoutDashboard, Tag, Bell, Building2,
  UserPlus, Tags, Settings2, TrendingUp, RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import StatCard from '../../components/dashboard/StatCard';
import AlertPanel from '../../components/dashboard/AlertPanel';
import PageHeader from '../../components/dashboard/PageHeader';

import '../../components/dashboard/dashboard-shared.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [chartData, setChartData] = useState([]);
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
        // Generate mock 7-day org productivity trend
        const today = new Date();
        const data = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(today);
          d.setDate(d.getDate() - (6 - i));
          return {
            day: d.toLocaleDateString('en', { weekday: 'short' }),
            score: Math.round(55 + Math.random() * 30),
          };
        });
        setChartData(data);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const statCards = stats ? [
    { icon: Users,        iconClass: 'blue',   label: 'Total Users',   value: stats.totalUsers,  sub: `${stats.roleBreakdown?.admin || 0} Admin · ${stats.roleBreakdown?.manager || 0} Manager · ${stats.roleBreakdown?.employee || 0} Employee` },
    { icon: Building2,    iconClass: 'purple', label: 'Departments',   value: stats.departments,  sub: 'Across the organization' },
    { icon: Bell,         iconClass: 'amber',  label: 'Total Alerts',  value: stats.totalAlerts,  sub: 'System-wide alerts' },
    { icon: TrendingUp,   iconClass: 'green',  label: 'Active Users',  value: stats.activeCount,  sub: 'Accounts currently active' },
  ] : [];

  return (
    <>
      <PageHeader breadcrumbs="Admin / Dashboard" title="Dashboard" />

      <div className="page page-enter">
        {/* Stat Cards */}
        <div className="admin-stats-row">
          {loading ? (
            [1,2,3,4].map(n => (
              <div key={n} className="admin-stat-card" style={{ minHeight: 90 }}>
                <div style={{ width: '100%', height: 60, background: 'var(--border)', borderRadius: 8, animation: 'pulse 1.5s ease infinite' }} />
              </div>
            ))
          ) : statCards.map((props) => (
            <StatCard key={props.label} {...props} />
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quick Actions</div>
        <div className="admin-quick-actions">
          <Link to="/admin/users" className="admin-quick-btn primary">
            <UserPlus size={16} /> Add User
          </Link>
          <Link to="/admin/categories" className="admin-quick-btn">
            <Tags size={16} /> Add Category Rule
          </Link>
          <Link to="/admin/organization" className="admin-quick-btn">
            <Settings2 size={16} /> Edit Org Settings
          </Link>
        </div>

        {/* Chart + Alerts two-column */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          {/* Chart */}
          <div className="admin-chart-panel">
            <div className="admin-chart-title">7-Day Org Productivity Trend</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 13 }}
                  formatter={(v) => [`${v}%`, 'Avg Score']}
                />
                <Line type="monotone" dataKey="score" stroke="var(--brand-primary)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--brand-primary)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <AlertPanel 
            title="Recent Alerts" 
            alerts={alerts} 
            emptyMessage="No alerts yet" 
          />
        </div>
      </div>
    </>
  );
}
