import './ActivityHeatmap.css';

function scoreColor(score) {
  if (!score && score !== 0) return 'var(--border)';
  if (score >= 75) return '#10B981';
  if (score >= 50) return '#3B82F6';
  if (score >= 25) return '#F59E0B';
  return '#EF4444';
}
function scoreOpacity(score) {
  if (!score && score !== 0) return 0.15;
  return 0.15 + (score / 100) * 0.85;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ActivityHeatmap({ snapshots = [] }) {
  // Build last 5 weeks (35 days) of data
  const today = new Date();
  const cells = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const snap = snapshots.find(s => s.date === dateStr);
    cells.push({ date: dateStr, score: snap?.score ?? null, day: d.getDay() });
  }

  // Pad start to align to Sunday
  const firstDay = cells[0]?.day || 0;
  const padded = [...Array(firstDay).fill(null), ...cells];

  // Group into weeks
  const weeks = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  return (
    <div className="heatmap-wrapper">
      <div className="heatmap-day-labels">
        {DAYS.map(d => <span key={d} className="heatmap-day-label">{d}</span>)}
      </div>
      <div className="heatmap-grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="heatmap-week">
            {Array.from({ length: 7 }, (_, di) => {
              const cell = week[di];
              if (!cell) return <div key={di} className="heatmap-cell heatmap-empty" />;
              const isToday = cell.date === today.toISOString().slice(0, 10);
              return (
                <div
                  key={di}
                  className={`heatmap-cell ${isToday ? 'heatmap-today' : ''}`}
                  style={{
                    background: cell.score != null ? scoreColor(cell.score) : 'var(--border)',
                    opacity: cell.score != null ? scoreOpacity(cell.score) + (isToday ? 0.1 : 0) : 0.15,
                  }}
                  title={`${cell.date}\nScore: ${cell.score != null ? cell.score : 'No data'}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="heatmap-legend">
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Less</span>
        {[0, 25, 50, 75, 100].map(v => (
          <div key={v} className="heatmap-legend-cell" style={{ background: scoreColor(v), opacity: scoreOpacity(v) }} />
        ))}
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>More</span>
      </div>
    </div>
  );
}
