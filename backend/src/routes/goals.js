const express = require('express');
const router = express.Router();
const { protect, hasPermission } = require('../middleware/auth');
const PERMISSIONS = require('../constants/permissions');
const Goal = require('../models/Goal');

router.use(protect);

// Get all goals (for simplicity, filtering by visibility could be added later)
router.get('/', hasPermission(PERMISSIONS.VIEW_OWN_DATA), async (req, res) => {
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
    throw err;
  }
});

// Create a goal
router.post('/', hasPermission(PERMISSIONS.MANAGE_DEPARTMENTS), async (req, res) => {
  try {
    const { title, description, type, ownerId, parentGoalId, targetDate, keyResults } = req.body;
    
    const newGoal = await Goal.create({
      title,
      description,
      type,
      ownerId: ownerId || req.user.id,
      parentGoalId,
      targetDate,
      keyResults: keyResults || []
    });
    
    res.status(201).json({ success: true, goal: newGoal });
  } catch (err) {
    throw err;
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
    
    if (req.body.status) goal.status = req.body.status;
    if (req.body.progressPercent !== undefined) goal.progressPercent = req.body.progressPercent;
    if (req.body.keyResults !== undefined) {
      goal.keyResults = req.body.keyResults;
      // Calculate overall progress from key results if any exist
      if (goal.keyResults.length > 0) {
        let total = 0;
        goal.keyResults.forEach(kr => {
          if (kr.target > 0) {
            total += Math.min(100, Math.max(0, (kr.current / kr.target) * 100));
          }
        });
        goal.progressPercent = Math.round(total / goal.keyResults.length);
      }
    }
    
    await goal.save();
    
    res.json({ success: true, goal });
  } catch (err) {
    throw err;
  }
});

module.exports = router;
