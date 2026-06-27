import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { Shield, Plus, Edit2, Trash2, GripVertical, X, Users, List, GitMerge, Search, UserPlus } from 'lucide-react';
import PageHeader from '../../components/dashboard/PageHeader';
import '../../components/dashboard/dashboard-shared.css';

const PERMISSION_GROUPS = {
  'Data & Analytics': ['VIEW_OWN_DATA', 'VIEW_TEAM_DATA', 'VIEW_ORG_DATA', 'VIEW_ANALYTICS', 'VIEW_TEAM_ANALYTICS', 'VIEW_ORG_ANALYTICS', 'EXPORT_REPORTS'],
  'Tasks': ['ASSIGN_TASKS', 'CREATE_TASKS', 'EDIT_TASKS', 'DELETE_TASKS', 'APPROVE_TASKS'],
  'Management': ['MANAGE_USERS', 'MANAGE_ROLES', 'MANAGE_SETTINGS', 'MANAGE_APP_CATEGORIES'],
  'Leaves': ['REQUEST_LEAVES', 'APPROVE_LEAVES'],
  'Alerts & Wellbeing': ['VIEW_ALERTS', 'MANAGE_ALERTS']
};

export default function AdminRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'tree'
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ name: '', parentRoleId: '', color: '#6B7280', permissions: [] });

  const [assignModal, setAssignModal] = useState(false);
  const [assignRole, setAssignRole] = useState(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await axios.get('/api/roles');
      setRoles(res.data.roles || []);
    } catch (err) {
      console.error(err);
      // Fallback mock data if API fails
      setRoles([
        { _id: '1', name: 'Super Admin', isSystem: true, color: '#EF4444', level: 0, permissions: ['ALL'], members: 2 },
        { _id: '2', name: 'Manager', isSystem: true, color: '#F59E0B', level: 1, parentRoleId: '1', permissions: ['VIEW_TEAM_DATA'], members: 14 },
        { _id: '3', name: 'Employee', isSystem: true, color: '#2563EB', level: 2, parentRoleId: '2', permissions: ['VIEW_OWN_DATA'], members: 156 },
        { _id: '4', name: 'HR Admin', isSystem: false, color: '#8B5CF6', level: 1, parentRoleId: '1', permissions: ['MANAGE_USERS', 'VIEW_ORG_DATA'], members: 3 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        parentRoleId: role.parentRoleId || '',
        color: role.color || '#6B7280',
        permissions: role.permissions || []
      });
    } else {
      setEditingRole(null);
      setFormData({ name: '', parentRoleId: '', color: '#6B7280', permissions: [] });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
  };

  const handlePermissionToggle = (perm) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await axios.put(`/api/roles/${editingRole._id}`, formData);
      } else {
        await axios.post('/api/roles', formData);
      }
      handleCloseModal();
      fetchRoles();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving role');
    }
  };

  const handleDelete = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
      await axios.delete(`/api/roles/${roleId}`);
      fetchRoles();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting role');
    }
  };

  const handleOpenAssign = (role) => {
    setAssignRole(role);
    setAssignModal(true);
  };

  return (
    <>
      <PageHeader breadcrumbs="Admin / Roles" title="Roles & Permissions" />

      <div className="page page-enter admin-dashboard-override">
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 8, background: 'var(--border)', padding: 4, borderRadius: 8 }}>
            <button 
              onClick={() => setViewMode('table')}
              style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 6, border: 'none', cursor: 'pointer', background: viewMode === 'table' ? 'var(--surface)' : 'transparent', color: viewMode === 'table' ? 'var(--text)' : 'var(--text-muted)', boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', fontWeight: 500 }}
            >
              <List size={16} /> Table View
            </button>
            <button 
              onClick={() => setViewMode('tree')}
              style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 6, border: 'none', cursor: 'pointer', background: viewMode === 'tree' ? 'var(--surface)' : 'transparent', color: viewMode === 'tree' ? 'var(--text)' : 'var(--text-muted)', boxShadow: viewMode === 'tree' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', fontWeight: 500 }}
            >
              <GitMerge size={16} /> Hierarchy
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} /> Add Custom Role
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 20 }}>Loading roles...</div>
        ) : (
          viewMode === 'table' ? (
            <div className="admin-table-card">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Role Name</th>
                      <th>Level</th>
                      <th>Permissions</th>
                      <th>Members</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map(role => (
                      <tr key={role._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: role.color || '#6B7280' }} />
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                {role.name}
                                {role.isSystem && <span style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(245,158,11,0.1)', color: '#F59E0B', borderRadius: 4, textTransform: 'uppercase', fontWeight: 700 }}>System</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>Level {role.level || 0}</td>
                        <td style={{ color: 'var(--text)' }}>{role.permissions?.length || 0} granted</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                            <Users size={14} /> {role.members || Math.floor(Math.random() * 50)}
                          </div>
                        </td>
                        <td>
                          <div className="admin-action-btns">
                            <button className="admin-action-btn" title="Assign Users" onClick={() => handleOpenAssign(role)}>
                              <UserPlus size={14} />
                            </button>
                            <button className="admin-action-btn" title="Edit Role" onClick={() => handleOpenModal(role)}>
                              <Edit2 size={14} />
                            </button>
                            {!role.isSystem && (
                              <button className="admin-action-btn danger" title="Delete Role" onClick={() => handleDelete(role._id)}>
                                <Trash2 size={14} />
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
          ) : (
            <div className="roles-tree">
              {roles.map(role => (
                <div key={role._id} className="role-node" style={{
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16, marginLeft: (role.level || 0) * 40
                }}>
                  <GripVertical size={16} color="var(--text-muted)" />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: role.color || '#6B7280' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {role.name}
                      {role.isSystem && <span style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(245,158,11,0.1)', color: '#F59E0B', borderRadius: 4, textTransform: 'uppercase', fontWeight: 700 }}>System</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      {role.permissions?.length || 0} Permissions · {role.members || 0} Members
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost" style={{ padding: 8 }} onClick={() => handleOpenAssign(role)} title="Assign Users">
                      <UserPlus size={16} />
                    </button>
                    <button className="btn btn-ghost" style={{ padding: 8 }} onClick={() => handleOpenModal(role)} title="Edit Role">
                      <Edit2 size={16} />
                    </button>
                    {!role.isSystem && (
                      <button className="btn btn-ghost" style={{ padding: 8, color: '#EF4444' }} onClick={() => handleDelete(role._id)} title="Delete Role">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {isModalOpen && (
        <div className="admin-modal-backdrop" onClick={handleCloseModal}>
          <div className="admin-modal" style={{ maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>{editingRole ? 'Edit Role' : 'Add Custom Role'}</h3>
              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={handleCloseModal}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Role Name</label>
                <input 
                  type="text" 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                  disabled={editingRole?.isSystem}
                />
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Parent Role</label>
                  <select 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                    value={formData.parentRoleId}
                    onChange={e => setFormData({...formData, parentRoleId: e.target.value})}
                    disabled={editingRole?.isSystem}
                  >
                    <option value="">None (Top Level)</option>
                    {roles.filter(r => r._id !== editingRole?._id).map(r => (
                      <option key={r._id} value={r._id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ width: 100 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Color</label>
                  <input 
                    type="color" 
                    value={formData.color} 
                    onChange={e => setFormData({...formData, color: e.target.value})} 
                    style={{ width: '100%', height: 42, padding: 0, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 12, fontSize: 14, fontWeight: 500 }}>Permissions</label>
                {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
                  <div key={group} style={{ marginBottom: 16, background: 'rgba(0,0,0,0.02)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14, color: 'var(--text)' }}>{group}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {perms.map(perm => (
                        <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--text-muted)' }}>
                          <input 
                            type="checkbox" 
                            checked={formData.permissions.includes(perm)}
                            onChange={() => handlePermissionToggle(perm)}
                            style={{ accentColor: '#2563EB', width: 16, height: 16 }}
                          />
                          {perm.replace(/_/g, ' ')}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Role</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Users Modal */}
      {assignModal && (
        <div className="admin-modal-backdrop" onClick={() => setAssignModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Assign Users to {assignRole?.name}</h3>
              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setAssignModal(false)}><X size={20} /></button>
            </div>
            <p className="modal-sub">Search and select users to apply this role to.</p>
            
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" placeholder="Search users by name or email..." style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-alt)' }} />
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: 8, maxHeight: 200, overflowY: 'auto', marginBottom: 24 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  <input type="checkbox" />
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#2563EB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>U{i}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>User Name {i}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>user{i}@example.com</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setAssignModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Apply Role</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
