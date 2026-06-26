import { useState } from 'react';
import { X, Camera, Clock, Monitor, ZoomIn } from 'lucide-react';
import './ScreenshotGallery.css';

function timeStr(dt) {
  return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ScreenshotModal({ shot, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="screenshot-modal" onClick={e => e.stopPropagation()}>
        <div className="screenshot-modal-header">
          <div>
            <div className="screenshot-modal-time">{timeStr(shot.capturedAt)}</div>
            {shot.activeApp && <div className="screenshot-modal-app">{shot.activeApp}</div>}
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="screenshot-modal-img-wrap">
          {shot.imageUrl ? (
            <img src={shot.imageUrl} alt="Screenshot" className={`screenshot-modal-img ${shot.isBlurred ? 'blurred' : ''}`} />
          ) : (
            <div className="screenshot-placeholder-large">
              <Monitor size={48} opacity={0.3} />
              <p>Screenshot not available</p>
            </div>
          )}
        </div>
        {shot.windowTitle && (
          <div className="screenshot-modal-footer">{shot.windowTitle}</div>
        )}
      </div>
    </div>
  );
}

// Generate placeholder screenshots for demo when no real ones exist
function getDemoScreenshots(date) {
  const apps = ['Visual Studio Code', 'Google Chrome', 'Figma', 'Slack', 'Notion'];
  return Array.from({ length: 8 }, (_, i) => ({
    _id: `demo-${i}`,
    capturedAt: new Date(`${date}T${9 + i}:${i % 2 === 0 ? '00' : '30'}:00Z`).toISOString(),
    imageUrl: null,
    isBlurred: i === 3,
    activeApp: apps[i % apps.length],
    windowTitle: `${apps[i % apps.length]} — main.jsx`,
    isDemo: true,
  }));
}

export default function ScreenshotGallery({ screenshots = [], date, isDemo = false }) {
  const [selected, setSelected] = useState(null);
  const displayShots = screenshots.length > 0 ? screenshots : (isDemo ? getDemoScreenshots(date) : []);

  if (displayShots.length === 0) {
    return (
      <div className="empty-state">
        <Camera size={40} />
        <p>No screenshots captured for this day. Screenshots are enabled by Admin and captured at configurable intervals.</p>
      </div>
    );
  }

  return (
    <>
      <div className="screenshot-grid">
        {displayShots.map((shot, i) => (
          <div
            key={shot._id || i}
            className="screenshot-thumb"
            onClick={() => setSelected(shot)}
            id={`screenshot-thumb-${i}`}
          >
            <div className="screenshot-thumb-img">
              {shot.imageUrl ? (
                <img src={shot.imageUrl} alt="Screenshot" className={shot.isBlurred ? 'blurred' : ''} />
              ) : (
                <div className="screenshot-placeholder">
                  <Monitor size={28} opacity={0.25} />
                  {shot.isDemo && <span className="screenshot-demo-badge">Demo</span>}
                </div>
              )}
              <div className="screenshot-thumb-overlay">
                <ZoomIn size={18} />
              </div>
              {shot.isBlurred && <div className="screenshot-blur-badge">Blurred</div>}
            </div>
            <div className="screenshot-thumb-info">
              <div className="screenshot-thumb-time">
                <Clock size={11} /> {timeStr(shot.capturedAt)}
              </div>
              {shot.activeApp && (
                <div className="screenshot-thumb-app">{shot.activeApp}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selected && <ScreenshotModal shot={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
