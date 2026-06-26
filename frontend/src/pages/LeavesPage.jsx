import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function LeavesPage() {
  const { user, effectivePermissions } = useAuth();
  const [activeTab, setActiveTab] = useState('my-requests'); // 'my-requests', 'team-requests'
  const [requests, setRequests] = useState([]);
  const [teamRequests, setTeamRequests] = useState([]);
  const [balance, setBalance] = useState({ balances: [] });
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ leaveTypeCode: 'SL', startDate: '', endDate: '', days: 1, reason: '' });

  const isManager = effectivePermissions?.includes('APPROVE_LEAVES') || user?.role === 'manager';

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'my-requests') {
        const [reqRes, balRes] = await Promise.all([
          axios.get('/api/leaves/my-requests'),
          axios.get('/api/leaves/my-balance')
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
    try {
      await axios.post('/api/leaves/request', formData);
      setIsModalOpen(false);
      setFormData({ leaveTypeCode: 'SL', startDate: '', endDate: '', days: 1, reason: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating request');
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

  if (loading) return <><div style={{ padding: 20 }}>Loading...</div></>;

  return (
    <>
      <div className="leaves-page" style={{ padding: '20px 40px', maxWidth: 1000, margin: '0 auto' }}>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1>Leave Management</h1>
            <div className="breadcrumbs">HR / Leaves</div>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Calendar size={16} /> Request Leave
          </button>
        </div>

        {isManager && (
          <div className="tabs" style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
            <button className={`tab ${activeTab === 'my-requests' ? 'active' : ''}`} onClick={() => setActiveTab('my-requests')} style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'my-requests' ? '2px solid var(--accent-primary)' : 'none', color: activeTab === 'my-requests' ? 'var(--text)' : 'var(--text-muted)', cursor: 'pointer' }}>My Requests</button>
            <button className={`tab ${activeTab === 'team-requests' ? 'active' : ''}`} onClick={() => setActiveTab('team-requests')} style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'team-requests' ? '2px solid var(--accent-primary)' : 'none', color: activeTab === 'team-requests' ? 'var(--text)' : 'var(--text-muted)', cursor: 'pointer' }}>Team Approvals</button>
          </div>
        )}

        {activeTab === 'my-requests' && (
          <div className="my-requests-view">
            <div className="balance-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              {/* Dummy balances since seeder doesn't create LeaveBalance yet */}
              {[ { code: 'SL', name: 'Sick Leave', remaining: 10 }, { code: 'CL', name: 'Casual Leave', remaining: 5 } ].map(b => (
                <div key={b.code} style={{ background: 'var(--surface-50)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{b.name}</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{b.remaining} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>days</span></div>
                </div>
              ))}
            </div>

            <div className="card">
              <h3>History</h3>
              {requests.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No leave requests found.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12 }}>
                      <th style={{ padding: 12 }}>Type</th>
                      <th style={{ padding: 12 }}>Dates</th>
                      <th style={{ padding: 12 }}>Days</th>
                      <th style={{ padding: 12 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(req => (
                      <tr key={req._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: 12 }}>{req.leaveTypeCode}</td>
                        <td style={{ padding: 12 }}>{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</td>
                        <td style={{ padding: 12 }}>{req.days}</td>
                        <td style={{ padding: 12 }}>{getStatusBadge(req.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'team-requests' && isManager && (
          <div className="team-requests-view">
            <div className="card">
              <h3>Pending Approvals</h3>
              {teamRequests.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No pending requests.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                  {teamRequests.map(req => (
                    <div key={req._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-50)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{req.userId?.name} <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 'normal' }}>({req.leaveTypeCode})</span></div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                          {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()} • {req.days} days
                        </div>
                        <div style={{ fontSize: 13, marginTop: 4 }}>Reason: {req.reason}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary" style={{ background: 'var(--success)' }} onClick={() => handleAction(req._id, 'approve')}>Approve</button>
                        <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => handleAction(req._id, 'reject')}>Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {isModalOpen && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 12, width: '100%', maxWidth: 400 }}>
            <h2>Request Leave</h2>
            <form onSubmit={handleCreateRequest}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8 }}>Leave Type</label>
                <select className="input" value={formData.leaveTypeCode} onChange={e => setFormData({...formData, leaveTypeCode: e.target.value})}>
                  <option value="SL">Sick Leave</option>
                  <option value="CL">Casual Leave</option>
                  <option value="EL">Earned Leave</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>Start Date</label>
                  <input type="date" className="input" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>End Date</label>
                  <input type="date" className="input" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} required />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8 }}>Number of Days</label>
                <input type="number" className="input" value={formData.days} onChange={e => setFormData({...formData, days: e.target.value})} required min="0.5" step="0.5" />
              </div>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8 }}>Reason</label>
                <textarea className="input" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} required style={{ minHeight: 80 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
