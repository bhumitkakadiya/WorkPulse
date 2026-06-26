import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';
import './ProductivityScoreCard.css';

function scoreColor(score) {
  if (score >= 75) return 'var(--success)';
  if (score >= 45) return 'var(--warning)';
  return 'var(--danger)';
}
function scoreClass(score) {
  if (score >= 75) return 'score-high';
  if (score >= 45) return 'score-medium';
  return 'score-low';
}
function scoreLabel(score) {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  if (score >= 30) return 'Low';
  return 'Minimal';
}

export default function ProductivityScoreCard({ snapshot, prevScore }) {
  const score = snapshot?.score ?? 0;
  const delta = prevScore != null ? score - prevScore : null;

  const chartData = [
    { name: 'Score', value: score, fill: scoreColor(score) },
    { name: 'Remaining', value: 100 - score, fill: 'var(--border)' },
  ];

  return (
    <div className="score-card">
      {/* Radial gauge */}
      <div className="score-gauge-wrap">
        <ResponsiveContainer width={140} height={140}>
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="70%" outerRadius="100%"
            startAngle={210} endAngle={-30}
            data={[{ name: 'bg', value: 100, fill: 'var(--border)' }, { name: 'score', value: score, fill: scoreColor(score) }]}
          >
            <RadialBar dataKey="value" cornerRadius={6} isAnimationActive={true} animationDuration={800} animationEasing="ease-out" />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="score-gauge-label">
          <span className={`score-number ${scoreClass(score)}`}>
            <AnimatedNumber value={score} duration={800} />
          </span>
          <span className="score-max">/100</span>
        </div>
      </div>

      <div className="score-info">
        <div className={`score-label-text ${scoreClass(score)}`}>{scoreLabel(score)}</div>

        {delta !== null && (
          <div className={`stat-change ${delta >= 0 ? 'up' : 'down'}`}>
            {delta >= 0 ? <TrendingUp size={13} /> : delta < 0 ? <TrendingDown size={13} /> : <Minus size={13} />}
            {Math.abs(delta)} pts vs yesterday
          </div>
        )}

        {/* Breakdown bars */}
        {snapshot?.breakdown && (
          <div className="score-breakdown">
            {[
              { label: 'Productive', pct: snapshot.breakdown.productivePercent, color: 'var(--productive)' },
              { label: 'Neutral', pct: snapshot.breakdown.neutralPercent, color: 'var(--neutral)' },
              { label: 'Distracting', pct: snapshot.breakdown.distractingPercent, color: 'var(--distracting)' },
              { label: 'Idle', pct: snapshot.breakdown.idlePercent, color: 'var(--text-muted)' },
            ].map(({ label, pct, color }) => (
              <div key={label} className="score-bar-row">
                <span className="score-bar-label">{label}</span>
                <div className="score-bar-track">
                  <div className="score-bar-fill" style={{ width: `${pct || 0}%`, background: color }} />
                </div>
                <span className="score-bar-pct"><AnimatedNumber value={pct || 0} duration={800} />%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
