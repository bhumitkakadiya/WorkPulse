const express = require('express');
const router = express.Router();
const { protect, hasPermission } = require('../middleware/auth');
const PERMISSIONS = require('../constants/permissions');
const AuditLog = require('../models/AuditLog');

router.use(protect);

// Get audit logs with optional filters
router.get('/', hasPermission(PERMISSIONS.MANAGE_SYSTEM_SETTINGS), async (req, res) => {
  try {
    const { action, targetResource, page = 1, limit = 50 } = req.query;
    
    let query = {};
    if (action) query.action = action;
    if (targetResource) query.targetResource = targetResource;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const logs = await AuditLog.find(query)
      .populate('performedBy', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await AuditLog.countDocuments(query);

    res.json({ success: true, logs, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
