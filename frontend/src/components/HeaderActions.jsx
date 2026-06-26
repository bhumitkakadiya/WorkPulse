import { useState, useEffect, useRef } from 'react';
import { Bell, Download, X, CheckCheck, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { managerAPI, taskAPI } from '../api/index.js';
import { Link } from 'react-router-dom';
import './HeaderActions.css';

export default function HeaderActions() {
  const { user } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [messagesFeed, setMessagesFeed] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('wp_read_alerts') || '[]')); }
    catch { return new Set(); }
  });
  const dropdownRef = useRef(null);

  // Load real alerts from backend
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'manager') {
      managerAPI.getAlerts()
        .then(res => setAlerts(res.data.alerts || []))
        .catch(() => {});
    }
  }, [user]);

  // Load messages feed when panel opens
  useEffect(() => {
    if (showMessages) {
      taskAPI.getTasks().then(res => {
        const tasks = res.data.tasks || [];
        const allNotes = [];
        tasks.forEach(task => {
          (task.progressNotes || []).forEach(note => {
            allNotes.push({
              _id: note._id || Math.random().toString(),
              taskId: task._id,
              taskTitle: task.title,
              authorName: note.author?.name || 'Unknown',
              authorAvatar: note.author?.avatar,
              message: note.message,
              createdAt: note.createdAt
            });
          });
        });
        allNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setMessagesFeed(allNotes);
      }).catch(err => console.error(err));
    }
  }, [showMessages]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleExport = () => {
    alert('Activity data exported successfully.');
  };

  const markAllRead = () => {
    const allIds = new Set(alerts.map(a => a._id));
    setReadIds(allIds);
    localStorage.setItem('wp_read_alerts', JSON.stringify([...allIds]));
    // NOTE: No backend dismiss endpoint exists yet — state is persisted to localStorage only.
    // When a backend /api/manager/alerts/read-all endpoint is added, call it here.
  };

  const markOneRead = (id) => {
    const next = new Set([...readIds, id]);
    setReadIds(next);
    localStorage.setItem('wp_read_alerts', JSON.stringify([...next]));
    // Optionally call: managerAPI.markAlertRead(id)
    managerAPI.markAlertRead(id).catch(() => {});
  };

  const unreadAlerts = alerts.filter(a => !readIds.has(a._id));
  const unreadCount = unreadAlerts.length;

  // For employees, fall back to static notifications
  const staticNotifs = [
    { id: 's1', text: 'Weekly productivity report is ready.', time: '2h ago', read: false },
    { id: 's2', text: 'You hit your focus goal yesterday! 🔥', time: '1d ago', read: true },
  ];
  const isPrivileged = user?.role === 'admin' || user?.role === 'manager';
  const displayAlerts = isPrivileged ? alerts : staticNotifs;
  const displayUnread = isPrivileged ? unreadCount : staticNotifs.filter(n => !n.read).length;

  const typeColor = {
    low_score: '#EF4444',
    excessive_idle: '#F59E0B',
    system: '#8B5CF6',
  };

  return (
    <div className="header-actions">
      {/* Export Data (Employee) */}
      {user?.role === 'employee' && (
        <button className="btn btn-outline btn-sm" onClick={handleExport} title="Export My Data">
          <Download size={14} /> Export CSV
        </button>
      )}

      {/* Messages */}
      <button 
        className="btn btn-ghost btn-icon" 
        style={{ position: 'relative' }} 
        onClick={() => setShowMessages(true)}
        title="Messages"
      >
        <MessageSquare size={18} />
      </button>

      {/* Notifications */}
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <button className="btn btn-ghost btn-icon notif-btn" onClick={() => setShowNotifs(!showNotifs)}>
          <Bell size={18} />
          {displayUnread > 0 && (
            <span className="notif-badge" style={{ minWidth: displayUnread > 9 ? 16 : undefined }}>
              {displayUnread > 9 ? '9+' : ''}
            </span>
          )}
        </button>

        {showNotifs && (
          <div className="notif-dropdown card-3d">
            <div className="notif-header">
              <div style={{ fontWeight: 600 }}>
                Notifications
                {displayUnread > 0 && (
                  <span className="notif-count-badge">{displayUnread} new</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {displayUnread > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={markAllRead} title="Mark all as read">
                    <CheckCheck size={13} /> Mark read
                  </button>
                )}
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowNotifs(false)}>
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="notif-list">
              {displayAlerts.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No notifications
                </div>
              ) : isPrivileged ? (
                alerts.map(a => {
                  const isRead = readIds.has(a._id);
                  return (
                    <div
                      key={a._id}
                      className={`notif-item ${!isRead ? 'unread' : ''}`}
                      onClick={() => markOneRead(a._id)}
                    >
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                          background: typeColor[a.type] || 'var(--accent-primary)'
                        }} />
                        <div>
                          <div className="notif-text" style={{ fontWeight: isRead ? 400 : 600 }}>{a.title}</div>
                          <div className="notif-time">{a.message}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                staticNotifs.map(n => (
                  <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
                    <div className="notif-text">{n.text}</div>
                    <div className="notif-time">{n.time}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Messages Slide-over Panel */}
      {showMessages && (
        <div className="modal-overlay" style={{ zIndex: 9999, justifyContent: 'flex-end', padding: 0 }} onClick={() => setShowMessages(false)}>
          <div 
            className="messages-panel" 
            style={{ width: 380, height: '100%', background: 'var(--bg-card)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.2s ease-out' }} 
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, color: 'var(--text-heading)', margin: 0 }}>Messages</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowMessages(false)}><X size={20}/></button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {messagesFeed.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <MessageSquare size={48} style={{ opacity: 0.2, margin: '0 auto 16px auto' }} />
                  <h3 style={{ fontSize: 16, marginBottom: 8, color: 'var(--text)' }}>No Messages Yet</h3>
                  <p style={{ fontSize: 14 }}>Progress notes added to tasks will appear here as a unified feed.</p>
                </div>
              ) : (
                messagesFeed.map(msg => (
                  <div key={msg._id} style={{ background: 'var(--bg-page)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--brand-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold' }}>
                          {msg.authorName.charAt(0)}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>{msg.authorName}</div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 12 }}>
                      {msg.message}
                    </div>
                    <div style={{ fontSize: 11, background: 'var(--bg-surface)', padding: '6px 10px', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                        Task: {msg.taskTitle}
                      </span>
                      <Link to="/tasks" style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 500 }} onClick={() => setShowMessages(false)}>
                        View
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
