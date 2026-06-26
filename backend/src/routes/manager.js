const express = require('express');
const router = express.Router();
const { protect, hasPermission } = require('../middleware/auth');
const PERMISSIONS = require('../constants/permissions');
const User = require('../models/User');
const ActivitySession = require('../models/ActivitySession');
const AppUsageLog = require('../models/AppUsageLog');
const Screenshot = require('../models/Screenshot');
const ProductivityScoreSnapshot = require('../models/ProductivityScoreSnapshot');
const Alert = require('../models/Alert');

router.use(protect, hasPermission(PERMISSIONS.VIEW_TEAM_DATA));

// @route  GET /api/manager/team
// Returns all team members with live status and today's score
router.get('/team', async (req, res) => {
  const query = req.user.role === 'admin'
    ? { isActive: true, role: { $ne: 'admin' } }
    : { isActive: true, managerId: req.user.id };

  const members = await User.find(query).select('-password');
  const today = new Date().toISOString().slice(0, 10);
  const ids = members.map(m => m._id);
  const scores = await ProductivityScoreSnapshot.find({ userId: { $in: ids }, date: today });
  const scoreMap = {};
  scores.forEach(s => { scoreMap[s.userId.toString()] = s.score; });

  const team = members.map(m => ({
    ...m.toObject(),
    todayScore: scoreMap[m._id.toString()] ?? null,
  }));
  res.json({ success: true, team });
});

// @route  GET /api/manager/employee/:id/timeline?date=YYYY-MM-DD
router.get('/employee/:id/timeline', async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const userId = req.params.id;
  const user = await User.findById(userId).select('-password');
  
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (req.user.role === 'manager' && user.managerId?.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized: Employee not in your team' });
  }

  const [sessions, appUsage, screenshots] = await Promise.all([
    ActivitySession.find({ userId, date }).sort({ startTime: 1 }),
    AppUsageLog.find({ userId, date }).sort({ durationSeconds: -1 }),
    Screenshot.find({ userId, date, deletedAt: null }).sort({ capturedAt: -1 }),
  ]);
  res.json({ success: true, user, date, sessions, appUsage, screenshots });
});

// @route  GET /api/manager/employee/:id/score?days=30
router.get('/employee/:id/score', async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (req.user.role === 'manager' && user.managerId?.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized: Employee not in your team' });
  }

  const days = parseInt(req.query.days) || 30;
  const snapshots = await ProductivityScoreSnapshot.find({ userId: req.params.id })
    .sort({ date: -1 }).limit(days);
  res.json({ success: true, snapshots: snapshots.reverse() });
});

// @route  GET /api/manager/team/analytics
router.get('/team/analytics', async (req, res) => {
  const query = req.user.role === 'admin'
    ? { isActive: true, role: { $ne: 'admin' } }
    : { isActive: true, managerId: req.user.id };
  const members = await User.find(query).select('_id');
  const ids = members.map(m => m._id);

  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7.push(d.toISOString().slice(0, 10));
  }

  const snapshots = await ProductivityScoreSnapshot.find({
    userId: { $in: ids },
    date: { $in: last7 },
  });

  const byDate = {};
  last7.forEach(d => { byDate[d] = []; });
  snapshots.forEach(s => {
    if (byDate[s.date]) byDate[s.date].push(s.score);
  });

  const trendData = last7.map(date => ({
    date,
    avgScore: byDate[date].length ? Math.round(byDate[date].reduce((a, b) => a + b, 0) / byDate[date].length) : 0,
  }));

  // Top apps across team today
  const today = last7[last7.length - 1];
  const appLogs = await AppUsageLog.find({ userId: { $in: ids }, date: today });
  const appTotals = {};
  appLogs.forEach(l => {
    if (!appTotals[l.appName]) appTotals[l.appName] = { appName: l.appName, durationSeconds: 0, category: l.category };
    appTotals[l.appName].durationSeconds += l.durationSeconds;
  });
  const topApps = Object.values(appTotals).sort((a, b) => b.durationSeconds - a.durationSeconds).slice(0, 10);

  res.json({ success: true, trendData, topApps, memberCount: ids.length });
});

// @route  GET /api/manager/export
// Export activity data to CSV
router.get('/export', async (req, res) => {
  const query = req.user.role === 'admin'
    ? { isActive: true, role: { $ne: 'admin' } }
    : { isActive: true, managerId: req.user.id };
  const members = await User.find(query).select('_id name');
  const ids = members.map(m => m._id);

  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const sessions = await ActivitySession.find({ userId: { $in: ids }, date }).populate('userId', 'name email');

  let csv = 'User Name,Email,Session Type,App Name,Start Time,End Time,Duration (s)\n';
  sessions.forEach(s => {
    const user = members.find(m => m._id.toString() === s.userId._id.toString());
    csv += `${user?.name || 'Unknown'},${s.userId.email},${s.type},"${s.appName || ''}",${s.startTime},${s.endTime || ''},${s.durationSeconds || 0}\n`;
  });

  res.header('Content-Type', 'text/csv');
  res.attachment(`workpulse-export-${date}.csv`);
  res.send(csv);
});

// @route  GET /api/manager/alerts
// Get active alerts for the manager's team
router.get('/alerts', async (req, res) => {
  const query = req.user.role === 'admin' ? {} : { managerId: req.user.id };
  const alerts = await Alert.find(query).sort({ createdAt: -1 }).limit(50).populate('employeeId', 'name avatar');
  res.json({ success: true, alerts });
});

// @route  PUT /api/manager/alerts/:id/read
router.put('/alerts/:id/read', async (req, res) => {
  const alert = await Alert.findById(req.params.id);
  if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
  alert.isRead = true;
  await alert.save();
  res.json({ success: true, alert });
});

module.exports = router;
