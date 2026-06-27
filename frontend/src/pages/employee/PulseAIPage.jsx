import { useState, useEffect } from 'react';
import { employeeAPI } from '../../api/index.js';
import HeaderActions from '../../components/HeaderActions';
import PulseAIPanel from '../../components/PulseAIPanel';
import SkeletonLoader from '../../components/SkeletonLoader';
import { Bot, CheckCircle, XCircle, Clock, Mic, MessageSquare, Zap } from 'lucide-react';
import './PulseAIPage.css';

const ACTION_ICONS = {
  open_app: '🚀',
  close_app: '❌',
  open_url: '🌐',
  web_search: '🔍',
  run_routine: '⚡',
};
const ACTION_LABELS = {
  open_app: 'Open App',
  close_app: 'Close App',
  open_url: 'Open URL',
  web_search: 'Web Search',
  run_routine: 'Run Routine',
};

function timeAgo(dt) {
  const diff = Date.now() - new Date(dt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Demo commands when no real data
const DEMO_COMMANDS = [
  { _id: 'd1', rawInput: 'Open Visual Studio Code', parsedAction: { name: 'open_app', args: { app_name: 'Visual Studio Code' } }, result: 'success', inputType: 'text', createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { _id: 'd2', rawInput: 'Search how to use React hooks', parsedAction: { name: 'web_search', args: { query: 'how to use React hooks' } }, result: 'success', inputType: 'voice', createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString() },
  { _id: 'd3', rawInput: 'Open my GitHub repository', parsedAction: { name: 'open_url', args: { url: 'https://github.com' } }, result: 'success', inputType: 'text', createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString() },
  { _id: 'd4', rawInput: 'Close Spotify please', parsedAction: { name: 'close_app', args: { app_name: 'Spotify' } }, result: 'success', inputType: 'text', createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
  { _id: 'd5', rawInput: 'Run my morning routine', parsedAction: { name: 'run_routine', args: { routine_name: 'morning routine' } }, result: 'failed', inputType: 'text', createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
];

export default function PulseAIPage() {
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await employeeAPI.getAICommands();
      const cmds = res.data.commands || [];
      setCommands(cmds.length > 0 ? cmds : DEMO_COMMANDS);
    } catch {
      setCommands(DEMO_COMMANDS);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const stats = {
    total: commands.length,
    success: commands.filter(c => c.result === 'success').length,
    voice: commands.filter(c => c.inputType === 'voice').length,
    types: commands.reduce((acc, c) => {
      if (c.parsedAction?.name) acc[c.parsedAction.name] = (acc[c.parsedAction.name] || 0) + 1;
      return acc;
    }, {}),
  };

  return (
    <>
        <div className="page-header">
          <div>
            <div className="breadcrumbs">Me / Pulse AI</div>
            <h1>Pulse AI Assistant</h1>
          </div>
          <HeaderActions />
        </div>
        <div className="page page-enter">
          <div className="ai-page-grid">
            {/* Left — chat panel */}
            <div className="ai-page-left">
              <div className="glass-panel" style={{ height: 600, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                <PulseAIPanel />
              </div>
            </div>

            {/* Right — history + stats */}
            <div className="ai-page-right">
              {/* Stats */}
              <div className="glass-panel">
                <div className="section-title" style={{ marginBottom: 16 }}>Command Stats</div>
                <div className="ai-stats-grid">
                  <div className="ai-stat">
                    <div className="ai-stat-val">{stats.total}</div>
                    <div className="ai-stat-label">Total</div>
                  </div>
                  <div className="ai-stat">
                    <div className="ai-stat-val" style={{ color: 'var(--success)' }}>{stats.success}</div>
                    <div className="ai-stat-label">Successful</div>
                  </div>
                  <div className="ai-stat">
                    <div className="ai-stat-val" style={{ color: '#818CF8' }}>{stats.voice}</div>
                    <div className="ai-stat-label">Voice</div>
                  </div>
                  <div className="ai-stat">
                    <div className="ai-stat-val" style={{ color: 'var(--warning)' }}>
                      {stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0}%
                    </div>
                    <div className="ai-stat-label">Success Rate</div>
                  </div>
                </div>
                <div className="divider" />
                <div className="section-subtitle" style={{ marginBottom: 8 }}>Action Breakdown</div>
                {Object.entries(stats.types).map(([type, count]) => (
                  <div key={type} className="ai-type-row">
                    <span>{ACTION_ICONS[type] || '🤖'}</span>
                    <span style={{ flex: 1, fontSize: 12 }}>{ACTION_LABELS[type] || type}</span>
                    <span className="badge badge-info">{count}</span>
                  </div>
                ))}
              </div>

              {/* Command history */}
              <div className="glass-panel">
                <div className="section-header" style={{ marginBottom: 16 }}>
                  <div className="section-title">Recent Commands</div>
                  <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
                </div>
                {loading ? (
                  <div style={{ padding: '20px' }}>
                    <SkeletonLoader type="text" count={3} />
                  </div>
                ) : (
                  <div className="ai-history-list" style={{ maxHeight: 300, overflowY: 'auto', paddingRight: 8 }}>
                    {commands.map((cmd, i) => (
                      <div key={cmd._id || i} className="ai-history-item">
                        <div className="ai-history-icon">
                          {cmd.inputType === 'voice' ? <Mic size={13} /> : <MessageSquare size={13} />}
                        </div>
                        <div className="ai-history-body">
                          <div className="ai-history-input">{cmd.rawInput}</div>
                          {cmd.parsedAction?.name && (
                            <div className="ai-history-action">
                              {ACTION_ICONS[cmd.parsedAction.name]} {ACTION_LABELS[cmd.parsedAction.name]}
                              {cmd.parsedAction.args && Object.values(cmd.parsedAction.args)[0] && (
                                <span className="ai-history-arg">
                                  — {Object.values(cmd.parsedAction.args)[0]}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="ai-history-meta">
                            <Clock size={10} /> {timeAgo(cmd.createdAt)}
                          </div>
                        </div>
                        <div className="ai-history-status">
                          {cmd.result === 'success'
                            ? <CheckCircle size={15} color="var(--success)" />
                            : <XCircle size={15} color="var(--danger)" />
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sandboxed actions info */}
              <div className="glass-panel">
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Zap size={18} color="var(--accent-primary)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Sandboxed Action Set</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      Pulse AI can only perform a fixed, safe set of actions. It cannot run arbitrary shell commands or access files.
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                      {Object.entries(ACTION_LABELS).map(([k, v]) => (
                        <span key={k} className="badge badge-neutral" style={{ fontSize: 11 }}>
                          {ACTION_ICONS[k]} {v}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
  );
}
