const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Organization = require('../models/Organization');
const { protect } = require('../middleware/auth');

// @route  POST /api/auth/register
// @desc   Register new user
// @access Public
router.post('/register', async (req, res) => {
  const { role, name, email, password, companyName, companySize, orgId, department, jobTitle, userId, mobileNumber } = req.body;
  try {
    // Validate role
    if (!['admin', 'manager', 'employee'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role selected' });
    }

    // Check if user exists (email, userId, mobileNumber)
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ success: false, message: 'An account with this email already exists' });

    const existingUserId = await User.findOne({ userId });
    if (existingUserId) return res.status(400).json({ success: false, message: 'This username is already taken' });

    const existingMobile = await User.findOne({ mobileNumber });
    if (existingMobile) return res.status(400).json({ success: false, message: 'This mobile number is already in use' });

    if (!userId || !mobileNumber) {
      return res.status(400).json({ success: false, message: 'Username and mobile number are required' });
    }

    // Server-side password validation
    if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long and contain at least 1 uppercase letter and 1 number' });
    }

    let finalOrgId = orgId;
    let isActive = false;

    if (role === 'admin') {
      if (!companyName) return res.status(400).json({ success: false, message: 'Company name is required for Admin registration' });
      // Create new Organization
      const org = await Organization.create({ name: companyName, size: companySize || '' });
      finalOrgId = org._id.toString();
      isActive = true; // Admin is immediately active
    } else {
      if (!orgId) return res.status(400).json({ success: false, message: 'Organization selection is required' });
      const org = await Organization.findById(orgId);
      if (!org) return res.status(400).json({ success: false, message: 'Invalid organization selected' });
      isActive = false; // Manager/Employee are pending
    }

    const user = await User.create({ userId, mobileNumber, name, email, password, role, department, jobTitle, orgId: finalOrgId, isActive });
    
    let token = null;
    if (isActive) {
      token = user.getSignedJwtToken();
    }

    res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role, jobTitle: user.jobTitle, isActive: user.isActive } });
  } catch (err) {
    throw err;
  }
});

// @route  POST /api/auth/login
// @access Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Please provide email and password' });

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated or pending Admin approval' });
    }

    // Update online status
    user.onlineStatus = 'online';
    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });

    const token = user.getSignedJwtToken();
    let effectivePermissions = [];
    if (user.roleId) {
      const { getEffectivePermissions } = require('../middleware/auth');
      effectivePermissions = await getEffectivePermissions(user.roleId);
    }
    res.json({
      success: true, token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, department: user.department, preferences: user.preferences },
      effectivePermissions,
    });
  } catch (err) {
    throw err;
  }
});

// @route  GET /api/auth/me
// @access Private
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ success: true, user, effectivePermissions: req.effectivePermissions || [] });
});

// @route  PUT /api/auth/preferences
// @access Private
router.put('/preferences', protect, async (req, res) => {
  const { theme } = req.body;
  const user = await User.findByIdAndUpdate(req.user.id, { 'preferences.theme': theme }, { new: true });
  res.json({ success: true, user });
});

module.exports = router;
