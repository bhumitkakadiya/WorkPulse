import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Calendar, Clock, CheckCircle, XCircle, Plus } from 'lucide-react';

export default function LeavesPage() {
  const { user, effectivePermissions } = useAuth();
  const [activeTab, setActiveTab] = useState('my-requests');
  const [requests, setRequests] = useState([]);
  const [teamRequests, setTeamRequests] = useState([]);
  const [balance, setBalance] = useState({ balances: [] });
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ leaveTypeCode: 'SL', startDate: '', endDate: '', days: 1, reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const isManager = effectivePermissions?.includes('APPROVE_LEAVES') || user?.role === 'manager' || user?.role === 'admin';

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Auto-calculate days when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end >= start) {
        let count = 0;
        const cur = new Date(start);
        while (cur <= end) {
          const day = cur.getDay();
          if (day !== 0 && day !== 6) count++; // Skip weekends
          cur.setDate(cur.getDate() + 1);
        }
        setFormData(prev => ({ ...prev, days: count || 1 }));
      }
    }
  }, [formData.startDate, formData.endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'my-requests') {
        const [reqRes, balRes] = await Promise.all([
          axios.get('/api/leaves/my-requests'),
          axios.get('/api/leaves/my-balance').catch(() => ({ data: { balance: { balances: [] } } }))
        ]);
        setRequests(reqRes.data.requests || []);
        setBalance(balRes.data.balance || { balances: [] });
      } else if (activeTab === 'team-requests' && isManager) {
        const res = await axios.get('/api/leaves/team-requests');
        setTeamRequests(res.data.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.startDate || !formData.endDate) {
      setFormError('Please select both start and end dates');
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setFormError('End date must be after start date');
      return;
    }
    if (!formData.reason.trim()) {
      setFormError('Please provide a reason for leave');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post('/api/leaves/request', formData);
      setIsModalOpen(false);
      setFormData({ leaveTypeCode: 'SL', startDate: '', endDate: '', days: 1, reason: '' });
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error creating request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      await axios.put(`/api/leaves/${id}/${action}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || `Error ${action} request`);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="badge badge-success"><CheckCircle size={12} /> Approved</span>;
      case 'rejected': return <span className="badge badge-danger"><XCircle size={12} /> Rejected</span>;
      default: return <span className="badge badge-warning"><Clock size={12} /> Pending</span>;
    }
  };

  const getLeaveTypeBadge = (code) => {
    switch (code) {
      case 'AL': return <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>Annual</span>;
      case 'SL': return <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>Sick</span>;
      case 'PL': return <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>Personal</span>;
      case 'EL': return <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>Emergency</span>;
      default: return <span className="badge badge-neutral">{code}</span>;
    }
  };

  const displayBalances = balance?.balances || [];

  if (loading) return <><div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading leave data...</div></>;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="breadcrumbs">HR / Leaves</div>
          <h1>Leave Management</h1>
        </div>
        <button className="btn btn-primary" onClick={() => { setFormError(''); setIsModalOpen(true); }}>
          <Plus size={16} /> Request Leave
        </button>
      </div>

      <div className="page page-enter" style={{ maxWidth: 1000 }}>
        {isManager && (
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
            <button
              className={`tab-btn ${activeTab === 'my-requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-requests')}
              style={{ borderRadius: 0 }}
            >
              My Requests
            </button>
            <button
              className={`tab-btn ${activeTab === 'team-requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('team-requests')}
              style={{ borderRadius: 0 }}
            >
              Team Approvals
            </button>
          </div>
        )}

        {activeTab === 'my-requests' && (
          <div>
            {/* Balance Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
              {displayBalances.map(b => (
                <div key={b.code} className="glass-panel card-3d" style={{ padding: 20 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{b.name}</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent-primary)' }}>
                    {b.remaining}
                    <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>days</span>
                  </div>
                  {b.total && (
                    <div style={{ marginTop: 8, height: 4, background: 'var(--border)', borderRadius: 2 }}>
                      <div style={{ width: `${Math.min(100, (b.remaining / b.total) * 100)}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: 2 }} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Request History */}
            <div className="glass-panel">
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Leave History</h3>
              </div>
              {requests.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Calendar size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p>No leave requests found.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Date Range</th>
                        <th>Days</th>
                        <th>Reason</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map(req => (
                        <tr key={req._id} className="table-row-hover">
                          <td>
                            {getLeaveTypeBadge(req.leaveTypeCode)}
                          </td>
                          <td style={{ fontSize: 13 }}>
                            {new Date(req.startDate).toLocaleDateString()} — {new Date(req.endDate).toLocaleDateString()}
                          </td>
                          <td style={{ fontWeight: 600 }}>{req.days}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 200 }}>
                            {req.reason || '—'}
                          </td>
                          <td>{getStatusBadge(req.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'team-requests' && isManager && (
          <div className="glass-panel">
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Pending Team Approvals</h3>
            </div>
            {teamRequests.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <CheckCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p>No pending requests. All caught up!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {teamRequests.map(req => (
                  <div key={req._id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 24px', borderBottom: '1px solid var(--border)'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 13 }}>
                          {req.userId?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <span style={{ fontWeight: 600 }}>{req.userId?.name}</span>
                          <span style={{ marginLeft: 8 }}>{getLeaveTypeBadge(req.leaveTypeCode)}</span>
                        </div>
                        {getStatusBadge(req.status)}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 42 }}>
                        {new Date(req.startDate).toLocaleDateString()} → {new Date(req.endDate).toLocaleDateString()} • <strong>{req.days} days</strong>
                      </div>
                      {req.reason && (
                        <div style={{ fontSize: 13, marginLeft: 42, marginTop: 4 }}>
                          <em>"{req.reason}"</em>
                        </div>
                      )}
                    </div>
                    {req.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8, marginLeft: 24 }}>
                        <button
                          id={`approve-leave-${req._id}`}
                          className="btn btn-primary btn-sm"
                          style={{ background: 'var(--success)', borderColor: 'var(--success)' }}
                          onClick={() => handleAction(req._id, 'approve')}
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button
                          id={`reject-leave-${req._id}`}
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                          onClick={() => handleAction(req._id, 'reject')}
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Request Leave Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={20} color="var(--accent-primary)" /> Request Leave
              </h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            {formError && (
              <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateRequest} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">Leave Type</label>
                <select className="input" value={formData.leaveTypeCode} onChange={e => setFormData({ ...formData, leaveTypeCode: e.target.value })}>
                  <option value="SL">Sick Leave</option>
                  <option value="CL">Casual Leave</option>
                  <option value="EL">Earned Leave</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Start Date</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    min={new Date().toISOString().slice(0, 10)}
                    required
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">End Date</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    min={formData.startDate || new Date().toISOString().slice(0, 10)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Working Days <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(auto-calculated)</span></label>
                <input
                  type="number"
                  className="input"
                  value={formData.days}
                  onChange={e => setFormData({ ...formData, days: Math.max(0.5, parseFloat(e.target.value) || 1) })}
                  min="0.5"
                  step="0.5"
                  style={{ background: 'var(--bg-input)' }}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Reason <span style={{ color: 'var(--danger)' }}>*</span></label>
                <textarea
                  className="input"
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  required
                  style={{ minHeight: 80, resize: 'vertical' }}
                  placeholder="Please provide a reason for your leave request..."
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
