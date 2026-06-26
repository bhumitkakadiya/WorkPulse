const express = require('express');
const router = express.Router();
const { protect, hasPermission } = require('../middleware/auth');
const PERMISSIONS = require('../constants/permissions');
const PerformanceSnapshot = require('../models/PerformanceSnapshot');
const Task = require('../models/Task');
const ActivitySession = require('../models/ActivitySession');
const AppUsageLog = require('../models/AppUsageLog');

router.use(protect);

// GET /api/performance/me
router.get('/me', async (req, res) => {
  const range = parseInt(req.query.range) || 5; // Weeks back
  const snapshots = await PerformanceSnapshot.find({ userId: req.user.id })
    .sort({ weekStartDate: -1 })
    .limit(range);
    
  // Also get recent tasks for history
  const recentTasks = await Task.find({ assignedTo: req.user.id })
    .sort({ updatedAt: -1 })
    .limit(20);
    
  res.json({ success: true, snapshots: snapshots.reverse(), recentTasks });
});

// GET /api/performance/team/:userId (Manager/Admin)
router.get('/team/:userId', hasPermission(PERMISSIONS.VIEW_TEAM_DATA), async (req, res) => {
  const range = parseInt(req.query.range) || 5;
  const snapshots = await PerformanceSnapshot.find({ userId: req.params.userId })
    .sort({ weekStartDate: -1 })
    .limit(range);
    
  const recentTasks = await Task.find({ assignedTo: req.params.userId })
    .sort({ updatedAt: -1 })
    .limit(20);
    
  res.json({ success: true, snapshots: snapshots.reverse(), recentTasks });
});

// GET /api/performance/team (Manager aggregated)
router.get('/team', hasPermission(PERMISSIONS.VIEW_TEAM_DATA), async (req, res) => {
  // Aggregate recent snapshot for the manager's team
  const User = require('../models/User');
  const teamMembers = await User.find({ teamId: req.user.teamId }).select('_id name avatar');
  
  const teamIds = teamMembers.map(u => u._id);
  
  // Find the latest snapshot for each team member
  const latestSnapshots = await PerformanceSnapshot.aggregate([
    { $match: { userId: { $in: teamIds } } },
    { $sort: { weekStartDate: -1 } },
    { $group: {
        _id: '$userId',
        snapshot: { $first: '$$ROOT' }
    }}
  ]);
  
  res.json({ success: true, teamMembers, latestSnapshots });
});

// GET /api/performance/org (Admin aggregated)
router.get('/org', hasPermission(PERMISSIONS.VIEW_ORG_DATA), async (req, res) => {
  // Simple org-wide aggregation
  const latestSnapshots = await PerformanceSnapshot.aggregate([
    { $sort: { weekStartDate: -1 } },
    { $group: {
        _id: '$weekStartDate',
        avgScore: { $avg: '$avgProductivityScore' },
        totalTasksCompleted: { $sum: '$tasksCompleted' },
        avgOnTimeRate: { $avg: '$onTimeCompletionRate' }
    }},
    { $sort: { _id: -1 } },
    { $limit: 10 }
  ]);
  
  res.json({ success: true, snapshots: latestSnapshots.reverse() });
});

// GET /api/performance/tasks/:id/activity-context
router.get('/tasks/:id/activity-context', hasPermission(PERMISSIONS.VIEW_TEAM_DATA), async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
  
  // Find app usage logs for the assignee during the active window of the task
  // Active window: from acceptedAt (or createdAt) to submittedAt (or now)
  const startTime = task.acceptedAt || task.createdAt;
  const endTime = task.submittedAt || new Date();
  
  // Query AppUsageLog
  const appLogs = await AppUsageLog.find({
    userId: task.assignedTo,
    // Note: AppUsageLog usually has 'date' string, but if we need a time window, we might need more complex query
    // Let's just find by date range for now.
    date: { 
      $gte: startTime.toISOString().slice(0,10), 
      $lte: endTime.toISOString().slice(0,10) 
    }
  });
  
  // Filter by task's relatedAppTags
  let filteredLogs = appLogs;
  if (task.relatedAppTags && task.relatedAppTags.length > 0) {
    const tagsLower = task.relatedAppTags.map(t => t.toLowerCase());
    filteredLogs = appLogs.filter(log => {
      const appLower = log.appName.toLowerCase();
      return tagsLower.some(tag => appLower.includes(tag) || tag.includes(appLower));
    });
  }
  
  // Aggregate duration
  const appDurations = {};
  filteredLogs.forEach(log => {
    appDurations[log.appName] = (appDurations[log.appName] || 0) + log.durationSeconds;
  });
  
  res.json({ success: true, activeWindow: { start: startTime, end: endTime }, appDurations });
});

module.exports = router;
