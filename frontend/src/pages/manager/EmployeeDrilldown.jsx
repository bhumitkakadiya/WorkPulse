import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { managerAPI } from '../../api/index.js';
import HeaderActions from '../../components/HeaderActions';
import ActivityTimeline from '../../components/ActivityTimeline';
import AppUsageChart from '../../components/AppUsageChart';
import ProductivityScoreCard from '../../components/ProductivityScoreCard';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

function todayStr() { return new Date().toISOString().slice(0, 10); }
function addDays(dateStr, n) {
  const d = new Date(dateStr); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function EmployeeDrilldown() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [date, setDate] = useState(todayStr());
  const [data, setData] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [tlRes, scoreRes] = await Promise.all([
        managerAPI.getTimeline(id, date),
        managerAPI.getScore(id, 14),
      ]);
      setData(tlRes.data);
      setScoreHistory(scoreRes.data.snapshots || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id, date]);

  const today = data;
  const prevSnapshot = scoreHistory[scoreHistory.length - 2];
  const currentSnapshot = scoreHistory[scoreHistory.length - 1];

  return (
    <>
        <div className="page-header">
          <div>
            <div className="breadcrumbs">Team / {data?.user?.name || 'Timeline'}</div>
            <h1>{data?.user?.name || 'Employee Timeline'}</h1>
          </div>
          <HeaderActions />
        </div>
        <div className="page page-enter">
          {/* Back + date nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/manager')}>
              <ArrowLeft size={16} /> Back to Team
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDate(d => addDays(d, -1))}>
                <ChevronLeft size={18} />
              </button>
              <input
                id="date-picker"
                type="date"
                className="input"
                value={date}
                max={todayStr()}
                onChange={e => setDate(e.target.value)}
                style={{ width: 150, padding: '8px 12px' }}
              />
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDate(d => addDays(d, 1))} disabled={date >= todayStr()}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div className="data-grid">
              {/* Timeline */}
              <div className="glass-panel" style={{ gridColumn: 'span 2' }}>
                <div className="section-title" style={{ marginBottom: 16 }}>Activity Timeline — {date}</div>
                <ActivityTimeline sessions={data?.sessions || []} />
              </div>

              {/* Score card */}
              <div className="glass-panel card-3d">
                <div className="section-title" style={{ marginBottom: 16 }}>Today's Productivity Score</div>
                <ProductivityScoreCard snapshot={currentSnapshot} prevScore={prevSnapshot?.score} />
              </div>

              {/* App usage */}
              <div className="glass-panel">
                <div className="section-title" style={{ marginBottom: 16 }}>App Usage — {date}</div>
                <AppUsageChart appUsage={data?.appUsage || []} />
              </div>

              {/* 14-day score trend */}
              <div className="glass-panel" style={{ gridColumn: 'span 2' }}>
                <div className="section-title" style={{ marginBottom: 16 }}>14-Day Score History</div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={scoreHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                    <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                    <Line dataKey="score" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3, fill: '#3B82F6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </>
  );
}
