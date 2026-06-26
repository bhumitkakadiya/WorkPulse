import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/index.js';
import HeaderActions from '../../components/HeaderActions';
import { UserPlus, RefreshCw, Trash2, Edit, Tags, Shield, Users as UsersIcon } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import './AdminPanel.css';

import DashboardLayout from '../../components/DashboardLayout';

const TABS = ['users', 'categories'];

export default function AdminPanel() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'employee', department: '' });
  const [catForm, setCatForm] = useState({ type: 'app', pattern: '', category: 'productive', label: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [uRes, cRes] = await Promise.all([adminAPI.getUsers(), adminAPI.getCategories()]);
      setUsers(uRes.data.users || []);
      setCategories(cRes.data.categories || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAddUser = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await adminAPI.createUser(userForm);
      setShowAddUser(false); setUserForm({ name: '', email: '', password: '', role: 'employee', department: '' });
      load();
    } catch (err) { alert(err.response?.data?.message || 'Error creating user'); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    await adminAPI.deactivateUser(id); load();
  };

  const handleAddCategory = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await adminAPI.createCategory(catForm);
      setShowAddCat(false); setCatForm({ type: 'app', pattern: '', category: 'productive', label: '' });
      load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDeleteCat = async (id) => {
    if (!confirm('Delete this category rule?')) return;
    await adminAPI.deleteCategory(id); load();
  };

  const roleColors = { admin: 'danger', manager: 'warning', employee: 'info' };

  return (
    <>
        <div className="page-header">
          <div>
            <div className="breadcrumbs">Org / Settings</div>
            <h1>Admin Panel</h1>
          </div>
          <HeaderActions />
        </div>
        <div className="page page-enter">
          {/* Tab nav */}
          <div className="tab-bar" style={{ marginBottom: 24, maxWidth: 400 }}>
            {TABS.map(t => (
              <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} id={`admin-tab-${t}`}>
                {t === 'users' ? <><Shield size={14} /> Users</> : <><Tags size={14} /> Categories</>}
              </button>
            ))}
          </div>

          {/* ===== USERS TAB ===== */}
          {tab === 'users' && (
            <div>
              <div className="section-header" style={{ marginBottom: 20 }}>
                <div>
                  <div className="section-title">User Management</div>
                  <div className="section-subtitle">{users.length} total users in the organization</div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
                    <RefreshCw size={14} className={loading ? 'spin-icon' : ''} /> Refresh
                  </button>
                  <button id="add-user-btn" className="btn btn-primary btn-sm" onClick={() => setShowAddUser(true)}>
                    <UserPlus size={14} /> Add User
                  </button>
                </div>
              </div>

              {loading ? (
                <LoadingSkeleton type="table" count={5} />
              ) : users.length === 0 ? (
                <EmptyState icon={UsersIcon} title="No Users" message="There are no users in the organization yet." action={() => setShowAddUser(true)} actionLabel="Add User" />
              ) : (
                <div className="glass-panel">
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Department</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u._id} className="table-row-hover">
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div className="admin-user-avatar">{u.name.charAt(0)}</div>
                                <span style={{ fontWeight: 600 }}>{u.name}</span>
                              </div>
                            </td>
                            <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                            <td><span className={`badge badge-${roleColors[u.role]}`}>{u.role}</span></td>
                            <td style={{ color: 'var(--text-secondary)' }}>{u.department || '—'}</td>
                            <td>
                              <span className={`badge badge-${u.isActive ? 'success' : 'neutral'}`}>
                                {u.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              {u.isActive && (
                                <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDeactivate(u._id)} title="Deactivate">
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Add User Modal */}
              {showAddUser && (
                <div className="modal-backdrop" onClick={() => setShowAddUser(false)}>
                  <div className="modal" onClick={e => e.stopPropagation()}>
                    <h3 style={{ marginBottom: 20, fontSize: 18, fontWeight: 700 }}>Add New User</h3>
                    <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {[
                        { id: 'add-user-name', key: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
                        { id: 'add-user-email', key: 'email', label: 'Email', type: 'email', placeholder: 'john@company.com' },
                        { id: 'add-user-password', key: 'password', label: 'Password', type: 'password', placeholder: 'Min 6 chars' },
                        { id: 'add-user-dept', key: 'department', label: 'Department', type: 'text', placeholder: 'Engineering' },
                      ].map(f => (
                        <div key={f.key} className="input-group">
                          <label className="input-label" htmlFor={f.id}>{f.label}</label>
                          <input id={f.id} className="input" type={f.type} placeholder={f.placeholder} value={userForm[f.key]} onChange={e => setUserForm(p => ({ ...p, [f.key]: e.target.value }))} required />
                        </div>
                      ))}
                      <div className="input-group">
                        <label className="input-label" htmlFor="add-user-role">Role</label>
                        <select id="add-user-role" className="input" value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))}>
                          <option value="employee">Employee</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                        <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
                          {saving ? 'Creating...' : 'Create User'}
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => setShowAddUser(false)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== CATEGORIES TAB ===== */}
          {tab === 'categories' && (
            <div>
              <div className="section-header" style={{ marginBottom: 20 }}>
                <div>
                  <div className="section-title">App & Website Categorization</div>
                  <div className="section-subtitle">Control how apps and domains are scored as productive / neutral / distracting</div>
                </div>
                <button id="add-category-btn" className="btn btn-primary btn-sm" onClick={() => setShowAddCat(true)}>
                  <Tags size={14} /> Add Rule
                </button>
              </div>
              {loading ? (
                <LoadingSkeleton type="table" count={3} />
              ) : categories.length === 0 ? (
                <EmptyState icon={Tags} title="No Categories" message="No category rules defined yet." action={() => setShowAddCat(true)} actionLabel="Add Rule" />
              ) : (
                <div className="glass-panel">
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr><th>Type</th><th>Pattern</th><th>Category</th><th>Label</th><th>Source</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {categories.map(c => (
                          <tr key={c._id} className="table-row-hover">
                            <td><span className="badge badge-neutral">{c.type}</span></td>
                            <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{c.pattern}</td>
                            <td><span className={`badge badge-${c.category === 'productive' ? 'productive' : c.category === 'distracting' ? 'distracting' : 'info'}`}>{c.category}</span></td>
                            <td style={{ color: 'var(--text-secondary)' }}>{c.label || '—'}</td>
                            <td><span className={`badge badge-${c.isDefault ? 'neutral' : 'info'}`}>{c.isDefault ? 'Default' : 'Custom'}</span></td>
                            <td>
                              {!c.isDefault && (
                                <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDeleteCat(c._id)}><Trash2 size={13} /></button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {showAddCat && (
                <div className="modal-backdrop" onClick={() => setShowAddCat(false)}>
                  <div className="modal" onClick={e => e.stopPropagation()}>
                    <h3 style={{ marginBottom: 20, fontSize: 18, fontWeight: 700 }}>Add Category Rule</h3>
                    <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div className="input-group">
                        <label className="input-label" htmlFor="cat-type">Type</label>
                        <select id="cat-type" className="input" value={catForm.type} onChange={e => setCatForm(p => ({ ...p, type: e.target.value }))}>
                          <option value="app">App Name</option>
                          <option value="domain">Domain</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label className="input-label" htmlFor="cat-pattern">Pattern (e.g. "Slack" or "github.com")</label>
                        <input id="cat-pattern" className="input" placeholder="Visual Studio Code" value={catForm.pattern} onChange={e => setCatForm(p => ({ ...p, pattern: e.target.value }))} required />
                      </div>
                      <div className="input-group">
                        <label className="input-label" htmlFor="cat-category">Category</label>
                        <select id="cat-category" className="input" value={catForm.category} onChange={e => setCatForm(p => ({ ...p, category: e.target.value }))}>
                          <option value="productive">Productive</option>
                          <option value="neutral">Neutral</option>
                          <option value="distracting">Distracting</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label className="input-label" htmlFor="cat-label">Label (optional)</label>
                        <input id="cat-label" className="input" placeholder="Code Editor" value={catForm.label} onChange={e => setCatForm(p => ({ ...p, label: e.target.value }))} />
                      </div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                        <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
                          {saving ? 'Saving...' : 'Add Rule'}
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => setShowAddCat(false)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}


        </div>
      </>
  );
}
