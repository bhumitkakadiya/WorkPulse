import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Target, ChevronDown, ChevronRight, Plus, Activity } from 'lucide-react';

function GoalItem({ goal, allGoals, depth = 0, onUpdate }) {
  const [expanded, setExpanded] = useState(true);
  const children = allGoals.filter(g => g.parentGoalId === goal._id);
  const hasChildren = children.length > 0;

  const handleProgress = async (e) => {
    const newProgress = parseInt(e.target.value);
    try {
      await axios.put(`/api/goals/${goal._id}`, { progressPercent: newProgress });
      onUpdate();
    } catch (err) {
      console.error(err);
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

  return (
    <div style={{ marginLeft: depth * 24, marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
        <button 
          onClick={() => setExpanded(!expanded)} 
          style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', visibility: hasChildren ? 'visible' : 'hidden', color: 'var(--text-muted)' }}
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: 'var(--surface-50)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{goal.type}</span>
            <span style={{ fontWeight: 600 }}>{goal.title}</span>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: getStatusColor(goal.status) }} title={goal.status} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Owner: {goal.ownerId?.name || 'Unassigned'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: 200 }}>
          <input 
            type="range" 
            min="0" max="100" 
            value={goal.progressPercent || 0} 
            onChange={handleProgress} 
            style={{ flex: 1 }}
          />
          <span style={{ width: 40, textAlign: 'right', fontSize: 14, fontWeight: 600 }}>{goal.progressPercent || 0}%</span>
        </div>
      </div>
      {expanded && hasChildren && (
        <div style={{ borderLeft: '2px solid var(--border)', marginLeft: 16 }}>
          {children.map(child => (
            <GoalItem key={child._id} goal={child} allGoals={allGoals} depth={depth + 1} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function GoalsPage() {
  const { user, effectivePermissions } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', type: 'individual', parentGoalId: '' });

  const load = async () => {
    try {
      const res = await axios.get('/api/goals');
      setGoals(res.data.goals || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/goals', formData);
      setIsModalOpen(false);
      setFormData({ title: '', type: 'individual', parentGoalId: '' });
      load();
    } catch (err) {
      alert('Error creating goal');
    }
  };

  const topLevelGoals = goals.filter(g => !g.parentGoalId);

  return (
    <>
      <div style={{ padding: '24px 40px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1>Performance & Goals</h1>
            <div className="breadcrumbs">Company / OKRs</div>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> New Goal
          </button>
        </div>

        <div className="glass-panel" style={{ marginBottom: 24 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Target size={20} color="var(--accent-primary)" />
            Cascading Objectives
          </h3>
          {loading ? (
            <div>Loading goals...</div>
          ) : goals.length === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>No goals found. Create a company OKR to get started!</div>
          ) : (
            topLevelGoals.map(goal => (
              <GoalItem key={goal._id} goal={goal} allGoals={goals} onUpdate={load} />
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 12, width: '100%', maxWidth: 400 }}>
            <h2>Create Goal</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8 }}>Goal Title</label>
                <input type="text" className="input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8 }}>Goal Type</label>
                <select className="input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="company">Company</option>
                  <option value="team">Team</option>
                  <option value="individual">Individual</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8 }}>Parent Goal (Optional)</label>
                <select className="input" value={formData.parentGoalId} onChange={e => setFormData({...formData, parentGoalId: e.target.value})}>
                  <option value="">None</option>
                  {goals.map(g => (
                    <option key={g._id} value={g._id}>{g.type.toUpperCase()}: {g.title}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
