import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Bot, X, Minimize2, Maximize2, Loader } from 'lucide-react';
import { aiAPI } from '../api/index.js';
import './PulseAIPanel.css';

const SUGGESTIONS = [
  'Open Visual Studio Code',
  'Search how to center a div in CSS',
  'Open GitHub in browser',
  'Close Spotify',
];

export default function PulseAIPanel({ onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I\'m Pulse AI 👋 Tell me what you need — open apps, search the web, close programs, or run routines.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user', text };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiAPI.sendCommand(text);
      const { action, result, errorMessage } = res.data;
      let reply = '';
      if (result === 'success' && action) {
        reply = `✅ Got it! I'll ${formatAction(action)}.`;
      } else {
        reply = `⚠️ I couldn't process that: ${errorMessage || 'Unknown error'}. Please try rephrasing.`;
      }
      setMessages(m => [...m, { role: 'assistant', text: reply, action }]);
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', text: '❌ Connection error. Please check the backend is running.' }]);
    } finally {
      setLoading(false);
    }
  };

  function formatAction(action) {
    if (!action) return 'process that';
    switch (action.name) {
      case 'open_app': return `open ${action.args?.app_name}`;
      case 'close_app': return `close ${action.args?.app_name}`;
      case 'open_url': return `open ${action.args?.url}`;
      case 'web_search': return `search for "${action.args?.query}"`;
      case 'run_routine': return `run routine "${action.args?.routine_name}"`;
      default: return 'process that';
    }
  }

  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser.');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SR();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setInput(t);
      setListening(false);
    };
    recognitionRef.current.onerror = () => setListening(false);
    recognitionRef.current.onend = () => setListening(false);
    recognitionRef.current.start();
    setListening(true);
  };

  const stopVoice = () => { recognitionRef.current?.stop(); setListening(false); };

  if (minimized) {
    return (
      <div className="pulse-ai-minimized" onClick={() => setMinimized(false)}>
        <Bot size={20} />
        <span>Pulse AI</span>
        <Maximize2 size={14} />
      </div>
    );
  }

  return (
    <div className="pulse-ai-panel">
      {/* Header */}
      <div className="pulse-ai-header">
        <div className="pulse-ai-header-left">
          <div className="pulse-ai-icon"><Bot size={18} /></div>
          <div>
            <div className="pulse-ai-title">Pulse AI</div>
            <div className="pulse-ai-subtitle">Jarvis-style assistant</div>
          </div>
        </div>
        <div className="pulse-ai-header-actions">
          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setMinimized(true)} title="Minimize"><Minimize2 size={16} /></button>
          {onClose && <button className="btn btn-icon btn-ghost btn-sm" onClick={onClose} title="Close"><X size={16} /></button>}
        </div>
      </div>

      {/* Messages */}
      <div className="pulse-ai-messages">
        <div style={{ flex: 1 }} />
        {messages.map((msg, i) => (
          <div key={i} className={`pulse-msg pulse-msg-${msg.role}`}>
            {msg.role === 'assistant' && <div className="pulse-msg-avatar"><Bot size={14} /></div>}
            <div className="pulse-msg-bubble">{msg.text}</div>
          </div>
        ))}
        {loading && (
          <div className="pulse-msg pulse-msg-assistant">
            <div className="pulse-msg-avatar"><Bot size={14} /></div>
            <div className="pulse-msg-bubble pulse-typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        {messages.length === 1 && (
          <div className="pulse-suggestions">
            {SUGGESTIONS.map(s => (
              <button key={s} className="pulse-suggestion" onClick={() => send(s)}>{s}</button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form className="pulse-ai-input-row" onSubmit={e => { e.preventDefault(); send(input); }}>
        <input
          id="pulse-ai-input"
          className="input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={listening ? 'Listening...' : 'Ask Pulse AI anything...'}
          disabled={loading || listening}
        />
        <button
          type="button"
          className={`btn btn-icon ${listening ? 'btn-danger' : 'btn-ghost'}`}
          onClick={listening ? stopVoice : startVoice}
          title="Voice input"
        >
          {listening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
        <button
          id="pulse-ai-send"
          type="submit"
          className="btn btn-primary btn-icon"
          disabled={!input.trim() || loading}
        >
          {loading ? <Loader size={16} className="spin-icon" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
}
