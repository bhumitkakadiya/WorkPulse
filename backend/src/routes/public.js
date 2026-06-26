const express = require('express');
const router = express.Router();
const Organization = require('../models/Organization');
const User = require('../models/User');

// @route  GET /api/public/organizations
// @desc   Get list of all active organizations for signup
// @access Public
router.get('/organizations', async (req, res) => {
  try {
    const orgs = await Organization.find({ isActive: true }).select('_id name departments').sort('name');
    res.json({ success: true, organizations: orgs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route  GET /api/public/check-handle
// @access Public
router.get('/check-handle', async (req, res) => {
  try {
    const handle = req.query.handle?.toLowerCase() || '';
    if (!handle) return res.json({ available: false });
    const user = await User.findOne({ userId: handle });
    res.json({ available: !user });
  } catch (err) {
    res.status(500).json({ available: false });
  }
});

// @route  GET /api/public/check-email
// @access Public
router.get('/check-email', async (req, res) => {
  try {
    const email = req.query.email?.toLowerCase() || '';
    if (!email) return res.json({ available: false });
    const user = await User.findOne({ email });
    res.json({ available: !user });
  } catch (err) {
    res.status(500).json({ available: false });
  }
});

// @route  GET /api/public/suggest-handle
// @access Public
router.get('/suggest-handle', async (req, res) => {
  try {
    const name = req.query.name || '';
    if (!name) return res.json({ success: false });
    
    const baseHandle = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    let handle = baseHandle;
    if (handle.length < 3) handle = handle + Math.floor(100 + Math.random() * 900);
    if (handle.length > 20) handle = handle.substring(0, 20);

    let counter = 1;
    let available = false;
    let finalHandle = handle;

    while (!available && counter < 100) {
      const exists = await User.findOne({ userId: finalHandle });
      if (!exists) {
        available = true;
      } else {
        const suffix = String(counter + 1);
        finalHandle = `${handle.substring(0, 20 - suffix.length)}${suffix}`;
        counter++;
      }
    }

    res.json({ success: true, handle: finalHandle });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
