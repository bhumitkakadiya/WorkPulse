const express = require('express');
const router = express.Router();
const { protect, hasPermission } = require('../middleware/auth');
const PERMISSIONS = require('../constants/permissions');
const AIInsight = require('../models/AIInsight');

router.use(protect);

// Employee fetches their weekly insights
router.get('/my-insights', hasPermission(PERMISSIONS.VIEW_OWN_DATA), async (req, res) => {
  try {
    const insights = await AIInsight.find({ userId: req.user.id }).sort({ weekStartDate: -1 }).limit(4);
    res.json({ success: true, insights });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Manager fetches insights for team (simplified)
router.get('/team-insights', hasPermission(PERMISSIONS.VIEW_TEAM_DATA), async (req, res) => {
  try {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(today.setDate(diff));
    weekStart.setHours(0,0,0,0);
    
    // In reality, filter by team members. For now, fetch latest.
    const insights = await AIInsight.find({ weekStartDate: weekStart }).populate('userId', 'name avatar department');
    res.json({ success: true, insights });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
