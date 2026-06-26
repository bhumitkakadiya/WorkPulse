import { useState, useEffect } from 'react';
import { employeeAPI } from '../../api/index.js';
import HeaderActions from '../../components/HeaderActions';
import ScreenshotGallery from '../../components/ScreenshotGallery';
import EmptyState from '../../components/EmptyState';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { ChevronLeft, ChevronRight, Camera, Info } from 'lucide-react';
import './ScreenshotsPage.css';

function todayStr() { return new Date().toISOString().slice(0, 10); }
function addDays(dateStr, n) {
  const d = new Date(dateStr); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function ScreenshotsPage() {
  const [date, setDate] = useState(todayStr());
  const [screenshots, setScreenshots] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await employeeAPI.getScreenshots(date);
      setScreenshots(res.data.screenshots || []);
    } catch { setScreenshots([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [date]);

  return (
    <>
        <div className="page-header">
          <div>
            <div className="breadcrumbs">Me / Screenshots</div>
            <h1>My Screenshots</h1>
          </div>
          <HeaderActions />
        </div>
        <div className="page page-enter">
          {/* Transparency notice */}
          <div className="screenshots-notice">
            <Info size={16} />
            <span>
              Screenshots are captured by the Desktop Agent at the interval configured by your Admin.
              You can always see every screenshot taken of your screen — nothing is hidden from you.
              Blurred screenshots contain content flagged as sensitive.
            </span>
          </div>

          {/* Date nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDate(d => addDays(d, -1))}>
              <ChevronLeft size={18} />
            </button>
            <input
              id="screenshots-date-picker"
              type="date" className="input" value={date}
              max={todayStr()} onChange={e => setDate(e.target.value)}
              style={{ width: 160, padding: '8px 12px' }}
            />
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDate(d => addDays(d, 1))} disabled={date >= todayStr()}>
              <ChevronRight size={18} />
            </button>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 8 }}>
              {screenshots.length} screenshot{screenshots.length !== 1 ? 's' : ''} captured
            </span>
          </div>

          <div className="glass-panel">
            <div className="section-header" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Camera size={18} color="var(--accent-primary)" />
                <div className="section-title">Screenshots — {date}</div>
              </div>
            </div>
            {loading ? (
              <LoadingSkeleton type="block" count={1} style={{ height: 400 }} />
            ) : screenshots.length > 0 ? (
              <ScreenshotGallery screenshots={screenshots} date={date} isDemo={true} />
            ) : (
              <EmptyState title="No Screenshots" message={`No screenshots were captured on ${date}.`} icon={Camera} />
            )}
          </div>
        </div>
      </>
  );
}
