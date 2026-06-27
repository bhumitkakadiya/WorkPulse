import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Mic } from 'lucide-react';
import { aiAPI } from '../api';

const SUGGESTIONS = [
  'Who has the lowest productivity this week?',
  'How many alerts were triggered today?',
  'Show me Casey Designer\'s activity summary',
  'Which apps are most distracting?'
];

export default function PulseAIPanel({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (text) => {
    if (!text.trim()) return;
    
    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiAPI.query(text);
      setMessages(prev => [...prev, { role: 'ai', text: res.data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Pulse AI is unavailable right now. Please try again.', error: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: 420,
      height: '100vh',
      background: 'var(--bg-card)',
      borderLeft: '1px solid var(--border)',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand-primary)' }}>
            <Sparkles size={20} /> Pulse AI
          </h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Powered by Google Gemini</div>
        </div>
        <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.length === 0 ? (
          <div style={{ marginTop: 'auto', marginBottom: 'auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Sparkles size={32} style={{ color: 'var(--brand-primary)', margin: '0 auto 12px', opacity: 0.8 }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>How can I help you today?</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Ask about team performance, alerts, or insights.</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SUGGESTIONS.map((s, i) => (
                <button 
                  key={i}
                  onClick={() => handleSend(s)}
                  style={{ 
                    padding: '12px 16px', 
                    background: 'var(--bg-secondary)', 
                    border: '1px solid var(--border)', 
                    borderRadius: 12, 
                    fontSize: 13,
                    color: 'var(--text)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: '0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand-primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.role === 'user' ? 'var(--bg-secondary)' : (msg.error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(139, 92, 246, 0.1)'),
                  color: msg.error ? 'var(--danger)' : 'var(--text)',
                  border: msg.role === 'user' ? '1px solid var(--border)' : (msg.error ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(139, 92, 246, 0.2)'),
                  fontSize: 14,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '12px 16px', borderRadius: '18px 18px 18px 4px', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-primary)', animation: `bounce 1s ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }} 
          style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 24, padding: '4px 16px', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}
        >
          <input
            style={{ flex: 1, border: 'none', background: 'transparent', padding: '10px 0', fontSize: 14, outline: 'none', color: 'var(--text-primary)' }}
            placeholder="Ask about your team performance..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="button" className="btn btn-ghost btn-icon" style={{ padding: 6, color: 'var(--text-muted)' }} title="Voice input (coming soon)">
            <Mic size={18} />
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-icon"
            style={{ borderRadius: '50%', width: 36, height: 36, marginLeft: 8 }}
            disabled={!input.trim() || loading}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
