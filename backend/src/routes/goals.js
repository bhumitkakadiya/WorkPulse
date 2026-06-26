const express = require('express');
const router = express.Router();
const { protect, hasPermission } = require('../middleware/auth');
const PERMISSIONS = require('../constants/permissions');
const Goal = require('../models/Goal');

router.use(protect);

// Get all goals (for simplicity, filtering by visibility could be added later)
router.get('/', hasPermission(PERMISSIONS.VIEW_TEAM_DATA), async (req, res) => {
  try {
    // If not admin, maybe restrict to their org or team. For now, fetch all goals visible to user.
    // Assuming simple flat view or cascading view in frontend
    let query = {};
    if (req.user.role === 'employee') {
      // Employees see their own individual goals and team/company goals
      query = { 
        $or: [
          { type: 'company' },
          { type: 'team' }, // Ideally filter by user's department
          { ownerId: req.user.id }
        ]
      };
    }
    
    const goals = await Goal.find(query).populate('ownerId', 'name avatar department').sort({ createdAt: -1 });
    res.json({ success: true, goals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create a goal
router.post('/', hasPermission(PERMISSIONS.MANAGE_DEPARTMENTS), async (req, res) => {
  try {
    const { title, description, type, ownerId, parentGoalId, targetDate } = req.body;
    
    const newGoal = await Goal.create({
      title,
      description,
      type,
      ownerId: ownerId || req.user.id,
      parentGoalId,
      targetDate
    });
    
    res.status(201).json({ success: true, goal: newGoal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update a goal (e.g. progress)
router.put('/:id', hasPermission(PERMISSIONS.VIEW_OWN_DATA), async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    
    // Simple ownership check
    if (goal.ownerId && goal.ownerId.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this goal' });
    }
    
    if (req.body.progressPercent !== undefined) {
      goal.progressPercent = req.body.progressPercent;
      if (goal.progressPercent >= 100) goal.status = 'completed';
      else if (goal.status === 'completed') goal.status = 'on_track';
    }
    
    if (req.body.status) goal.status = req.body.status;
    
    await goal.save();
    
    res.json({ success: true, goal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
