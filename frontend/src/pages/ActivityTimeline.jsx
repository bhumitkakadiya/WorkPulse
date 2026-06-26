import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { employeeAPI, managerAPI, adminAPI } from '../api/index';
import ActivityTimelineComponent from '../components/ActivityTimeline';
import AppUsageChart from '../components/AppUsageChart';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import './ActivityTimeline.css';

export default function ActivityTimeline() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // If no :id is provided in URL, we assume the user is viewing their own activity
  const targetUserId = id || user?.id;
  const isSelf = targetUserId === user?.id;

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxImg, setLightboxImg] = useState(null);

  useEffect(() => {
    if (!targetUserId) return;
    fetchTimeline();
  }, [targetUserId, date]);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      let res;
      if (isSelf) {
        res = await employeeAPI.getTimeline(date);
      } else if (user?.role === 'manager') {
        res = await managerAPI.getTimeline(targetUserId, date);
      } else if (user?.role === 'admin') {
        // Fallback to managerAPI as Admin has access to it, or we could add adminAPI.getTimeline
        // Manager API is protected by 'manager' or 'admin' roles in the backend.
        res = await managerAPI.getTimeline(targetUserId, date);
      }
      
      setData(res?.data || null);
    } catch (err) {
      console.error(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const addDays = (dateStr, days) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };
  const todayStr = new Date().toISOString().split('T')[0];

  const sessions = data?.sessions || [];
  const appUsage = data?.appUsage || [];
  const screenshots = data?.screenshots || [];

  return (
    <>
      <div className="page-header">
        <div>
          <div className="breadcrumbs">{isSelf ? 'Me / Timeline' : `Team / ${data?.user?.name || 'Timeline'}`}</div>
          <h1>{isSelf ? 'My Activity Timeline' : `${data?.user?.name || 'Employee'} Timeline`}</h1>
        </div>
      </div>

      <div className="page page-enter">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDate(d => addDays(d, -1))}>
              <ChevronLeft size={18} />
            </button>
            <input
              type="date"
              className="input-field"
              value={date}
              max={todayStr}
              onChange={e => setDate(e.target.value)}
              style={{ width: 150, padding: '8px 12px', margin: 0 }}
            />
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDate(d => addDays(d, 1))} disabled={date >= todayStr}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading activity data... If this takes too long, please try refreshing.
          </div>
        ) : !data ? (
          <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--danger)' }}>
            Couldn't load activity — try refreshing.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Timeline Row */}
            <div className="glass-panel">
              <h3 style={{ marginBottom: 16, color: 'var(--text-heading)' }}>Activity Timeline</h3>
              <ActivityTimelineComponent sessions={sessions} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* App Usage Chart */}
              <div className="glass-panel">
                <h3 style={{ marginBottom: 16, color: 'var(--text-heading)' }}>App & Website Usage</h3>
                <AppUsageChart appUsage={appUsage} />
              </div>

              {/* Screenshots Gallery */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ marginBottom: 16, color: 'var(--text-heading)' }}>Screenshots</h3>
                {screenshots.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No screenshots captured for this date.
                  </div>
                ) : (
                  <div className="screenshot-gallery" style={{ 
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, 
                    maxHeight: 300, overflowY: 'auto', paddingRight: 8 
                  }}>
                    {screenshots.map((ss, idx) => (
                      <div key={idx} className="screenshot-thumbnail" onClick={() => setLightboxImg(ss.imageUrl.startsWith('http') ? ss.imageUrl : 'https://placehold.co/1200x800/1e293b/ffffff?text=Screenshot')}>
                        <img src={ss.imageUrl.startsWith('http') ? ss.imageUrl : 'https://placehold.co/600x400/1e293b/ffffff?text=Screenshot'} alt="Screenshot" />
                        <div className="screenshot-meta">
                          <span>{new Date(ss.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>{ss.activeApp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {lightboxImg && (
        <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={() => setLightboxImg(null)}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button className="btn btn-ghost btn-icon" style={{ position: 'absolute', top: -40, right: 0, color: 'white' }} onClick={() => setLightboxImg(null)}>
              <X size={24} />
            </button>
            <img src={lightboxImg} alt="Enlarged screenshot" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} />
          </div>
        </div>
      )}
    </>
  );
}
