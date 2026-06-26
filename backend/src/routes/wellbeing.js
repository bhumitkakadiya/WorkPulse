const express = require('express');
const router = express.Router();
const { protect, hasPermission } = require('../middleware/auth');
const PERMISSIONS = require('../constants/permissions');
const BurnoutFlag = require('../models/BurnoutFlag');
const PulseSurvey = require('../models/PulseSurvey');

router.use(protect);

// Manager sees burnout flags for their team
router.get('/burnout-flags', hasPermission(PERMISSIONS.VIEW_TEAM_DATA), async (req, res) => {
  try {
    const flags = await BurnoutFlag.find({ managerId: req.user.id, acknowledged: false }).populate('userId', 'name avatar department');
    res.json({ success: true, flags });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Acknowledge a flag
router.put('/burnout-flags/:id/acknowledge', hasPermission(PERMISSIONS.VIEW_TEAM_DATA), async (req, res) => {
  try {
    const flag = await BurnoutFlag.findById(req.params.id);
    if (!flag) return res.status(404).json({ success: false, message: 'Flag not found' });
    
    flag.acknowledged = true;
    flag.acknowledgedBy = req.user.id;
    flag.acknowledgedAt = Date.now();
    await flag.save();
    
    res.json({ success: true, flag });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Employee submits weekly pulse survey
router.post('/pulse-survey', hasPermission(PERMISSIONS.VIEW_OWN_DATA), async (req, res) => {
  try {
    const { moodScore, workloadScore, blockerText } = req.body;
    
    // Find this week's survey for the org (or create it)
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const weekStart = new Date(today.setDate(diff));
    weekStart.setHours(0,0,0,0);
    
    let survey = await PulseSurvey.findOne({ weekStartDate: weekStart });
    if (!survey) {
      survey = await PulseSurvey.create({ weekStartDate: weekStart, responses: [] });
    }
    
    // Check if already submitted
    if (survey.responses.some(r => r.userId.toString() === req.user.id)) {
      return res.status(400).json({ success: false, message: 'Already submitted this week' });
    }
    
    survey.responses.push({ userId: req.user.id, moodScore, workloadScore, blockerText });
    await survey.save();
    
    res.json({ success: true, message: 'Survey submitted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Manager sees pulse results
router.get('/pulse-results', hasPermission(PERMISSIONS.VIEW_TEAM_DATA), async (req, res) => {
  try {
    // Get last 4 weeks of surveys
    const surveys = await PulseSurvey.find().sort({ weekStartDate: -1 }).limit(4);
    
    const results = surveys.map(s => {
      const avgMood = s.responses.reduce((sum, r) => sum + r.moodScore, 0) / (s.responses.length || 1);
      const avgWorkload = s.responses.reduce((sum, r) => sum + r.workloadScore, 0) / (s.responses.length || 1);
      return {
        weekStartDate: s.weekStartDate,
        responsesCount: s.responses.length,
        avgMood: parseFloat(avgMood.toFixed(1)),
        avgWorkload: parseFloat(avgWorkload.toFixed(1))
      };
    });
    
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
