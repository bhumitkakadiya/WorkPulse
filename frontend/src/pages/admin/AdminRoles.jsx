import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { Shield, Plus, Edit2, Trash2, GripVertical, X } from 'lucide-react';

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
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ name: '', parentRoleId: '', color: '#6B7280', permissions: [] });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await axios.get('/api/roles');
      setRoles(res.data.roles);
    } catch (err) {
      console.error(err);
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

  if (loading) return <><div style={{ padding: 20 }}>Loading roles...</div></>;

  return (
    <>
      <div className="admin-roles-page" style={{ padding: '20px 40px', maxWidth: 1000, margin: '0 auto' }}>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1>Roles & Permissions</h1>
            <div className="breadcrumbs">Admin / Roles</div>
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} /> Add Custom Role
          </button>
        </div>

        <div className="roles-tree">
          {roles.map(role => (
            <div key={role._id} className="role-node" style={{
              background: 'var(--surface-50)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16, marginLeft: role.level * 40
            }}>
              <GripVertical size={16} color="var(--text-muted)" />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: role.color }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {role.name}
                  {role.isSystem && <span className="badge badge-warning" style={{ fontSize: 10 }}>System Role</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {role.permissions?.length || 0} Permissions
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" style={{ padding: 8 }} onClick={() => handleOpenModal(role)}>
                  <Edit2 size={16} />
                </button>
                {!role.isSystem && (
                  <button className="btn btn-ghost" style={{ padding: 8, color: 'var(--danger)' }} onClick={() => handleDelete(role._id)}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-backdrop" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="modal-content" style={{
            background: 'var(--bg-secondary)', padding: 24, borderRadius: 12, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ margin: 0 }}>{editingRole ? 'Edit Role' : 'Add Custom Role'}</h2>
              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={handleCloseModal}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>Role Name</label>
                <input 
                  type="text" 
                  className="input" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                  disabled={editingRole?.isSystem}
                />
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>Parent Role</label>
                  <select 
                    className="input"
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
                <div className="form-group" style={{ width: 100 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>Color</label>
                  <input 
                    type="color" 
                    value={formData.color} 
                    onChange={e => setFormData({...formData, color: e.target.value})} 
                    style={{ width: '100%', height: 46, padding: 0, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 12, fontSize: 14 }}>Permissions</label>
                {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
                  <div key={group} style={{ marginBottom: 16, background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14, color: 'var(--text)' }}>{group}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {perms.map(perm => (
                        <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--text-muted)' }}>
                          <input 
                            type="checkbox" 
                            checked={formData.permissions.includes(perm)}
                            onChange={() => handlePermissionToggle(perm)}
                            style={{ accentColor: 'var(--accent-primary)', width: 16, height: 16 }}
                          />
                          {perm.replace(/_/g, ' ')}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Role</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
