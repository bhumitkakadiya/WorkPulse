const express = require('express');
const router = express.Router();
const { protect, hasPermission } = require('../middleware/auth');
const PERMISSIONS = require('../constants/permissions');
const Attendance = require('../models/Attendance');

router.use(protect);

// Employee sees their own attendance
router.get('/my', hasPermission(PERMISSIONS.VIEW_OWN_DATA), async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = { userId: req.user.id };
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find(query).sort({ date: -1 });
    res.json({ success: true, attendance });
  } catch (err) {
    throw err;
  }
});

// Manager sees team attendance
router.get('/team', hasPermission(PERMISSIONS.VIEW_TEAM_DATA), async (req, res) => {
  try {
    // Ideally this filters by users whose managerId is req.user.id
    // But for a simple prototype, we'll return all or a mock
    const { date } = req.query; // specific date
    let query = {};
    if (date) {
      const start = new Date(date); start.setHours(0,0,0,0);
      const end = new Date(date); end.setHours(23,59,59,999);
      query.date = { $gte: start, $lte: end };
    }
    
    const attendance = await Attendance.find(query).populate('userId', 'name email avatar department');
    res.json({ success: true, attendance });
  } catch (err) {
    throw err;
  }
});

module.exports = router;
