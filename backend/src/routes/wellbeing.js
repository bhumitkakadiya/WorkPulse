const express = require('express');
const router = express.Router();
const { protect, hasPermission } = require('../middleware/auth');
const PERMISSIONS = require('../constants/permissions');
const BurnoutFlag = require('../models/BurnoutFlag');
const PulseSurvey = require('../models/PulseSurvey');
const WellbeingSurvey = require('../models/WellbeingSurvey');

router.use(protect);

// Manager sees burnout flags for their team
router.get('/burnout-flags', hasPermission(PERMISSIONS.VIEW_TEAM_DATA), async (req, res) => {
  try {
    const flags = await BurnoutFlag.find({ managerId: req.user.id, acknowledged: false }).populate('userId', 'name avatar department');
    res.json({ success: true, flags });
  } catch (err) {
    throw err;
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
    throw err;
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
    throw err;
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
    throw err;
  }
});

// @route  GET /api/wellbeing/survey
router.get('/survey', hasPermission(PERMISSIONS.VIEW_OWN_DATA), (req, res) => {
  const questions = [
    { id: 'q1', type: 'rating', text: 'How would you rate your energy levels this week?' },
    { id: 'q2', type: 'radio', text: 'How manageable was your workload?', options: ['Very Light', 'Light', 'Just Right', 'Heavy', 'Overwhelming'] },
    { id: 'q3', type: 'radio', text: 'Did you feel focused during work hours?', options: ['Yes', 'Mostly', 'Sometimes', 'Rarely'] },
    { id: 'q4', type: 'rating', text: 'How satisfied are you with your work-life balance this week?' },
    { id: 'q5', type: 'text', text: 'Any additional comments?' }
  ];
  res.json({ success: true, questions });
});

// @route  POST /api/wellbeing/survey
router.post('/survey', hasPermission(PERMISSIONS.VIEW_OWN_DATA), async (req, res) => {
  try {
    const { responses } = req.body;
    
    // Get ISO week number
    const today = new Date();
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const pastDaysOfYear = (today - firstDayOfYear) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

    // Check if user already submitted this week
    const existing = await WellbeingSurvey.findOne({ userId: req.user.id, weekNumber });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already submitted a survey this week.' });
    }

    const survey = await WellbeingSurvey.create({
      userId: req.user.id,
      weekNumber,
      responses,
      submittedAt: new Date()
    });

    res.status(201).json({ success: true, survey });
  } catch (err) {
    throw err;
  }
});

module.exports = router;
