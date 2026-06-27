import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../api/index.js';
import HeaderActions from '../../components/HeaderActions';
import { 
  UserPlus, RefreshCw, Pencil, Trash2, Search, Users, 
  AlertTriangle, Eye, Download, ChevronLeft, ChevronRight, 
  EyeOff, UserSearch, X, Upload 
} from 'lucide-react';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import '../../components/dashboard/dashboard-shared.css';

const ROLE_COLORS = { admin: 'red', manager: 'amber', employee: 'blue' };

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Search
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals & Drawers
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [importModal, setImportModal] = useState(false);

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee', department: 'Engineering', userId: '', mobileNumber: '', status: 'Active' });
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'employee', department: '', status: 'Active' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    
    // Role
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter);
    // Dept
    if (deptFilter !== 'all') list = list.filter(u => (u.department || '').toLowerCase() === deptFilter.toLowerCase());
    // Status
    if (statusFilter !== 'all') {
      const isAct = statusFilter === 'active';
      list = list.filter(u => u.isActive === isAct);
    }
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.userId && u.userId.toLowerCase().includes(q)));
    }
    // Sort
    list = [...list].sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'role') return a.role.localeCompare(b.role);
      // default newest
      return new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now());
    });

    return list;
  }, [users, search, roleFilter, deptFilter, statusFilter, sortBy]);

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, roleFilter, deptFilter, statusFilter, sortBy, pageSize]);

  const roleBreakdown = useMemo(() => {
    const rb = { admin: 0, manager: 0, employee: 0 };
    users.forEach(u => { if (rb[u.role] !== undefined) rb[u.role]++; });
    return rb;
  }, [users]);

  // Helpers
  const getAvatarColor = (name) => {
    const initial = name.charAt(0).toUpperCase();
    if (initial >= 'A' && initial <= 'F') return 'avatar-blue';
    if (initial >= 'G' && initial <= 'L') return 'avatar-green';
    if (initial >= 'M' && initial <= 'R') return 'avatar-amber';
    return 'avatar-purple';
  };
  const getDeptClass = (dept) => {
    const d = (dept || '').toLowerCase();
    if (d.includes('eng')) return 'engineering';
    if (d.includes('design')) return 'design';
    if (d.includes('data')) return 'data';
    if (d.includes('manage')) return 'management';
    return 'management'; // default
  };
  
  const hasActiveFilters = search || roleFilter !== 'all' || deptFilter !== 'all' || statusFilter !== 'all' || sortBy !== 'newest';
  const clearFilters = () => {
    setSearch(''); setRoleFilter('all'); setDeptFilter('all'); setStatusFilter('all'); setSortBy('newest');
  };

  const handleToggleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(paginatedUsers.map(u => u._id));
    else setSelectedIds([]);
  };
  const handleToggleUser = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleAdd = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await adminAPI.createUser(form);
      setAddModal(false);
      setForm({ name: '', email: '', password: '', role: 'employee', department: 'Engineering', userId: '', mobileNumber: '', status: 'Active' });
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
      setSelectedIds(prev => prev.filter(id => id !== deleteModal._id));
      load();
    } catch {}
    finally { setSaving(false); }
  };

  const openEdit = (u) => {
    setEditForm({ name: u.name, email: u.email, role: u.role, department: u.department || 'Engineering', status: u.isActive ? 'Active' : 'Inactive' });
    setEditModal(u);
    setError('');
  };

  return (
    <>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700 }}>User Management</h1>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Manage team members, roles, and access permissions</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-outline" onClick={() => setImportModal(true)}>
            <Upload size={16} /> Import CSV
          </button>
          <button className="btn btn-outline">
            <Download size={16} /> Export CSV
          </button>
          <button className="btn btn-primary" style={{ padding: '10px 20px' }} onClick={() => { setAddModal(true); setError(''); }}>
            <UserPlus size={16} /> Add User
          </button>
        </div>
      </div>

      <div className="page page-enter admin-users-override">
        
        {/* Stats Row */}
        <div className="admin-stats-row">
          {[
            { label: 'Total Users', value: users.length, iconClass: 'blue', border: 'border-blue', trend: '+0 this month', trendColor: 'var(--text-muted)' },
            { label: 'Admins', value: roleBreakdown.admin, iconClass: 'purple', border: 'border-coral', sub: 'Full system access' },
            { label: 'Managers', value: roleBreakdown.manager, iconClass: 'amber', border: 'border-amber', sub: 'Team oversight access' },
            { label: 'Employees', value: roleBreakdown.employee, iconClass: 'green', border: 'border-green', sub: 'Standard access level' },
          ].map(({ label, value, iconClass, border, trend, trendColor, sub }) => (
            <div key={label} className={`admin-stat-card ${border}`}>
              <div className={`admin-stat-icon ${iconClass}`}><Users size={20} /></div>
              <div>
                <div className="admin-stat-label">{label}</div>
                <div className="admin-stat-value">{value}</div>
                {(trend || sub) && (
                  <div className="admin-stat-sub" style={trend ? { color: trendColor, marginTop: 6, fontWeight: 500 } : {}}>
                    {trend || sub}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div style={{ marginBottom: 20 }}>
          <div className="admin-filter-bar" style={{ marginBottom: 0 }}>
            <div className="admin-search-wrap">
              <Search size={16} />
              <input className="admin-search-input" placeholder="Search by name, email, or username…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="admin-filter-tabs">
              {['all', 'admin', 'manager', 'employee'].map(r => (
                <button key={r} className={`admin-filter-tab ${roleFilter === r ? 'active' : ''}`} onClick={() => setRoleFilter(r)}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="admin-filter-row-secondary">
            <select className="admin-filter-dropdown" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="all">All Departments</option>
              <option value="engineering">Engineering</option>
              <option value="design">Design</option>
              <option value="data">Data</option>
              <option value="management">Management</option>
            </select>
            <select className="admin-filter-dropdown" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
            <select className="admin-filter-dropdown" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="newest">Recently Added</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="role">Role</option>
            </select>
            {hasActiveFilters && (
              <button className="admin-clear-filters" onClick={clearFilters}>Clear Filters</button>
            )}
          </div>
        </div>

        {/* Table & Empty State */}
        {loading ? <LoadingSkeleton type="table" count={5} /> :
         filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
            <UserSearch size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 18, color: 'var(--text)', marginBottom: 8 }}>No users found</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Try adjusting your search or filter criteria</p>
            <button className="btn btn-outline" onClick={clearFilters}>Clear all filters</button>
          </div>
         ) : (
          <div className="admin-table-card" style={{ marginBottom: 16 }}>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40, paddingRight: 0 }}>
                      <input type="checkbox" checked={selectedIds.length === paginatedUsers.length && paginatedUsers.length > 0} onChange={handleToggleSelectAll} />
                    </th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map(u => (
                    <tr key={u._id}>
                      <td style={{ paddingRight: 0 }}>
                        <input type="checkbox" checked={selectedIds.includes(u._id)} onChange={() => handleToggleUser(u._id)} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className={`admin-user-avatar ${getAvatarColor(u.name)}`}>{u.name.charAt(0)}</div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text)' }}>{u.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{u.userId || u.email.split('@')[0]}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                      <td>
                        <span className="admin-badge-status" style={{ background: u.role === 'admin' ? 'rgba(239,68,68,0.1)' : u.role === 'manager' ? 'rgba(245,158,11,0.1)' : 'rgba(37,99,235,0.1)', color: u.role === 'admin' ? '#EF4444' : u.role === 'manager' ? '#F59E0B' : '#2563EB' }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text)', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span className={`dept-dot ${getDeptClass(u.department)}`} />
                          {u.department || '—'}
                        </div>
                      </td>
                      <td>
                        {u.isActive ? (
                          <span className="admin-badge-status active">
                            <div className="status-dot-pulse active" /> Active
                          </span>
                        ) : (
                          <span className="admin-badge-status inactive">
                            <div className="status-dot-pulse" style={{ background: '#64748B' }} /> Inactive
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="admin-action-btns">
                          <button className="admin-action-btn" title="View Details" onClick={() => setViewUser(u)}>
                            <Eye size={14} />
                          </button>
                          <button className="admin-action-btn" title="Edit User" onClick={() => openEdit(u)}>
                            <Pencil size={14} />
                          </button>
                          <button className="admin-action-btn danger" title="Delete User" onClick={() => setDeleteModal(u)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Showing {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} users
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', gap: 6, alignItems: 'center' }}>
                Show: 
                {[10, 25, 50].map(sz => (
                  <span key={sz} style={{ cursor: 'pointer', fontWeight: pageSize === sz ? 600 : 400, color: pageSize === sz ? 'var(--text)' : 'inherit' }} onClick={() => setPageSize(sz)}>
                    {sz}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)} style={{ padding: '6px 10px' }}>
                  <ChevronLeft size={16} /> Prev
                </button>
                <button className="btn btn-outline btn-sm" disabled={page * pageSize >= filtered.length} onClick={() => setPage(page + 1)} style={{ padding: '6px 10px' }}>
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions Bar */}
        <div className={`admin-bulk-bar ${selectedIds.length > 0 ? 'visible' : ''}`}>
          <div className="admin-bulk-bar-text">{selectedIds.length} user{selectedIds.length !== 1 ? 's' : ''} selected</div>
          <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 8px' }} />
          <button className="btn btn-ghost btn-sm">Change Role</button>
          <button className="btn btn-ghost btn-sm">Change Department</button>
          <button className="btn btn-ghost btn-sm">Deactivate Selected</button>
          <button className="btn btn-danger btn-sm">Delete Selected</button>
        </div>

      </div>

      {/* Add User Modal */}
      {addModal && (
        <div className="admin-modal-backdrop" onClick={() => setAddModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <button className="admin-drawer-close" onClick={() => setAddModal(false)}><X size={20} /></button>
            <h3>Add New User</h3>
            {error && <div style={{ color: '#EF4444', fontSize: '14px', marginBottom: '12px' }}>{error}</div>}
            <form className="modal-form" onSubmit={handleAdd}>
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input className="input" type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="input-group">
                  <label className="input-label">Username <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(Used for login. Lowercase)</span></label>
                  <input className="input" type="text" value={form.userId} onChange={e => setForm(p => ({ ...p, userId: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') }))} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Password</label>
                  <div className="password-input-wrapper">
                    <input className="input" type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                    <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Role</label>
                  <select className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Department</label>
                  <select className="input" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Data">Data</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Status</label>
                  <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: 24 }}>
                <button type="button" className="btn btn-outline" onClick={() => setAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModal && (
        <div className="admin-modal-backdrop" onClick={() => setEditModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <button className="admin-drawer-close" onClick={() => setEditModal(null)}><X size={20} /></button>
            <h3>Edit User</h3>
            {error && <div style={{ color: '#EF4444', fontSize: '14px', marginBottom: '12px' }}>{error}</div>}
            <form className="modal-form" onSubmit={handleEdit}>
              <div className="input-group">
                <label className="input-label">Name</label>
                <input className="input" type="text" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input className="input" type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Role</label>
                  <select className="input" value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Department</label>
                  <select className="input" value={editForm.department} onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))}>
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Data">Data</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Status</label>
                  <select className="input" value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>
              
              <div className="modal-actions" style={{ marginTop: 24 }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
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
            <h3 style={{ textAlign: 'center' }}>Are you sure you want to remove {deleteModal.name}?</h3>
            <p className="modal-sub" style={{ textAlign: 'center' }}>
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDeleteModal(null)}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={handleDelete} disabled={saving}>
                {saving ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View User Drawer */}
      {viewUser && (
        <div className="admin-drawer-backdrop admin-users-override" onClick={() => setViewUser(null)}>
          <div className="admin-drawer open" onClick={e => e.stopPropagation()}>
            <button className="admin-drawer-close" onClick={() => setViewUser(null)}><X size={20} /></button>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>User Details</h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
              <div className={`admin-user-avatar ${getAvatarColor(viewUser.name)}`} style={{ width: 64, height: 64, fontSize: 24 }}>
                {viewUser.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{viewUser.name}</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{viewUser.email}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Role</div>
                <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500, marginTop: 4 }}>{viewUser.role}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Department</div>
                <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500, marginTop: 4 }}>{viewUser.department || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</div>
                <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500, marginTop: 4 }}>{viewUser.isActive ? 'Active' : 'Inactive'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Join Date</div>
                <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500, marginTop: 4 }}>
                  {viewUser.createdAt ? new Date(viewUser.createdAt).toLocaleDateString() : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {importModal && (
        <div className="admin-modal-backdrop" onClick={() => setImportModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <button className="admin-drawer-close" onClick={() => setImportModal(false)}><X size={20} /></button>
            <h3>Import Users from CSV</h3>
            <p className="modal-sub">Upload a CSV file containing user details. Columns should include Name, Email, Username, Role, and Department.</p>
            
            <div style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '40px', textAlign: 'center', marginBottom: '24px', cursor: 'pointer', background: 'var(--surface-hover)' }}>
              <Upload size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>Click to browse or drag file here</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Supports .csv files up to 5MB</div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setImportModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Upload & Import</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
