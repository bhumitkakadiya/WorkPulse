import { useState } from 'react';
import './ActivityTimeline.css';

const TYPE_COLORS = {
  active: 'var(--accent-primary)',
  idle: 'var(--text-muted)',
  locked: 'var(--border)',
  sleeping: 'var(--border-light)',
  focus: 'var(--accent-purple)',
};
const TYPE_LABELS = {
  active: 'Active',
  idle: 'Idle',
  locked: 'Locked',
  sleeping: 'Sleep',
  focus: 'Focus',
};

function timeToPercent(time, dayStart = 9, dayEnd = 19) {
  const d = new Date(time);
  const h = d.getHours() + d.getMinutes() / 60;
  return Math.min(100, Math.max(0, ((h - dayStart) / (dayEnd - dayStart)) * 100));
}

function formatTime(dt) {
  const d = new Date(dt);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(secs) {
  if (!secs) return '—';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function ActivityTimeline({ sessions = [], onAnnotate }) {
  const hours = Array.from({ length: 10 }, (_, i) => i + 9);
  const [selectedSession, setSelectedSession] = useState(null);
  const [annotationText, setAnnotationText] = useState('');

  const handleBlockClick = (s) => {
    if (s.type === 'idle' && onAnnotate) {
      setSelectedSession(s);
      setAnnotationText(s.idleAnnotation || '');
    }
  };

  const handleSaveAnnotation = () => {
    if (selectedSession && onAnnotate) {
      onAnnotate(selectedSession._id, annotationText);
      setSelectedSession(null);
    }
  };

  return (
    <div className="timeline-wrapper">
      {/* Hour markers */}
      <div className="timeline-hours">
        {hours.map(h => (
          <div key={h} className="timeline-hour-label">
            {h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h - 12}pm`}
          </div>
        ))}
      </div>

      {/* Track */}
      <div className="timeline-track">
        {sessions.map((s, i) => {
          const left = timeToPercent(s.startTime);
          const right = s.endTime ? timeToPercent(s.endTime) : left + 0.5;
          const width = Math.max(0.3, right - left);
          const color = TYPE_COLORS[s.type] || 'var(--border)';
          const isClickable = s.type === 'idle' && onAnnotate;
          
          return (
            <div
              key={s._id || i}
              className={`timeline-block ${isClickable ? 'clickable' : ''} ${s.idleAnnotation ? 'annotated' : ''}`}
              style={{ left: `${left}%`, width: `${width}%`, background: color }}
              title={`${TYPE_LABELS[s.type] || s.type}\n${s.appName || ''}\n${formatTime(s.startTime)} → ${s.endTime ? formatTime(s.endTime) : '…'}\n${formatDuration(s.durationSeconds)}${s.idleAnnotation ? `\nAnnotation: ${s.idleAnnotation}` : ''}`}
              onClick={() => handleBlockClick(s)}
            >
              {s.isFocusSession && <span className="timeline-focus-star">★</span>}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="timeline-legend">
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <div key={key} className="timeline-legend-item">
            <span className="timeline-legend-dot" style={{ background: TYPE_COLORS[key] }} />
            {label}
          </div>
        ))}
        <div className="timeline-legend-item">
          <span className="timeline-legend-dot" style={{ border: '1px solid var(--accent-primary)', background: 'transparent' }} />
          Annotated Idle
        </div>
      </div>

      {/* Summary row */}
      {sessions.length === 0 && (
        <div className="timeline-empty">No activity recorded for this day</div>
      )}

      {/* Annotation Modal */}
      {selectedSession && (
        <div className="modal-backdrop" onClick={() => setSelectedSession(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 380 }}>
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>Annotate Idle Time</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              {formatTime(selectedSession.startTime)} to {formatTime(selectedSession.endTime)} ({formatDuration(selectedSession.durationSeconds)})
            </p>
            <textarea
              className="input"
              style={{ width: '100%', minHeight: 80, padding: 12, marginBottom: 16 }}
              placeholder="e.g., Client meeting, brainstorming, bathroom break..."
              value={annotationText}
              onChange={e => setAnnotationText(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedSession(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveAnnotation}>Save Annotation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
