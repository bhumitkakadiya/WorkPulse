import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import { MessageSquare, Send, Search, Plus, X, Users, Circle, Paperclip, Smile } from 'lucide-react';
import HeaderActions from '../components/HeaderActions';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [searchConvo, setSearchConvo] = useState('');
  const [typing, setTyping] = useState(false);
  const [typingUserId, setTypingUserId] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const res = await axios.get('/api/conversations');
      setConversations(res.data.conversations || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadConversations(); }, []);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConvo) return;
    const fetchMessages = async () => {
      setMsgLoading(true);
      try {
        const res = await axios.get(`/api/conversations/${activeConvo._id}/messages`);
        setMessages(res.data.messages || []);
        // Mark as read via socket
        if (socket) socket.emit('message:read', { conversationId: activeConvo._id });
      } catch (e) { console.error(e); }
      finally { setMsgLoading(false); }
    };
    fetchMessages();
  }, [activeConvo?._id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (activeConvo && msg.conversationId === activeConvo._id) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        socket.emit('message:read', { conversationId: activeConvo._id });
      }
      // Update conversation's lastMessageAt
      loadConversations();
    };

    const handleTypingStart = ({ conversationId, userId }) => {
      if (conversationId === activeConvo?._id && userId !== user?.id) {
        setTypingUserId(userId);
        setTyping(true);
      }
    };

    const handleTypingStop = ({ conversationId }) => {
      if (conversationId === activeConvo?._id) {
        setTyping(false);
        setTypingUserId(null);
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [socket, activeConvo?._id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeConvo || sending) return;

    const body = input.trim();
    setInput('');
    setSending(true);

    // Optimistic update
    const tempMsg = {
      _id: `temp-${Date.now()}`,
      conversationId: activeConvo._id,
      senderId: { _id: user?.id, name: user?.name },
      body,
      createdAt: new Date().toISOString(),
      readBy: [user?.id],
      _temp: true,
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      // Send via socket (faster), API as fallback
      if (socket) {
        socket.emit('message:send', { conversationId: activeConvo._id, body });
        // Remove temp message — socket will broadcast the real one
        setTimeout(() => {
          setMessages(prev => prev.filter(m => !m._temp));
        }, 800);
      } else {
        const res = await axios.post(`/api/conversations/${activeConvo._id}/messages`, { body });
        setMessages(prev => [...prev.filter(m => !m._temp), res.data.message]);
      }
      loadConversations();
    } catch (e) {
      console.error(e);
      setMessages(prev => prev.filter(m => !m._temp));
      setInput(body); // restore
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (!socket || !activeConvo) return;
    const otherParticipant = activeConvo.participantIds?.find(p => p._id !== user?.id);
    if (!otherParticipant) return;

    socket.emit('typing:start', { conversationId: activeConvo._id, targetUserId: otherParticipant._id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { conversationId: activeConvo._id, targetUserId: otherParticipant._id });
    }, 1500);
  };

  const startNewConversation = async (targetUser) => {
    try {
      const res = await axios.post('/api/conversations', { userId: targetUser._id });
      const convo = res.data.conversation;
      setShowNewChat(false);
      setUserSearch('');
      await loadConversations();
      setActiveConvo(convo);
    } catch (e) {
      console.error(e);
      alert('Could not start conversation');
    }
  };

  const loadUsersForSearch = async (q) => {
    if (!q.trim()) { setAllUsers([]); return; }
    try {
      // Use admin users endpoint or just search from known conversations participants
      const res = await axios.get('/api/admin/users').catch(() => ({ data: { users: [] } }));
      const users = (res.data.users || []).filter(u =>
        u._id !== user?.id &&
        (u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()))
      );
      setAllUsers(users);
    } catch { setAllUsers([]); }
  };

  useEffect(() => {
    const t = setTimeout(() => loadUsersForSearch(userSearch), 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  const getConvoName = (convo) => {
    const other = convo.participantIds?.find(p => p._id !== user?.id);
    return other?.name || 'Unknown';
  };

  const getConvoAvatar = (convo) => {
    const other = convo.participantIds?.find(p => p._id !== user?.id);
    return other?.name?.charAt(0)?.toUpperCase() || '?';
  };

  const getOnlineStatus = (convo) => {
    const other = convo.participantIds?.find(p => p._id !== user?.id);
    return other?.onlineStatus;
  };

  const filteredConversations = conversations.filter(c =>
    getConvoName(c).toLowerCase().includes(searchConvo.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <div>
          <div className="breadcrumbs">Company / Messages</div>
          <h1>Messages</h1>
        </div>
        <HeaderActions />
      </div>

      <div className="page page-enter" style={{ padding: 0, display: 'flex', height: 'calc(100vh - 120px)', overflow: 'hidden', borderRadius: 16, border: '1px solid var(--border)' }}>
        {/* LEFT: Conversations Sidebar */}
        <div style={{
          width: 300,
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-secondary)',
          flexShrink: 0,
        }}>
          {/* Sidebar Header */}
          <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Conversations</span>
              <button
                id="new-chat-btn"
                className="btn btn-primary btn-sm btn-icon"
                onClick={() => setShowNewChat(true)}
                title="New conversation"
              >
                <Plus size={15} />
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="input"
                style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
                placeholder="Search conversations..."
                value={searchConvo}
                onChange={e => setSearchConvo(e.target.value)}
              />
            </div>
          </div>

          {/* Conversations List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                <MessageSquare size={32} style={{ margin: '0 auto 8px', opacity: 0.2 }} />
                <p style={{ fontSize: 13 }}>No conversations yet.</p>
                <button className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={() => setShowNewChat(true)}>
                  Start one
                </button>
              </div>
            ) : (
              filteredConversations.map(convo => {
                const isActive = activeConvo?._id === convo._id;
                const status = getOnlineStatus(convo);
                return (
                  <div
                    key={convo._id}
                    onClick={() => setActiveConvo(convo)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      background: isActive ? 'var(--accent-primary)20' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                      transition: 'all 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: isActive ? 'var(--accent-primary)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: isActive ? '#fff' : 'var(--text)' }}>
                        {getConvoAvatar(convo)}
                      </div>
                      <div style={{
                        position: 'absolute', bottom: 0, right: 0,
                        width: 11, height: 11, borderRadius: '50%',
                        background: status === 'online' ? 'var(--success)' : 'var(--text-muted)',
                        border: '2px solid var(--bg-secondary)'
                      }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {getConvoName(convo)}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {timeAgo(convo.lastMessageAt)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: Message Thread */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', minWidth: 0 }}>
          {!activeConvo ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <MessageSquare size={56} style={{ opacity: 0.1, marginBottom: 16 }} />
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Select a conversation</div>
              <div style={{ fontSize: 14 }}>Or start a new one to message your team</div>
              <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setShowNewChat(true)}>
                <Plus size={16} /> New Message
              </button>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-secondary)' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff' }}>
                  {getConvoAvatar(activeConvo)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{getConvoName(activeConvo)}</div>
                  <div style={{ fontSize: 12, color: getOnlineStatus(activeConvo) === 'online' ? 'var(--success)' : 'var(--text-muted)' }}>
                    {getOnlineStatus(activeConvo) === 'online' ? '● Online' : '○ Offline'}
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {msgLoading ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 40 }}>Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 60 }}>
                    <MessageSquare size={32} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                    <p>No messages yet. Say hello! 👋</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isOwn = msg.senderId?._id === user?.id || msg.senderId === user?.id;
                    const showAvatar = !isOwn && (i === 0 || messages[i - 1]?.senderId?._id !== msg.senderId?._id);
                    return (
                      <div key={msg._id} style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
                        {!isOwn && (
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: showAvatar ? 'var(--border)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text)', flexShrink: 0 }}>
                            {showAvatar ? (msg.senderId?.name?.charAt(0) || '?') : ''}
                          </div>
                        )}
                        <div style={{ maxWidth: '65%' }}>
                          {showAvatar && !isOwn && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, marginLeft: 4 }}>
                              {msg.senderId?.name}
                            </div>
                          )}
                          <div style={{
                            background: isOwn ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                            color: isOwn ? '#fff' : 'var(--text)',
                            padding: '10px 14px',
                            borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            fontSize: 14,
                            lineHeight: 1.5,
                            wordBreak: 'break-word',
                            border: isOwn ? 'none' : '1px solid var(--border)',
                            opacity: msg._temp ? 0.6 : 1,
                          }}>
                            {msg.body}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, textAlign: isOwn ? 'right' : 'left', paddingLeft: 4, paddingRight: 4 }}>
                            {timeAgo(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Typing indicator */}
                {typing && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--border)' }} />
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '18px 18px 18px 4px', display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animation: `bounce 1s ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                <form onSubmit={handleSend} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 24, padding: '4px 16px', flex: 1, transition: '0.2s', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
                    <button type="button" className="btn btn-ghost btn-icon" style={{ padding: 6, margin: '-4px 0', color: 'var(--text-muted)' }} title="Attach file">
                      <Paperclip size={18} />
                    </button>
                    <input
                      id="message-input"
                      style={{ flex: 1, border: 'none', background: 'transparent', padding: '10px 12px', fontSize: 14, outline: 'none', color: 'var(--text-primary)' }}
                      placeholder={`Message ${getConvoName(activeConvo)}...`}
                      value={input}
                      onChange={handleTyping}
                      disabled={sending}
                      autoFocus
                    />
                    <button type="button" className="btn btn-ghost btn-icon" style={{ padding: 6, margin: '-4px 0', color: 'var(--text-muted)' }} title="Insert emoji">
                      <Smile size={18} />
                    </button>
                  </div>
                  <button
                    id="send-message-btn"
                    type="submit"
                    className="btn btn-primary btn-icon"
                    style={{ borderRadius: '50%', width: 44, height: 44, flexShrink: 0 }}
                    disabled={!input.trim() || sending}
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="modal" style={{ maxWidth: 380, width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={18} color="var(--accent-primary)" /> New Message
              </h3>
              <button className="btn btn-ghost btn-icon" onClick={() => { setShowNewChat(false); setUserSearch(''); setAllUsers([]); }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="new-chat-search"
                className="input"
                style={{ paddingLeft: 36 }}
                placeholder="Search team members..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {userSearch.trim() && allUsers.length === 0 && (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
                  No users found for "{userSearch}"
                </div>
              )}
              {allUsers.map(u => (
                <div
                  key={u._id}
                  onClick={() => startNewConversation(u)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', transition: '0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff' }}>
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.role} · {u.department}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
}
