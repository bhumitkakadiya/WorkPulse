const express = require('express');
const router = express.Router();
const { protect, hasPermission } = require('../middleware/auth');
const PERMISSIONS = require('../constants/permissions');
const Task = require('../models/Task');
const User = require('../models/User');

router.use(protect);

// GET /api/tasks
router.get('/', async (req, res) => {
  let query = {};
  if (req.user.role === 'admin') {
    // Admin sees all tasks
  } else if (req.user.role === 'manager') {
    // Manager sees tasks they assigned, or tasks assigned to them, or tasks assigned to their direct reports
    const directReports = await User.find({ managerId: req.user.id }).select('_id');
    const directReportIds = directReports.map(u => u._id);
    query.$or = [
      { assignedBy: req.user.id },
      { assignedTo: req.user.id },
      { assignedTo: { $in: directReportIds } }
    ];
  } else if (req.user.role === 'employee') {
    // Employee sees only tasks assigned to them
    query.assignedTo = req.user.id;
  }
  
  if (req.query.status) query.status = req.query.status;
  if (req.query.assignedTo) query.assignedTo = req.query.assignedTo;

  console.log(`[TASKS GET] User: ${req.user.name} (${req.user.role}) ID: ${req.user.id}`);
  console.log(`[TASKS GET] Query:`, JSON.stringify(query));

  try {
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email role')
      .populate('parentTask')
      .populate('progressNotes.author', 'name email avatar')
      .sort({ createdAt: -1 });
      
    console.log(`[TASKS GET] Found ${tasks.length} tasks for ${req.user.name}`);
    res.json({ success: true, tasks });
  } catch (err) {
    console.error(`[TASKS GET] Error:`, err);
    throw err;
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('progressNotes.author', 'name email avatar');
      
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    // Scope check: if employee, must be assigned to them.
    if (req.user.role === 'employee' && task.assignedTo._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this task' });
    }
    res.json({ success: true, task });
  } catch (err) {
    throw err;
  }
});

// POST /api/tasks (Manager/Admin)
router.post('/', hasPermission(PERMISSIONS.VIEW_TEAM_DATA), async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate, parentTask } = req.body;
    
    // Validate permission to assign
    if (req.user.role === 'manager') {
      const userToAssign = await User.findById(assignedTo);
      if (userToAssign.managerId?.toString() !== req.user.id && userToAssign._id.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Managers can only assign tasks to their direct reports' });
      }
    }
    
    const task = await Task.create({
      title,
      description,
      assignedBy: req.user.id,
      assignedTo,
      priority,
      dueDate,
      labels: req.body.labels || [],
      parentTask: parentTask || null
    });
    
    // TODO: Create Notification Alert for assignedTo user
    
    res.status(201).json({ success: true, task });
  } catch (err) {
    throw err;
  }
});

// PATCH /api/tasks/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    
    // Check permissions: assignedTo, assignedBy, or Admin
    const isAssignee = task.assignedTo.toString() === req.user.id;
    const isAssigner = task.assignedBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isAssignee && !isAssigner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this task status' });
    }
    
    task.status = status;
    await task.save();
    
    // TODO: Generate alert based on status change (e.g. Blocked, Done)
    
    res.json({ success: true, task });
  } catch (err) {
    throw err;
  }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    
    const isAssignee = task.assignedTo.toString() === req.user.id;
    const isAssigner = task.assignedBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isAssignee && !isAssigner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
    }
    
    const updatableFields = ['title', 'description', 'priority', 'dueDate', 'labels', 'status'];
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });
    
    await task.save();
    res.json({ success: true, task });
  } catch (err) {
    throw err;
  }
});

// POST /api/tasks/:id/notes
router.post('/:id/notes', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });
    
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    
    // Permission check similar to status
    const isAssignee = task.assignedTo.toString() === req.user.id;
    const isAssigner = task.assignedBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isAssignee && !isAssigner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to add notes to this task' });
    }
    
    task.progressNotes.push({ author: req.user.id, message });
    await task.save();
    await task.populate('progressNotes.author', 'name email avatar');
    
    res.json({ success: true, task });
  } catch (err) {
    throw err;
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    
    // Only Admin or Assigner can delete
    const isAssigner = task.assignedBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isAssigner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the assigner or an admin can delete a task' });
    }
    
    await Task.deleteOne({ _id: task._id });
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    throw err;
  }
});

module.exports = router;
