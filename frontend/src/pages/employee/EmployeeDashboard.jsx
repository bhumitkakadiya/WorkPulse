import { useState, useEffect } from 'react';
import { employeeAPI } from '../../api/index.js';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, CheckSquare, Clock, HeartPulse, X } from 'lucide-react';
import PageHeader from '../../components/dashboard/PageHeader';
import StatCard from '../../components/dashboard/StatCard';
import AlertPanel from '../../components/dashboard/AlertPanel';
import '../../components/dashboard/dashboard-shared.css';

function todayStr() { return new Date().toISOString().slice(0, 10); }

export default function EmployeeDashboard() {
  const [date] = useState(todayStr());
  const [timeline, setTimeline] = useState(null);
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isPulseModalOpen, setIsPulseModalOpen] = useState(false);
  const [pulseData, setPulseData] = useState({ moodScore: 3, workloadScore: 3, blockerText: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [tlRes, scoreRes] = await Promise.all([
        employeeAPI.getTimeline(date),
        employeeAPI.getScore(7),
      ]);
      setTimeline(tlRes.data);
      setScoreData(scoreRes.data);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    load(); 
    // Basic auto-pop logic for Monday (0 = Sunday, 1 = Monday)
    if (new Date().getDay() === 1 && !localStorage.getItem('pulse_submitted_this_week')) {
      setIsPulseModalOpen(true);
    }
  }, [date]);

  const handlePulseSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/wellbeing/pulse-survey', pulseData);
      setIsPulseModalOpen(false);
      localStorage.setItem('pulse_submitted_this_week', 'true');
      alert('Thank you for your feedback!');
    } catch (err) {
      if (err.response?.data?.message === 'Already submitted this week') {
        localStorage.setItem('pulse_submitted_this_week', 'true');
        setIsPulseModalOpen(false);
        alert('You have already submitted this week.');
      } else {
        alert(err.response?.data?.message || 'Error submitting survey');
      }
    }
  };

  const latestScore = scoreData?.latest?.score || 0;
  const sessions = timeline?.sessions || [];
  
  // Calculate active time
  const activeSeconds = sessions
    .filter(s => s.type !== 'idle')
    .reduce((acc, s) => acc + (new Date(s.endTime || new Date()) - new Date(s.startTime)) / 1000, 0);
  const activeHours = Math.floor(activeSeconds / 3600);
  const activeMins = Math.floor((activeSeconds % 3600) / 60);
  const activeTimeStr = activeHours > 0 ? `${activeHours}h ${activeMins}m` : `${activeMins}m`;

  // Break reminder toast logic (simple check for 4 hours of continuous active sessions)
  // Since this is a demo, we'll just check if total active time > 4h and no idle > 30m
  const needsBreak = activeSeconds > 14400; // 4 hours

  const chartData = (scoreData?.snapshots || []).map(s => ({
    day: new Date(s.date).toLocaleDateString('en', { weekday: 'short' }),
    score: s.score
  })).reverse();

  return (
    <>
      <PageHeader breadcrumbs="Me / Dashboard" title="My Dashboard" />

      {needsBreak && (
        <div style={{ margin: '0 40px 20px', background: 'var(--warning)', color: '#000', padding: '12px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12, fontWeight: 500 }}>
          <HeartPulse size={20} />
          You've been working for over 4 hours. Remember to take a short break to recharge!
        </div>
      )}

      <div className="page page-enter">
        <div className="admin-stats-row">
          {[
            { label: "Today's Score", value: `${latestScore}%`, icon: TrendingUp, iconClass: 'purple' },
            { label: 'Active Time', value: activeTimeStr, icon: Activity, iconClass: 'green' },
            { label: 'Total Sessions', value: sessions.length, icon: Clock, iconClass: 'blue' },
            { label: 'Tasks Due', value: 0, icon: CheckSquare, iconClass: 'amber' }, // Stub for now
          ].map(stat => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          <div className="admin-chart-panel">
            <div className="admin-chart-title">My 7-Day Score Trend</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 13 }}
                  formatter={(v) => [`${v}%`, 'Score']}
                />
                <Line type="monotone" dataKey="score" stroke="var(--brand-primary)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--brand-primary)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="glass-panel card-3d">
              <h3 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <HeartPulse size={18} color="var(--danger)" />
                Your Wellbeing
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                How are you feeling this week? Let us know so we can ensure a healthy workload.
              </p>
              <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setIsPulseModalOpen(true)}>
                Take Weekly Pulse Survey
              </button>
            </div>
            
            <AlertPanel 
              title="My Alerts" 
              alerts={[]} 
              emptyMessage="You have no active alerts" 
            />
          </div>
        </div>
      </div>

      {isPulseModalOpen && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="modal-content" style={{ background: 'var(--surface)', padding: 24, borderRadius: 12, width: '100%', maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <HeartPulse size={20} color="var(--danger)" />
                Weekly Pulse Check
              </h2>
              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setIsPulseModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePulseSubmit}>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>1. How are you feeling this week?</label>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px' }}>
                  {[1, 2, 3, 4, 5].map(score => (
                    <button 
                      key={score} 
                      type="button"
                      onClick={() => setPulseData({...pulseData, moodScore: score})}
                      style={{ 
                        width: 40, height: 40, borderRadius: '50%', border: 'none', 
                        background: pulseData.moodScore === score ? 'var(--accent-primary)' : 'var(--surface-50)',
                        color: pulseData.moodScore === score ? '#fff' : 'var(--text)',
                        cursor: 'pointer', fontSize: 16, fontWeight: 600,
                        transition: '0.2s'
                      }}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                  <span>Poor</span><span>Excellent</span>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>2. How is your workload?</label>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px' }}>
                  {[1, 2, 3, 4, 5].map(score => (
                    <button 
                      key={score} 
                      type="button"
                      onClick={() => setPulseData({...pulseData, workloadScore: score})}
                      style={{ 
                        width: 40, height: 40, borderRadius: '50%', border: 'none', 
                        background: pulseData.workloadScore === score ? 'var(--warning)' : 'var(--surface-50)',
                        color: pulseData.workloadScore === score ? '#000' : 'var(--text)',
                        cursor: 'pointer', fontSize: 16, fontWeight: 600,
                        transition: '0.2s'
                      }}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                  <span>Too Light</span><span>Too Heavy</span>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>3. Any blockers? (Optional, anonymous)</label>
                <textarea 
                  className="form-control" 
                  value={pulseData.blockerText} 
                  onChange={e => setPulseData({...pulseData, blockerText: e.target.value})} 
                  placeholder="Is anything slowing you down?"
                  style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-50)', color: 'var(--text)', minHeight: 80, resize: 'vertical' }} 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Submit Weekly Pulse
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
