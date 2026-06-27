import React, { useState, useEffect, useMemo } from 'react';
import { adminAPI } from '../../api/index.js';
import { Tags, Plus, Search, AlertTriangle, Trash2, CheckCircle2, ChevronRight, X } from 'lucide-react';
import PageHeader from '../../components/dashboard/PageHeader';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import '../../components/dashboard/dashboard-shared.css';

const CAT_BADGE  = { productive: 'cat-productive', distracting: 'cat-distracting', neutral: 'cat-neutral' };
const TYPE_BADGE = { app: 'type-app', domain: 'type-domain' };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [catFilter, setCatFilter]   = useState('all');
  const [search, setSearch]         = useState('');

  // Right pane state
  const [selectedRule, setSelectedRule] = useState(null); // null = none, 'new' = creating new, object = editing existing
  const [form, setForm] = useState({ type: 'app', pattern: '', category: 'productive', label: '', appliedTeams: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);

  const ALL_TEAMS = ['Engineering', 'Design', 'Data', 'Management', 'Marketing', 'Sales'];

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getCategories();
      setCategories(res.data.categories || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => {
    const c = { productive: 0, distracting: 0, neutral: 0 };
    categories.forEach(cat => { if (c[cat.category] !== undefined) c[cat.category]++; });
    return c;
  }, [categories]);

  const filtered = useMemo(() => {
    let list = categories;
    if (catFilter !== 'all') list = list.filter(c => c.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.pattern.toLowerCase().includes(q) || (c.label || '').toLowerCase().includes(q));
    }
    return list;
  }, [categories, catFilter, search]);

  const handleSelectRule = (rule) => {
    setSelectedRule(rule);
    setForm({
      type: rule.type || 'app',
      pattern: rule.pattern || '',
      category: rule.category || 'productive',
      label: rule.label || '',
      appliedTeams: rule.appliedTeams || []
    });
    setError('');
  };

  const handleNewRule = () => {
    setSelectedRule('new');
    setForm({ type: 'app', pattern: '', category: 'productive', label: '', appliedTeams: [] });
    setError('');
  };

  const toggleTeam = (team) => {
    setForm(prev => ({
      ...prev,
      appliedTeams: prev.appliedTeams.includes(team) 
        ? prev.appliedTeams.filter(t => t !== team)
        : [...prev.appliedTeams, team]
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault(); 
    setSaving(true); 
    setError('');
    try {
      if (selectedRule === 'new') {
        await adminAPI.createCategory(form);
      } else {
        await adminAPI.updateCategory(selectedRule._id, form);
      }
      setSelectedRule(null);
      load();
    } catch (err) { 
      setError(err.response?.data?.message || 'Error saving rule'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await adminAPI.deleteCategory(deleteModal._id);
      setDeleteModal(null);
      if (selectedRule && selectedRule._id === deleteModal._id) setSelectedRule(null);
      load();
    } catch {}
    finally { setSaving(false); }
  };

  return (
    <>
      <PageHeader breadcrumbs="Admin / Categories" title="App & Website Categories" />

      <div className="page page-enter">
        <div className="admin-stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
          {[
            { label: 'Total Rules', value: categories.length, iconClass: 'blue' },
            { label: 'Productive', value: counts.productive, iconClass: 'green' },
            { label: 'Distracting', value: counts.distracting, iconClass: 'amber' },
            { label: 'Neutral', value: counts.neutral, iconClass: 'purple' },
          ].map(({ label, value, iconClass }) => (
            <div key={label} className="admin-stat-card">
              <div className={`admin-stat-icon ${iconClass}`}><Tags size={18} /></div>
              <div>
                <div className="admin-stat-label">{label}</div>
                <div className="admin-stat-value">{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 2-Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24, height: 'calc(100vh - 280px)', minHeight: 600 }}>
          
          {/* Left Column: Rule List */}
          <div className="glass-panel" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div className="admin-section-title">Category Rules</div>
                  <div className="admin-section-sub">Control how apps and domains affect productivity scores</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={handleNewRule}>
                  <Plus size={14} /> Add Rule
                </button>
              </div>
              
              <div className="admin-filter-bar" style={{ marginBottom: 0 }}>
                <div className="admin-search-wrap">
                  <Search size={15} />
                  <input className="admin-search-input" placeholder="Search by pattern or label…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="admin-filter-tabs">
                  {['all', 'productive', 'distracting', 'neutral'].map(f => (
                    <button key={f} className={`admin-filter-tab ${catFilter === f ? 'active' : ''}`} onClick={() => setCatFilter(f)}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <LoadingSkeleton type="table" count={5} />
              ) : filtered.length === 0 ? (
                <EmptyState icon={Tags} title="No Category Rules" message="Add rules to define what's productive or distracting." action={handleNewRule} actionLabel="Add Rule" />
              ) : (
                <div style={{ padding: 12 }}>
                  {filtered.map(c => {
                    const isSelected = selectedRule && selectedRule._id === c._id;
                    return (
                      <div 
                        key={c._id} 
                        onClick={() => handleSelectRule(c)}
                        style={{ 
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                          padding: '16px 20px', borderRadius: 12, marginBottom: 8, cursor: 'pointer',
                          background: isSelected ? 'var(--surface-hover)' : 'transparent',
                          border: isSelected ? '1px solid var(--border)' : '1px solid transparent',
                          transition: 'all 0.2s'
                        }}
                        className="rule-list-item"
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{c.pattern}</span>
                            <span className={`admin-badge ${CAT_BADGE[c.category]}`}>{c.category}</span>
                            {c.isDefault && <span className="admin-badge source-default">Default</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                            <span className={`admin-badge ${TYPE_BADGE[c.type] || 'type-app'}`} style={{ fontSize: 10 }}>{c.type}</span>
                            {c.label && <span>{c.label}</span>}
                            {c.appliedTeams?.length > 0 && <span>• {c.appliedTeams.length} teams applied</span>}
                          </div>
                        </div>
                        <ChevronRight size={18} color={isSelected ? 'var(--text)' : 'var(--text-muted)'} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Rule Editor */}
          <div className="glass-panel" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
            {selectedRule ? (
              <>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: 16 }}>{selectedRule === 'new' ? 'Create New Rule' : 'Rule Details'}</h3>
                  <button className="btn btn-ghost" style={{ padding: 6 }} onClick={() => setSelectedRule(null)}><X size={18} /></button>
                </div>
                
                <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
                  {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}
                  
                  <form id="rule-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                      <label className="input-label">Rule Type</label>
                      <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} disabled={selectedRule !== 'new' && selectedRule.isDefault}>
                        <option value="app">App Name (e.g. Visual Studio Code)</option>
                        <option value="domain">Domain (e.g. github.com)</option>
                      </select>
                    </div>

                    <div>
                      <label className="input-label">Pattern matching</label>
                      <input className="input" placeholder={form.type === 'app' ? 'Visual Studio Code' : 'github.com'} value={form.pattern}
                        onChange={e => setForm(p => ({ ...p, pattern: e.target.value }))} required disabled={selectedRule !== 'new' && selectedRule.isDefault} />
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Case-insensitive matching. Use exact domain or app title snippet.</div>
                    </div>

                    <div>
                      <label className="input-label">Category</label>
                      <select className="input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                        <option value="productive">Productive</option>
                        <option value="neutral">Neutral</option>
                        <option value="distracting">Distracting</option>
                      </select>
                    </div>

                    <div>
                      <label className="input-label">Display Label (Optional)</label>
                      <input className="input" placeholder="e.g. Code Editor" value={form.label}
                        onChange={e => setForm(p => ({ ...p, label: e.target.value }))} />
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 4 }}>
                      <label className="input-label" style={{ marginBottom: 4 }}>Apply to Teams</label>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>If left empty, rule applies globally to all teams.</div>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {ALL_TEAMS.map(team => {
                          const isSelected = form.appliedTeams.includes(team);
                          return (
                            <div 
                              key={team} 
                              onClick={() => toggleTeam(team)}
                              style={{ 
                                padding: '6px 12px', borderRadius: 20, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                                background: isSelected ? 'rgba(37,99,235,0.1)' : 'var(--surface-alt)',
                                border: `1px solid ${isSelected ? '#2563EB' : 'var(--border)'}`,
                                color: isSelected ? '#2563EB' : 'var(--text-muted)',
                                fontWeight: isSelected ? 600 : 400
                              }}
                            >
                              {isSelected && <CheckCircle2 size={14} />}
                              {team}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </form>
                </div>

                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-50)' }}>
                  {selectedRule !== 'new' && !selectedRule.isDefault ? (
                    <button className="btn btn-ghost" style={{ color: 'var(--danger)', padding: '8px 12px' }} onClick={() => setDeleteModal(selectedRule)}>
                      <Trash2 size={16} /> Delete Rule
                    </button>
                  ) : <div></div>}
                  
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-outline" onClick={() => setSelectedRule(null)}>Cancel</button>
                    <button type="submit" form="rule-form" className="btn btn-primary" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Rule'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40, textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Tags size={24} color="var(--text-muted)" />
                </div>
                <h3 style={{ fontSize: 18, color: 'var(--text)', marginBottom: 8 }}>Select a Rule</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Click on a rule from the left panel to view its details, edit its category, or assign it to specific teams.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deleteModal && (
        <div className="admin-modal-backdrop" onClick={() => setDeleteModal(null)}>
          <div className="admin-modal confirm" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon"><AlertTriangle size={24} /></div>
            <h3 style={{ textAlign: 'center' }}>Delete Rule?</h3>
            <p className="modal-sub" style={{ textAlign: 'center' }}>
              Delete the rule for <strong style={{ fontFamily: 'monospace' }}>{deleteModal.pattern}</strong>? This cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={handleDelete} disabled={saving}>
                {saving ? 'Deleting…' : 'Delete Rule'}
              </button>
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDeleteModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
