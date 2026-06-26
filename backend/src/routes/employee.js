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

module.exports = router;
