import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../api/index.js';
import DashboardLayout from '../../components/DashboardLayout';
import HeaderActions from '../../components/HeaderActions';
import { UserPlus, RefreshCw, Pencil, Trash2, Search, Users, X, AlertTriangle, Eye } from 'lucide-react';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';

import '../../components/dashboard/dashboard-shared.css';

const ROLE_COLORS = { admin: 'role-admin', manager: 'role-manager', employee: 'role-employee' };

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals
  const [addModal, setAddModal]     = useState(false);
  const [editModal, setEditModal]   = useState(null); // user object
  const [deleteModal, setDeleteModal] = useState(null); // user object

  const [form, setForm]     = useState({ name: '', email: '', password: '', role: 'employee', department: '' });
  const [editForm, setEditForm] = useState({ role: 'employee', department: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers();
      setUsers(res.data.users || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = users;
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.includes(q));
    }
    return list;
  }, [users, search, roleFilter]);

  const roleBreakdown = useMemo(() => {
    const rb = { admin: 0, manager: 0, employee: 0 };
    users.forEach(u => { if (rb[u.role] !== undefined) rb[u.role]++; });
    return rb;
  }, [users]);

  const handleAdd = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await adminAPI.createUser(form);
      setAddModal(false);
      setForm({ name: '', email: '', password: '', role: 'employee', department: '' });
      load();
    } catch (err) { setError(err.response?.data?.message || 'Error creating user'); }
    finally { setSaving(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await adminAPI.updateUser(editModal._id, editForm);
      setEditModal(null);
      load();
    } catch (err) { setError(err.response?.data?.message || 'Error updating user'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await adminAPI.deactivateUser(deleteModal._id);
      setDeleteModal(null);
      load();
    } catch {}
    finally { setSaving(false); }
  };

  const openEdit = (u) => {
    setEditForm({ role: u.role, department: u.department || '' });
    setEditModal(u);
    setError('');
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="breadcrumbs">Admin / Users</div>
          <h1>User Management</h1>
        </div>
        <HeaderActions />
      </div>

      <div className="page page-enter">
        {/* Stats Row */}
        <div className="admin-stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
          {[
            { label: 'Total Users', value: users.length, iconClass: 'blue' },
            { label: 'Admins', value: roleBreakdown.admin, iconClass: 'purple' },
            { label: 'Managers', value: roleBreakdown.manager, iconClass: 'amber' },
            { label: 'Employees', value: roleBreakdown.employee, iconClass: 'green' },
          ].map(({ label, value, iconClass }) => (
            <div key={label} className="admin-stat-card">
              <div className={`admin-stat-icon ${iconClass}`}><Users size={18} /></div>
              <div>
                <div className="admin-stat-label">{label}</div>
                <div className="admin-stat-value">{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Header Row */}
        <div className="admin-section-row">
          <div>
            <div className="admin-section-title">All Users</div>
            <div className="admin-section-sub">{users.length} total users in the organization</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin-icon' : ''} /> Refresh
            </button>
            <button id="add-user-btn" className="btn btn-primary btn-sm" onClick={() => { setAddModal(true); setError(''); }}>
              <UserPlus size={14} /> Add User
            </button>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="admin-filter-bar">
          <div className="admin-search-wrap">
            <Search size={15} />
            <input className="admin-search-input" placeholder="Search by name, email, or role…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="admin-filter-tabs">
            {['all', 'admin', 'manager', 'employee'].map(r => (
              <button key={r} className={`admin-filter-tab ${roleFilter === r ? 'active' : ''}`} onClick={() => setRoleFilter(r)}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? <LoadingSkeleton type="table" count={5} /> :
         filtered.length === 0 ? <EmptyState icon={Users} title="No Users Found" message="Try adjusting your search or filter." action={() => setAddModal(true)} actionLabel="Add User" /> : (
          <div className="admin-table-card">
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
                  {filtered.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="admin-user-avatar">{u.name.charAt(0)}</div>
                          <span style={{ fontWeight: 600 }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                      <td><span className={`admin-badge ${ROLE_COLORS[u.role]}`}>{u.role}</span></td>
                      <td style={{ color: 'var(--text-muted)' }}>{u.department || '—'}</td>
                      <td>
                        <span className={`admin-badge ${u.isActive ? 'status-active' : 'status-inactive'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-action-btns">
                          <button className="admin-action-btn" title="View Activity" onClick={() => navigate(`/admin/users/${u._id}/activity`)}>
                            <Eye size={13} />
                          </button>
                          <button className="admin-action-btn" title="Edit User" onClick={() => openEdit(u)}>
                            <Pencil size={13} />
                          </button>
                          {u.isActive && (
                            <button className="admin-action-btn danger" title="Deactivate User" onClick={() => setDeleteModal(u)}>
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

      {/* Add User Modal */}
      {addModal && (
        <div className="admin-modal-backdrop" onClick={() => setAddModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>Add New User</h3>
            <p className="modal-sub">The user will receive login credentials for their account.</p>
            {error && <div className="login-error" style={{ marginBottom: 12 }}>{error}</div>}
            <form className="modal-form" onSubmit={handleAdd}>
              {[
                { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Jane Smith' },
                { key: 'email', label: 'Email', type: 'email', placeholder: 'jane@company.com' },
                { key: 'password', label: 'Password', type: 'password', placeholder: 'Min 8 chars' },
                { key: 'department', label: 'Department', type: 'text', placeholder: 'Engineering' },
              ].map(f => (
                <div key={f.key} className="input-group">
                  <label className="input-label">{f.label}</label>
                  <input className="input" type={f.type} placeholder={f.placeholder} value={form[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} required={f.key !== 'department'} />
                </div>
              ))}
              <div className="input-group">
                <label className="input-label">Role</label>
                <select className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create User'}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setAddModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModal && (
        <div className="admin-modal-backdrop" onClick={() => setEditModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>Edit User</h3>
            <p className="modal-sub">Update role or department for <strong>{editModal.name}</strong>.</p>
            {error && <div className="login-error" style={{ marginBottom: 12 }}>{error}</div>}
            <form className="modal-form" onSubmit={handleEdit}>
              <div className="input-group">
                <label className="input-label">Role</label>
                <select className="input" value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Department</label>
                <input className="input" type="text" placeholder="Engineering" value={editForm.department}
                  onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))} />
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
            <h3 style={{ textAlign: 'center' }}>Deactivate User?</h3>
            <p className="modal-sub" style={{ textAlign: 'center' }}>
              Remove <strong>{deleteModal.name}</strong> from the organization? They will no longer be able to log in.
            </p>
            <div className="modal-actions">
              <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={handleDelete} disabled={saving}>
                {saving ? 'Deactivating…' : 'Deactivate'}
              </button>
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDeleteModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
