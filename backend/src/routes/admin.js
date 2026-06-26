const express = require('express');
const router = express.Router();
const { protect, hasPermission } = require('../middleware/auth');
const User = require('../models/User');
const AppCategory = require('../models/AppCategory');
const Alert = require('../models/Alert');
const PERMISSIONS = require('../constants/permissions');

router.use(protect);

// Global fallback for all admin routes for now (will be split later)
router.use(hasPermission(PERMISSIONS.VIEW_ORG_DATA));

// @route  GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const users = await User.find({}).select('role isActive department');
    const totalUsers = users.length;
    const roleBreakdown = { admin: 0, manager: 0, employee: 0 };
    users.forEach(u => { if (roleBreakdown[u.role] !== undefined) roleBreakdown[u.role]++; });
    const activeCount = users.filter(u => u.isActive).length;
    const departments = [...new Set(users.map(u => u.department).filter(Boolean))].length;
    const totalAlerts = await Alert.countDocuments({});
    res.json({ success: true, stats: { totalUsers, activeCount, departments, totalAlerts, roleBreakdown } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route  GET /api/admin/users
router.get('/users', async (req, res) => {
  const users = await User.find({}).select('-password').sort({ createdAt: -1 });
  res.json({ success: true, users });
});

// @route  POST /api/admin/users
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role, department, managerId } = req.body;
    // Auto-generate userId and mobileNumber for admin-created users
    const baseHandle = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 16);
    let userId = baseHandle || 'user';
    let suffix = 1;
    while (await User.findOne({ userId })) { userId = `${baseHandle}${suffix++}`; }
    const mobileNumber = `admin${Date.now().toString().slice(-7)}`;
    const user = await User.create({ name, email, password: password || 'Changeme1', role, department, managerId, userId, mobileNumber, isActive: true });
    res.status(201).json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @route  PUT /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
  const { name, email, role, department, isActive, managerId } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { name, email, role, department, isActive, managerId }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
});

// @route  DELETE /api/admin/users/:id (soft deactivate)
router.delete('/users/:id', async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, message: 'User deactivated' });
});

// @route  GET/PUT /api/admin/settings
router.get('/settings', async (req, res) => {
  res.json({
    success: true,
    settings: {
      screenshotsEnabled: true,
      screenshotIntervalMinutes: 20,
      screenshotBlurMode: false,
      retentionDays: 90,
      orgName: 'WorkPulse Org',
      workdayStart: '09:00',
      workdayEnd: '18:00',
    },
  });
});

router.put('/settings', async (req, res) => {
  // In MVP: accept and return the settings (no DB persistence)
  res.json({ success: true, settings: req.body });
});

// @route  GET/POST/PUT /api/admin/categories
router.get('/categories', async (req, res) => {
  const cats = await AppCategory.find({ orgId: 'default_org' }).sort({ type: 1, pattern: 1 });
  res.json({ success: true, categories: cats });
});

router.post('/categories', async (req, res) => {
  const { type, pattern, category, label } = req.body;
  const cat = await AppCategory.create({ orgId: 'default_org', type, pattern, category, label });
  res.status(201).json({ success: true, category: cat });
});

router.put('/categories/:id', async (req, res) => {
  const { category, label } = req.body;
  const cat = await AppCategory.findByIdAndUpdate(req.params.id, { category, label }, { new: true });
  if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
  res.json({ success: true, category: cat });
});

router.delete('/categories/:id', async (req, res) => {
  await AppCategory.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
