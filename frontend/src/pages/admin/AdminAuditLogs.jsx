import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Filter, Clock, User, HardDrive, RefreshCw } from 'lucide-react';
import PageHeader from '../../components/dashboard/PageHeader';

export default function AdminAuditLogs() {
  const { effectivePermissions } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [expandedLogId, setExpandedLogId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/audit-logs', {
        params: {
          action: actionFilter || undefined,
          targetResource: resourceFilter || undefined,
          page,
          limit: 20
        }
      });
      setLogs(res.data.logs || []);
      setTotalPages(res.data.pages || 1);
      setTotalRecords(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [actionFilter, resourceFilter, page]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return 'var(--success)';
      case 'UPDATE': return 'var(--warning)';
      case 'DELETE': return 'var(--danger)';
      default: return 'var(--accent-primary)';
    }
  };

  if (!effectivePermissions.includes('MANAGE_SYSTEM_SETTINGS') && !effectivePermissions.includes('MANAGE_USERS')) {
    return (
      <>
        <div style={{ padding: 40, textAlign: 'center' }}>You do not have permission to view audit logs.</div>
      </>
    );
  }

  return (
    <>
      <PageHeader breadcrumbs="Admin / System" title="Audit Logs" />

      <div className="page page-enter">
        <div className="glass-panel" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', gap: 16, flex: 1 }}>
              <div style={{ flex: 1, maxWidth: 200 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Action</label>
                <select className="form-control" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }} style={{ width: '100%' }}>
                  <option value="">All Actions</option>
                  <option value="CREATE">CREATE</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                  <option value="LOGIN">LOGIN</option>
                </select>
              </div>
              <div style={{ flex: 1, maxWidth: 200 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Resource</label>
                <select className="form-control" value={resourceFilter} onChange={e => { setResourceFilter(e.target.value); setPage(1); }} style={{ width: '100%' }}>
                  <option value="">All Resources</option>
                  <option value="Role">Role</option>
                  <option value="User">User</option>
                  <option value="Task">Task</option>
                  <option value="Goal">Goal</option>
                </select>
              </div>
            </div>
            
            <button className="btn btn-outline" onClick={load} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin-icon' : ''} /> Refresh
            </button>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16 }}>Log Entries ({totalRecords})</h3>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--surface-50)' }}>
                <tr>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)' }}>Timestamp</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)' }}>Action</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)' }}>Resource</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)' }}>Performed By</th>
                  <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {loading && logs.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No audit logs found.</td></tr>
                ) : (
                  logs.map(log => (
                    <React.Fragment key={log._id}>
                      <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} color="var(--text-muted)" /> {new Date(log.createdAt).toLocaleString()}</div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 4, background: getActionColor(log.action) + '20', color: getActionColor(log.action) }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: 13 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><HardDrive size={14} color="var(--text-muted)" /> {log.targetResource || 'System'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{log.resourceId}</div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="user-avatar" style={{ width: 24, height: 24, fontSize: 10 }}>{log.performedBy?.name?.charAt(0) || '?'}</div>
                            <span style={{ fontSize: 13 }}>{log.performedBy?.name || 'Unknown User'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            onClick={() => setExpandedLogId(expandedLogId === log._id ? null : log._id)}
                          >
                            {expandedLogId === log._id ? 'Hide Details' : 'View JSON'}
                          </button>
                        </td>
                      </tr>
                      {expandedLogId === log._id && (
                        <tr style={{ background: 'var(--surface-50)' }}>
                          <td colSpan="5" style={{ padding: '16px 24px' }}>
                            <div style={{ display: 'flex', gap: 24 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>Payload Details</div>
                                <pre style={{ background: 'var(--bg-page)', padding: 12, borderRadius: 6, fontSize: 12, overflowX: 'auto', border: '1px solid var(--border)' }}>
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </div>
                              <div style={{ width: 300 }}>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>Metadata</div>
                                <div style={{ fontSize: 12, marginBottom: 8 }}><strong>IP Address:</strong> {log.ipAddress || 'N/A'}</div>
                                <div style={{ fontSize: 12 }}><strong>User Agent:</strong> {log.userAgent || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Showing page {page} of {totalPages}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => handlePageChange(page - 1)}>Previous</button>
              <button className="btn btn-outline btn-sm" disabled={page === totalPages} onClick={() => handlePageChange(page + 1)}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
