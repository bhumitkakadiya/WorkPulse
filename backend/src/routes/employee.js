const express = require('express');
const router = express.Router();
const { protect, hasPermission } = require('../middleware/auth');
const PERMISSIONS = require('../constants/permissions');
const ActivitySession = require('../models/ActivitySession');
const AppUsageLog = require('../models/AppUsageLog');
const Screenshot = require('../models/Screenshot');
const AICommandLog = require('../models/AICommandLog');
const ProductivityScoreSnapshot = require('../models/ProductivityScoreSnapshot');

// All employee routes require auth
router.use(protect);

// @route  GET /api/employee/timeline?date=YYYY-MM-DD
router.get('/timeline', async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const [sessions, appUsage, screenshots] = await Promise.all([
    ActivitySession.find({ userId: req.user.id, date }).sort({ startTime: 1 }),
    AppUsageLog.find({ userId: req.user.id, date }).sort({ durationSeconds: -1 }),
    Screenshot.find({ userId: req.user.id, date, deletedAt: null }).sort({ capturedAt: -1 }),
  ]);
  res.json({ success: true, date, sessions, appUsage, screenshots });
});

// @route  GET /api/employee/activity?date=YYYY-MM-DD
router.get('/activity', async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const sessions = await ActivitySession.find({ userId: req.user.id, date }).sort({ startTime: 1 });
  
  // Create hourly timeline data (0-23 hours)
  const hourly = Array.from({ length: 24 }).map((_, hour) => {
    // Determine productivity level for the hour based on mock logic (in reality, calculate from sessions)
    // For demo purposes, we'll randomize or mock it.
    const hasSession = sessions.some(s => {
      const h = new Date(s.startTime).getHours();
      return h === hour;
    });

    if (!hasSession && (hour < 9 || hour > 17)) return { hour, score: null, level: 'offline' };
    if (!hasSession) return { hour, score: 0, level: 'idle' };

    const score = Math.floor(Math.random() * 80) + 20; // 20-100
    let level = 'distracted';
    if (score >= 80) level = 'highly_productive';
    else if (score >= 60) level = 'productive';
    else if (score >= 40) level = 'neutral';
    else if (score >= 20) level = 'distracted';

    return { hour, score, level };
  });

  // Mock summary
  const summary = {
    productiveTime: '5h 30m',
    distractedTime: '1h 15m',
    idleTime: '1h 15m',
    focusSessions: 4
  };

  res.json({ success: true, date, hourly, summary });
});

// @route  GET /api/employee/apps?date=YYYY-MM-DD
router.get('/apps', async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  let appUsage = await AppUsageLog.find({ userId: req.user.id, date }).sort({ durationSeconds: -1 }).limit(10);
  
  // If empty, generate some mock data for UI visualization
  if (appUsage.length === 0) {
    appUsage = [
      { appName: 'VS Code', durationSeconds: 12500, category: 'productive' },
      { appName: 'Chrome', durationSeconds: 8400, category: 'neutral' },
      { appName: 'Slack', durationSeconds: 3600, category: 'productive' },
      { appName: 'YouTube', durationSeconds: 1800, category: 'distracting' },
      { appName: 'Terminal', durationSeconds: 1200, category: 'productive' }
    ];
  }

  res.json({ success: true, date, apps: appUsage });
});

// @route  GET /api/employee/score?days=7
router.get('/score', async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const snapshots = await ProductivityScoreSnapshot.find({ userId: req.user.id })
    .sort({ date: -1 }).limit(days);
  const latest = snapshots[0] || null;
  res.json({ success: true, snapshots: snapshots.reverse(), latest });
});

// @route  GET /api/employee/screenshots?date=YYYY-MM-DD
router.get('/screenshots', async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const screenshots = await Screenshot.find({ userId: req.user.id, date, deletedAt: null })
    .sort({ capturedAt: -1 });
  res.json({ success: true, screenshots });
});

// @route  POST /api/employee/idle-annotation
router.post('/idle-annotation', async (req, res) => {
  const { sessionId, annotation } = req.body;
  const session = await ActivitySession.findOne({ _id: sessionId, userId: req.user.id });
  if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
  session.idleAnnotation = annotation;
  await session.save();
  res.json({ success: true, session });
});

// @route  POST /api/employee/focus-session
router.post('/focus-session', async (req, res) => {
  const { action } = req.body; // 'start' or 'stop'
  if (action === 'start') {
    const session = await ActivitySession.create({
      userId: req.user.id,
      type: 'focus',
      startTime: new Date(),
      isFocusSession: true,
      date: new Date().toISOString().slice(0, 10),
    });
    return res.status(201).json({ success: true, session });
  } else {
    const session = await ActivitySession.findOne({
      userId: req.user.id, isFocusSession: true, endTime: null,
    }).sort({ startTime: -1 });
    if (session) {
      session.endTime = new Date();
      session.durationSeconds = Math.floor((session.endTime - session.startTime) / 1000);
      await session.save();
    }
    return res.json({ success: true, session });
  }
});

// @route  GET /api/employee/ai-commands
router.get('/ai-commands', async (req, res) => {
  const commands = await AICommandLog.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(10);
  res.json({ success: true, commands });
});

// @route  GET /api/employee/settings
router.get('/settings', async (req, res) => {
  // Return the same mocked global settings the admin sees
  const settings = {
    screenshotIntervalMinutes: 20,
    retentionDays: 90,
    idleTimeoutMinutes: 5,
  };
  res.json({ success: true, settings });
});

// @route  GET /api/employee/alerts
router.get('/alerts', async (req, res) => {
  const Alert = require('../models/Alert');
  const alerts = await Alert.find({ employeeId: req.user.id }).sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, alerts });
});

module.exports = router;
