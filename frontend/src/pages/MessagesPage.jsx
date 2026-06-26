import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { taskAPI } from '../api/index';
import HeaderActions from '../components/HeaderActions';
import { MessageSquare, Send, Clock, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replyTaskId, setReplyTaskId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await taskAPI.getTasks();
      const allTasks = res.data.tasks || [];
      
      let allNotes = [];
      allTasks.forEach(task => {
        if (task.progressNotes && task.progressNotes.length > 0) {
          task.progressNotes.forEach(note => {
            allNotes.push({
              ...note,
              taskId: task._id,
              taskTitle: task.title,
              taskStatus: task.status
            });
          });
        }
      });
      
      // Sort chronologically (newest first)
      allNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setMessages(allNotes);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e, taskId) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    
    setSubmitting(true);
    try {
      await taskAPI.addTaskNote(taskId, replyText);
      setReplyText('');
      setReplyTaskId(null);
      await fetchMessages(); // Refresh feed
    } catch (err) {
      console.error(err);
      alert('Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="breadcrumbs">Company / Messages</div>
          <h1>Messages feed</h1>
        </div>
        <HeaderActions />
      </div>
      
      <div className="page page-enter">
        <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="glass-panel" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ marginBottom: 16 }}><MessageSquare size={48} style={{ margin: '0 auto', opacity: 0.2 }} /></div>
              <h3>No messages yet</h3>
              <p>Task progress notes will appear here as a unified feed.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {messages.map((msg, idx) => (
                <div key={`${msg.taskId}-${msg._id || idx}`} className="glass-panel" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="task-assignee-avatar" style={{ width: 40, height: 40, fontSize: 16, background: msg.author?._id === user?.id ? 'var(--brand-primary)' : 'var(--bg-card)' }}>
                        {msg.author?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>
                          {msg.author?.name || 'Unknown User'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                          <Clock size={12} />
                          {new Date(msg.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <Link to="/tasks" style={{ textDecoration: 'none' }}>
                      <div className="badge" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(59,130,246,0.1)', color: 'var(--brand-primary)', border: '1px solid rgba(59,130,246,0.2)' }}>
                        <Briefcase size={12} />
                        {msg.taskTitle}
                      </div>
                    </Link>
                  </div>
                  
                  <div style={{ fontSize: 15, color: 'var(--text-body)', lineHeight: 1.6, marginBottom: 20, whiteSpace: 'pre-wrap' }}>
                    {msg.message}
                  </div>
                  
                  {replyTaskId === msg.taskId ? (
                    <form onSubmit={(e) => handleReply(e, msg.taskId)} style={{ display: 'flex', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                      <input 
                        className="input-field" 
                        style={{ flex: 1, margin: 0 }} 
                        placeholder="Type your reply..." 
                        autoFocus
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        disabled={submitting}
                      />
                      <button type="submit" className="btn btn-primary btn-icon" disabled={!replyText.trim() || submitting}>
                        <Send size={16} />
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={() => { setReplyTaskId(null); setReplyText(''); }}>
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        onClick={() => {
                          setReplyTaskId(msg.taskId);
                          setReplyText('');
                        }}
                      >
                        <MessageSquare size={14} /> Reply to thread
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
