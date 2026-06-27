import React, { useState, useEffect } from 'react';
import { managerAPI } from '../../api/index.js';
import PageHeader from '../../components/dashboard/PageHeader';
import Drawer from '../../components/Drawer';
import EmptyState from '../../components/EmptyState';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import './TeamActivity.css';

function getScoreColor(score) {
  if (score === null || score === undefined) return 'transparent';
  if (score >= 80) return 'var(--success)';
  if (score >= 60) return '#4ade80'; // lighter green
  if (score >= 40) return 'var(--warning)';
  if (score >= 20) return 'var(--danger)';
  return 'var(--text-muted)'; // 0-19 gray/idle
}

function formatHour(h) {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

export default function TeamActivity() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('all');
  const [drawerCell, setDrawerCell] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await managerAPI.getTeamActivity(date);
      setData(res.data.activityData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [date]);

  const addDays = (days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().slice(0, 10));
  };
  
  const todayStr = new Date().toISOString().slice(0, 10);
  const hoursToShow = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM (13 hours)

  const filteredData = selectedUser === 'all' ? data : data.filter(d => d.user._id === selectedUser);

  // Calc column averages
  const colAverages = {};
  hoursToShow.forEach(h => {
    const validScores = filteredData.map(d => d.hours[h]?.score).filter(s => s !== null && s !== undefined);
    colAverages[h] = validScores.length ? Math.round(validScores.reduce((a,b)=>a+b,0)/validScores.length) : null;
  });

  return (
    <>
      <PageHeader breadcrumbs="Team / Activity" title="Team Activity" subtitle="Hour-by-hour breakdown of team activity for the selected date" />

      <div className="page page-enter">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-outline btn-icon" onClick={() => addDays(-1)}><ChevronLeft size={16} /></button>
            <input type="date" className="input-field" value={date} max={todayStr} onChange={e => setDate(e.target.value)} style={{ margin: 0, padding: '8px 12px' }} />
            <button className="btn btn-outline btn-icon" onClick={() => addDays(1)} disabled={date >= todayStr}><ChevronRight size={16} /></button>
          </div>
          <select className="input-field" value={selectedUser} onChange={e => setSelectedUser(e.target.value)} style={{ width: 200, margin: 0 }}>
            <option value="all">All Employees</option>
            {data.map(d => (
              <option key={d.user._id} value={d.user._id}>{d.user.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <LoadingSkeleton type="table" count={5} />
        ) : filteredData.length === 0 ? (
          <div className="glass-panel"><EmptyState icon={Activity} title="No activity data" description="No activity data found for the selected date." /></div>
        ) : (
          <div className="glass-panel" style={{ padding: '24px 0', overflowX: 'auto' }}>
            <table className="team-activity-table">
              <thead>
                <tr>
                  <th className="sticky-col">Employee</th>
                  {hoursToShow.map(h => <th key={h}>{formatHour(h)}</th>)}
                  <th style={{ textAlign: 'right', paddingRight: 24 }}>Prod. Hours</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(row => (
                  <tr key={row.user._id}>
                    <td className="sticky-col">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="user-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{row.user.name.charAt(0)}</div>
                        <span style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap' }}>{row.user.name.split(' ')[0]}</span>
                      </div>
                    </td>
                    {hoursToShow.map(h => {
                      const hourData = row.hours[h] || { score: null, apps: [] };
                      const color = getScoreColor(hourData.score);
                      const hasData = hourData.apps.length > 0;
                      return (
                        <td key={h} style={{ padding: '4px' }}>
                          <div 
                            className="activity-cell group" 
                            style={{ background: color, cursor: hasData ? 'pointer' : 'default' }}
                            onClick={() => hasData && setDrawerCell({ user: row.user, hour: h, data: hourData })}
                          >
                            {hasData && (
                              <div className="activity-tooltip">
                                <div style={{ fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 4, marginBottom: 4 }}>
                                  {formatHour(h)} - {formatHour(h+1)}
                                </div>
                                <div style={{ fontSize: 12, marginBottom: 6 }}>Score: {hourData.score}%</div>
                                {hourData.apps.slice(0, 3).map((a, i) => (
                                  <div key={i} style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>{a.name}</span>
                                    <span>{Math.round(a.duration / 60)}m</span>
                                  </div>
                                ))}
                                {hourData.apps.length > 3 && <div style={{ fontSize: 10, marginTop: 4, opacity: 0.8 }}>+ {hourData.apps.length - 3} more apps</div>}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'right', paddingRight: 24, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {row.totalProductiveHours}h
                    </td>
                  </tr>
                ))}
                {/* Column Averages */}
                <tr style={{ background: 'var(--bg-page)', borderTop: '2px solid var(--border)' }}>
                  <td className="sticky-col" style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-muted)' }}>Avg Score</td>
                  {hoursToShow.map(h => (
                    <td key={h} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                      {colAverages[h] !== null ? colAverages[h] : '-'}
                    </td>
                  ))}
                  <td></td>
                </tr>
              </tbody>
            </table>
            
            <div className="activity-legend">
              <div className="legend-item"><div className="legend-color" style={{ background: 'var(--success)' }} /> Highly Productive (80-100)</div>
              <div className="legend-item"><div className="legend-color" style={{ background: '#4ade80' }} /> Productive (60-79)</div>
              <div className="legend-item"><div className="legend-color" style={{ background: 'var(--warning)' }} /> Mixed (40-59)</div>
              <div className="legend-item"><div className="legend-color" style={{ background: 'var(--danger)' }} /> Distracted (20-39)</div>
              <div className="legend-item"><div className="legend-color" style={{ background: 'var(--text-muted)' }} /> Idle (0-19)</div>
              <div className="legend-item"><div className="legend-color" style={{ background: 'transparent', border: '1px solid var(--border)' }} /> No Activity</div>
            </div>
          </div>
        )}
      </div>

      <Drawer isOpen={!!drawerCell} onClose={() => setDrawerCell(null)} title={`Activity for ${drawerCell?.user?.name}`} width={400}>
        {drawerCell && (
          <div>
            <div style={{ marginBottom: 24, padding: '12px 16px', background: 'var(--bg-page)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{formatHour(drawerCell.hour)} - {formatHour(drawerCell.hour + 1)}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: getScoreColor(drawerCell.data.score), marginTop: 8 }}>{drawerCell.data.score}% Score</div>
            </div>
            
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-muted)' }}>Apps & Websites Used</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {drawerCell.data.apps.map((app, i) => {
                const isProd = app.category === 'productive';
                const isDist = app.category === 'distracting';
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', borderLeft: `3px solid ${isProd ? 'var(--success)' : isDist ? 'var(--danger)' : 'var(--accent-primary)'}` }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{app.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{Math.floor(app.duration / 60)}m {app.duration % 60}s</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
