const express = require('express');
const router = express.Router();
const { protect, hasPermission } = require('../middleware/auth');
const PERMISSIONS = require('../constants/permissions');
const ActivitySession = require('../models/ActivitySession');
const AppUsageLog = require('../models/AppUsageLog');
const WebsiteLog = require('../models/WebsiteLog');
const Screenshot = require('../models/Screenshot');
const AICommandLog = require('../models/AICommandLog');
const Device = require('../models/Device');
const User = require('../models/User');
const scoringEngine = require('../services/scoringEngine');
const { upload } = require('../config/cloudinary');

// @route  POST /api/agent/heartbeat
router.post('/heartbeat', protect, async (req, res) => {
  const { deviceName, platform, agentVersion } = req.body;
  let device = await Device.findOne({ userId: req.user.id, deviceName });
  if (!device) {
    device = await Device.create({ userId: req.user.id, deviceName, platform, agentVersion });
  } else {
    device.lastHeartbeat = new Date();
    device.agentVersion = agentVersion || device.agentVersion;
    await device.save();
  }
  await User.findByIdAndUpdate(req.user.id, { onlineStatus: 'online', lastSeen: new Date() });
  
  // Check if a focus session is currently active
  const activeFocus = await ActivitySession.findOne({
    userId: req.user.id,
    isFocusSession: true,
    endTime: null,
  });

  res.json({ success: true, deviceId: device._id, focusModeActive: !!activeFocus });
});

// @route  POST /api/agent/sessions
router.post('/sessions', protect, async (req, res) => {
  const { sessions } = req.body;
  if (!sessions || !Array.isArray(sessions)) return res.status(400).json({ success: false, message: 'sessions array required' });
  const docs = sessions.map(s => ({ ...s, userId: req.user.id }));
  await ActivitySession.insertMany(docs, { ordered: false });
  res.json({ success: true, count: docs.length });
});

// @route  POST /api/agent/app-usage
router.post('/app-usage', protect, async (req, res) => {
  const { logs } = req.body;
  if (!logs || !Array.isArray(logs)) return res.status(400).json({ success: false, message: 'logs array required' });
  const docs = logs.map(l => ({ ...l, userId: req.user.id }));
  await AppUsageLog.insertMany(docs, { ordered: false });
  // Trigger score recompute for affected dates
  const dates = [...new Set(docs.map(l => l.date).filter(Boolean))];
  for (const date of dates) await scoringEngine.computeAndSave(req.user.id, date);
  res.json({ success: true });
});

// @route  POST /api/agent/website-logs
router.post('/website-logs', protect, async (req, res) => {
  const { logs } = req.body;
  if (!logs || !Array.isArray(logs)) return res.status(400).json({ success: false, message: 'logs array required' });
  const docs = logs.map(l => ({ ...l, userId: req.user.id }));
  await WebsiteLog.insertMany(docs, { ordered: false });
  // Trigger score recompute for affected dates
  const dates = [...new Set(docs.map(l => l.date).filter(Boolean))];
  for (const date of dates) await scoringEngine.computeAndSave(req.user.id, date);
  res.json({ success: true });
});

// @route  POST /api/agent/ai-commands
router.post('/ai-commands', protect, async (req, res) => {
  const { rawInput, parsedAction, result, errorMessage, inputType } = req.body;
  const log = await AICommandLog.create({ userId: req.user.id, rawInput, parsedAction, result, errorMessage, inputType });
  res.status(201).json({ success: true, log });
});

// @route  POST /api/agent/screenshots
router.post('/screenshots', protect, upload.single('screenshot'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const { activeApp, windowTitle, isBlurred, capturedAt } = req.body;
  const screenshot = await Screenshot.create({
    userId: req.user.id,
    imageUrl: req.file.path,
    activeApp,
    windowTitle,
    isBlurred: isBlurred === 'true',
    capturedAt: capturedAt || new Date(),
    date: (capturedAt ? new Date(capturedAt) : new Date()).toISOString().slice(0, 10),
  });
  res.status(201).json({ success: true, screenshot });
});

module.exports = router;
