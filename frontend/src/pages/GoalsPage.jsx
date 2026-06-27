import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Target, ChevronDown, ChevronRight, Plus, CheckCircle, Search, Calendar, User } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';
import PageError from '../components/PageError';

// Circular Progress Component
const ProgressRing = ({ progress, size = 40, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  let color = 'var(--text-muted)';
  if (progress >= 70) color = 'var(--success)';
  else if (progress >= 30) color = 'var(--warning)';
  else if (progress > 0) color = 'var(--danger)';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle stroke="var(--border)" fill="transparent" strokeWidth={strokeWidth} r={radius} cx={size/2} cy={size/2} />
      <circle 
        stroke={color} 
        fill="transparent" 
        strokeWidth={strokeWidth} 
        strokeDasharray={circumference + ' ' + circumference} 
        style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease' }} 
        r={radius} cx={size/2} cy={size/2} 
        transform={`rotate(-90 ${size/2} ${size/2})`} 
      />
      <text x="50%" y="50%" dy=".3em" textAnchor="middle" fontSize={size * 0.3} fontWeight="600" fill="var(--text-primary)">
        {Math.round(progress)}%
      </text>
    </svg>
  );
};

function GoalItem({ goal, allGoals, depth = 0, onUpdate }) {
  const [expanded, setExpanded] = useState(depth === 0);
  const [krExpanded, setKrExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const children = allGoals.filter(g => g.parentGoalId === goal._id);
  const hasChildren = children.length > 0;

  const handleKrupdate = async (krIndex, newCurrent) => {
    setSaving(true);
    try {
      const updatedKRs = [...goal.keyResults];
      updatedKRs[krIndex] = { ...updatedKRs[krIndex], current: Number(newCurrent) };
      await axios.put(`/api/goals/${goal._id}`, { keyResults: updatedKRs });
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'on_track': return 'var(--success)';
      case 'at_risk': return 'var(--warning)';
      case 'behind': return 'var(--danger)';
      case 'completed': return 'var(--brand-primary)';
      default: return 'var(--text-muted)';
    }
  };

  const typeColor = goal.type === 'company' ? '#8B5CF6' : goal.type === 'team' ? '#3B82F6' : '#10B981';

  return (
    <div style={{ marginLeft: depth > 0 ? 32 : 0, marginTop: 16, position: 'relative' }}>
      {depth > 0 && (
        <div style={{ position: 'absolute', left: -24, top: -16, bottom: 24, width: 2, background: 'var(--border)' }}></div>
      )}
      {depth > 0 && (
        <div style={{ position: 'absolute', left: -24, top: 24, width: 16, height: 2, background: 'var(--border)' }}></div>
      )}
      
      <div className="glass-panel" style={{ padding: '16px 20px', borderLeft: `4px solid ${typeColor}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            onClick={() => setExpanded(!expanded)} 
            style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', visibility: hasChildren ? 'visible' : 'hidden', color: 'var(--text-muted)' }}
          >
            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
          
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: `${typeColor}20`, color: typeColor, fontWeight: 600, textTransform: 'uppercase' }}>
                {goal.type}
              </span>
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{goal.title}</span>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: getStatusColor(goal.status) }} title={goal.status} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={14} /> {goal.ownerId?.name || 'Unassigned'}</span>
              {goal.targetDate && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={14} /> {new Date(goal.targetDate).toLocaleDateString()}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {goal.keyResults && goal.keyResults.length > 0 && (
              <button 
                className="btn btn-ghost" 
                onClick={() => setKrExpanded(!krExpanded)}
                style={{ fontSize: 13 }}
              >
                {goal.keyResults.length} Key Results {krExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
            <ProgressRing progress={goal.progressPercent || 0} size={48} />
          </div>
        </div>

        {/* Key Results Accordion */}
        {krExpanded && goal.keyResults && goal.keyResults.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Results</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {goal.keyResults.map((kr, idx) => {
                const krProgress = kr.target > 0 ? Math.min(100, (kr.current / kr.target) * 100) : 0;
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--surface-50)', padding: '8px 12px', borderRadius: 6 }}>
                    <div style={{ flex: 1, fontSize: 14 }}>{kr.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 200 }}>
                      <input 
                        type="number" 
                        value={kr.current} 
                        onChange={(e) => handleKrupdate(idx, e.target.value)}
                        style={{ width: 60, padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        disabled={saving}
                      />
                      <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/ {kr.target}</span>
                    </div>
                    <div style={{ width: 100, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${krProgress}%`, background: 'var(--brand-primary)', transition: 'width 0.3s ease' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {expanded && hasChildren && (
        <div style={{ position: 'relative' }}>
          {children.map(child => (
            <GoalItem key={child._id} goal={child} allGoals={allGoals} depth={depth + 1} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // Modal Form State
  const [formData, setFormData] = useState({ title: '', description: '', type: 'individual', parentGoalId: '', targetDate: '' });
  const [keyResults, setKeyResults] = useState([{ title: '', target: 100, current: 0 }]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/goals');
      setGoals(res.data.goals || []);
    } catch (e) { 
      console.error(e); 
      setError('Failed to load goals');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const validKRs = keyResults.filter(kr => kr.title.trim() !== '');
      await axios.post('/api/goals', { ...formData, keyResults: validKRs });
      setIsModalOpen(false);
      setFormData({ title: '', description: '', type: 'individual', parentGoalId: '', targetDate: '' });
      setKeyResults([{ title: '', target: 100, current: 0 }]);
      load();
    } catch (err) {
      alert('Error creating goal');
    }
  };

  const addKR = () => setKeyResults([...keyResults, { title: '', target: 100, current: 0 }]);
  const updateKR = (index, field, value) => {
    const newKRs = [...keyResults];
    newKRs[index][field] = value;
    setKeyResults(newKRs);
  };

  const filteredGoals = goals.filter(g => {
    if (activeTab === 'all') return true;
    if (activeTab === 'company') return g.type === 'company';
    if (activeTab === 'team') return g.type === 'team';
    if (activeTab === 'my_goals') return g.ownerId?._id === user?._id || g.ownerId?._id === user?.id;
    return true;
  });

  const topLevelGoals = filteredGoals.filter(g => !g.parentGoalId);

  return (
    <>
      <div style={{ padding: '24px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1>Performance & Goals</h1>
            <div className="breadcrumbs">Workspace / OKRs</div>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> New Goal
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          {['all', 'company', 'team', 'my_goals'].map(tab => (
            <button 
              key={tab}
              className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab(tab)}
              style={{ textTransform: 'capitalize', borderRadius: 20 }}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Goals Content */}
        <div className="goals-content">
          {loading ? (
            <div style={{ padding: '20px 0' }}>
              <SkeletonLoader type="card" count={3} />
            </div>
          ) : error ? (
            <PageError message={error} onRetry={load} />
          ) : goals.length === 0 ? (
            <div className="empty-state">
              <Target size={48} color="var(--accent-primary)" style={{ opacity: 0.5, marginBottom: 16 }} />
              <h3>No goals yet</h3>
              <p>Create your first company OKR to get started.</p>
              <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ marginTop: 16 }}>Create Goal</button>
            </div>
          ) : (
            <div>
              {topLevelGoals.map(goal => (
                <GoalItem key={goal._id} goal={goal} allGoals={goals} onUpdate={load} />
              ))}
              {topLevelGoals.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No goals match this filter.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content glass-panel" style={{ padding: 24, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: 20 }}>Create New Goal</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Objective Title</label>
                <input type="text" className="input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="e.g. Expand into European Market" />
              </div>
              
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Level</label>
                  <select className="input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="company">Company</option>
                    <option value="team">Team</option>
                    <option value="individual">Individual</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Due Date</label>
                  <input type="date" className="input" value={formData.targetDate} onChange={e => setFormData({...formData, targetDate: e.target.value})} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label>Parent Goal (Optional)</label>
                <select className="input" value={formData.parentGoalId} onChange={e => setFormData({...formData, parentGoalId: e.target.value})}>
                  <option value="">None (Top Level)</option>
                  {goals.map(g => (
                    <option key={g._id} value={g._id}>{g.type.toUpperCase()}: {g.title}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 24, background: 'var(--surface-50)', padding: 16, borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <label style={{ margin: 0 }}>Key Results</label>
                  <button type="button" className="btn btn-ghost" onClick={addKR} style={{ padding: '4px 8px', fontSize: 12 }}><Plus size={14} /> Add KR</button>
                </div>
                {keyResults.map((kr, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input type="text" className="input" placeholder="Key result description..." value={kr.title} onChange={e => updateKR(idx, 'title', e.target.value)} style={{ flex: 1 }} />
                    <input type="number" className="input" placeholder="Target" value={kr.target} onChange={e => updateKR(idx, 'target', e.target.value)} style={{ width: 100 }} title="Target Value" />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
