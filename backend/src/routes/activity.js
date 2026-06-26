const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Screenshot = require('../models/Screenshot');
const BrowsingHistoryEntry = require('../models/BrowsingHistoryEntry');

router.use(protect);

// Helper to check view permissions
const canViewActivity = async (req, targetUserId) => {
  if (req.user.role === 'admin') return true;
  if (req.user.id === targetUserId) return true;
  if (req.user.role === 'manager') {
    const targetUser = await User.findById(targetUserId);
    return targetUser && targetUser.managerId?.toString() === req.user.id;
  }
  return false;
};

// GET /api/activity/:id/screenshots
router.get('/:id/screenshots', async (req, res) => {
  try {
    const authorized = await canViewActivity(req, req.params.id);
    if (!authorized) return res.status(403).json({ success: false, message: 'Not authorized to view this user\'s activity' });

    // In a real app, you'd filter by date (e.g. ?date=YYYY-MM-DD)
    const dateQuery = req.query.date ? new Date(req.query.date) : new Date();
    dateQuery.setHours(0,0,0,0);
    const nextDay = new Date(dateQuery);
    nextDay.setDate(nextDay.getDate() + 1);

    const screenshots = await Screenshot.find({ 
      user: req.params.id,
      capturedAt: { $gte: dateQuery, $lt: nextDay }
    }).sort({ capturedAt: -1 });

    res.json({ success: true, screenshots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/activity/:id/history
router.get('/:id/history', async (req, res) => {
  try {
    const authorized = await canViewActivity(req, req.params.id);
    if (!authorized) return res.status(403).json({ success: false, message: 'Not authorized' });

    const dateQuery = req.query.date ? new Date(req.query.date) : new Date();
    dateQuery.setHours(0,0,0,0);
    const nextDay = new Date(dateQuery);
    nextDay.setDate(nextDay.getDate() + 1);

    const history = await BrowsingHistoryEntry.find({
      user: req.params.id,
      visitedAt: { $gte: dateQuery, $lt: nextDay }
    }).sort({ visitedAt: -1 });

    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/activity/:id/live-status
router.get('/:id/live-status', async (req, res) => {
  try {
    const authorized = await canViewActivity(req, req.params.id);
    if (!authorized) return res.status(403).json({ success: false, message: 'Not authorized' });

    const user = await User.findById(req.params.id).select('isOnline lastActive');
    
    // In a real system, you might fetch the last known activeApp/window from redis/socket context
    // For now, we mock the live status details
    res.json({ 
      success: true, 
      liveStatus: {
        isOnline: user.isOnline,
        lastActive: user.lastActive,
        activeApp: user.isOnline ? 'VS Code' : null,
        activeWindowTitle: user.isOnline ? 'workpulse/backend/server.js' : null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
