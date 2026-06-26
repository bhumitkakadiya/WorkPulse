import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import './AppUsageChart.css';

const COLORS = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#818CF8', '#22D3EE', '#F97316', '#EC4899'];

function formatTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function AppUsageChart({ appUsage = [], title = 'App Usage' }) {
  const top = appUsage.slice(0, 8);
  const total = top.reduce((a, b) => a + b.durationSeconds, 0);

  const chartData = top.map(app => ({
    name: app.appName,
    value: app.durationSeconds,
    category: app.category,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
      <div className="chart-tooltip">
        <div className="chart-tooltip-name">{d.name}</div>
        <div className="chart-tooltip-value">{formatTime(d.value)}</div>
        <div className="chart-tooltip-pct">{total > 0 ? Math.round(d.value / total * 100) : 0}%</div>
      </div>
    );
  };

  if (top.length === 0) {
    return (
      <div className="app-usage-empty">
        <p>No app usage data available</p>
      </div>
    );
  }

  return (
    <div className="app-usage-wrapper">
      {/* Donut chart */}
      <div className="app-usage-chart">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData} dataKey="value" nameKey="name"
              cx="50%" cy="50%" innerRadius={55} outerRadius={90}
              paddingAngle={2} strokeWidth={0}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="app-usage-center-label">
          <span className="app-usage-total">{formatTime(total)}</span>
          <span className="app-usage-total-sub">Total</span>
        </div>
      </div>

      {/* Ranked list */}
      <div className="app-usage-list">
        {top.map((app, i) => {
          const pct = total > 0 ? Math.round(app.durationSeconds / total * 100) : 0;
          const catClass = app.category === 'productive' ? 'productive' : app.category === 'distracting' ? 'distracting' : 'neutral';
          return (
            <div key={i} className="app-usage-item">
              <div className="app-usage-item-color" style={{ background: COLORS[i % COLORS.length] }} />
              <div className="app-usage-item-info">
                <div className="app-usage-item-name">{app.appName}</div>
                <div className="app-usage-item-bar-wrap">
                  <div className="app-usage-item-bar" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                </div>
              </div>
              <div className="app-usage-item-right">
                <span className="app-usage-item-time">{formatTime(app.durationSeconds)}</span>
                <span className={`badge badge-${catClass}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                  {catClass}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
