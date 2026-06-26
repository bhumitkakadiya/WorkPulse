import { useState, useEffect, useMemo } from 'react';
import { adminAPI } from '../../api/index.js';
import DashboardLayout from '../../components/DashboardLayout';
import HeaderActions from '../../components/HeaderActions';
import { Tags, Plus, Pencil, Trash2, Search, AlertTriangle } from 'lucide-react';
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

  const [addModal, setAddModal]       = useState(false);
  const [editModal, setEditModal]     = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  const [form, setForm]         = useState({ type: 'app', pattern: '', category: 'productive', label: '' });
  const [editForm, setEditForm] = useState({ category: 'productive', label: '' });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

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

  const handleAdd = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await adminAPI.createCategory(form);
      setAddModal(false);
      setForm({ type: 'app', pattern: '', category: 'productive', label: '' });
      load();
    } catch (err) { setError(err.response?.data?.message || 'Error creating rule'); }
    finally { setSaving(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await adminAPI.updateCategory(editModal._id, editForm);
      setEditModal(null);
      load();
    } catch (err) { setError(err.response?.data?.message || 'Error updating rule'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await adminAPI.deleteCategory(deleteModal._id);
      setDeleteModal(null);
      load();
    } catch {}
    finally { setSaving(false); }
  };

  const openEdit = (c) => {
    setEditForm({ category: c.category, label: c.label || '' });
    setEditModal(c);
    setError('');
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="breadcrumbs">Admin / Categories</div>
          <h1>App &amp; Website Categories</h1>
        </div>
        <HeaderActions />
      </div>

      <div className="page page-enter">
        {/* Stats Row */}
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

        {/* Header */}
        <div className="admin-section-row">
          <div>
            <div className="admin-section-title">Category Rules</div>
            <div className="admin-section-sub">Control how apps and domains affect productivity scores</div>
          </div>
          <button id="add-category-btn" className="btn btn-primary btn-sm" onClick={() => { setAddModal(true); setError(''); }}>
            <Plus size={14} /> Add Rule
          </button>
        </div>

        {/* Search + Filter */}
        <div className="admin-filter-bar">
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

        {/* Table */}
        {loading ? <LoadingSkeleton type="table" count={5} /> :
         filtered.length === 0 ? <EmptyState icon={Tags} title="No Category Rules" message="Add rules to define what's productive or distracting." action={() => setAddModal(true)} actionLabel="Add Rule" /> : (
          <div className="admin-table-card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Type</th><th>Pattern</th><th>Category</th><th>Label</th><th>Source</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c._id}>
                      <td><span className={`admin-badge ${TYPE_BADGE[c.type] || 'type-app'}`}>{c.type}</span></td>
                      <td style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-muted)' }}>{c.pattern}</td>
                      <td><span className={`admin-badge ${CAT_BADGE[c.category]}`}>{c.category}</span></td>
                      <td>{c.label || '—'}</td>
                      <td>
                        <span className={`admin-badge ${c.isDefault ? 'source-default' : 'source-custom'}`}>
                          {c.isDefault ? 'Default' : 'Custom'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-action-btns">
                          <button className="admin-action-btn" title="Edit Rule" onClick={() => openEdit(c)}>
                            <Pencil size={13} />
                          </button>
                          {!c.isDefault && (
                            <button className="admin-action-btn danger" title="Delete Rule" onClick={() => setDeleteModal(c)}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Rule Modal */}
      {addModal && (
        <div className="admin-modal-backdrop" onClick={() => setAddModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>Add Category Rule</h3>
            <p className="modal-sub">Define whether an app or website is productive, neutral, or distracting.</p>
            {error && <div className="login-error" style={{ marginBottom: 12 }}>{error}</div>}
            <form className="modal-form" onSubmit={handleAdd}>
              <div className="input-group">
                <label className="input-label">Type</label>
                <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  <option value="app">App Name</option>
                  <option value="domain">Domain</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Pattern (e.g. "Slack" or "github.com")</label>
                <input className="input" placeholder={form.type === 'app' ? 'Visual Studio Code' : 'github.com'} value={form.pattern}
                  onChange={e => setForm(p => ({ ...p, pattern: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label className="input-label">Category</label>
                <select className="input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  <option value="productive">Productive</option>
                  <option value="neutral">Neutral</option>
                  <option value="distracting">Distracting</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Label (optional)</label>
                <input className="input" placeholder="Code Editor" value={form.label}
                  onChange={e => setForm(p => ({ ...p, label: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Rule'}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setAddModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Rule Modal */}
      {editModal && (
        <div className="admin-modal-backdrop" onClick={() => setEditModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>Edit Rule</h3>
            <p className="modal-sub">Editing: <strong style={{ fontFamily: 'monospace' }}>{editModal.pattern}</strong></p>
            {error && <div className="login-error" style={{ marginBottom: 12 }}>{error}</div>}
            <form className="modal-form" onSubmit={handleEdit}>
              <div className="input-group">
                <label className="input-label">Category</label>
                <select className="input" value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}>
                  <option value="productive">Productive</option>
                  <option value="neutral">Neutral</option>
                  <option value="distracting">Distracting</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Label (optional)</label>
                <input className="input" placeholder="Code Editor" value={editForm.label}
                  onChange={e => setEditForm(p => ({ ...p, label: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setEditModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
