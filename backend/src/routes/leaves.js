const express = require('express');
const router = express.Router();
const { protect, hasPermission } = require('../middleware/auth');
const PERMISSIONS = require('../constants/permissions');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveBalance = require('../models/LeaveBalance');

router.use(protect);

// Employee submits leave request
router.post('/request', hasPermission(PERMISSIONS.REQUEST_LEAVES), async (req, res) => {
  try {
    const { leaveTypeCode, startDate, endDate, days, reason } = req.body;
    
    // Auto-approve logic or setup approval chain based on policy would go here
    // For now, setting manager as the approver.
    const managerId = req.user.managerId;

    const status = managerId ? 'pending' : 'approved';

    const newRequest = await LeaveRequest.create({
      userId: req.user.id,
      leaveTypeCode,
      startDate,
      endDate,
      days,
      reason,
      status,
      approvalChain: managerId ? [{
        approverId: managerId,
        approverRole: 'Manager',
        status: 'pending'
      }] : []
    });

    // Update LeaveBalance pending or used days
    const currentYear = new Date(startDate).getFullYear();
    const balance = await LeaveBalance.findOne({ userId: req.user.id, year: currentYear });
    if (balance) {
      const typeBalance = balance.balances.find(b => b.leaveTypeCode === leaveTypeCode);
      if (typeBalance) {
        if (status === 'pending') typeBalance.pending += days;
        if (status === 'approved') typeBalance.used += days;
        await balance.save();
      }
    }

    res.status(201).json({ success: true, request: newRequest });
  } catch (err) {
    throw err;
  }
});

// Employee sees their own requests
router.get('/my-requests', hasPermission(PERMISSIONS.VIEW_OWN_DATA), async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (err) {
    throw err;
  }
});

// Employee sees their leave balance
router.get('/my-balance', hasPermission(PERMISSIONS.VIEW_OWN_DATA), async (req, res) => {
  try {
    const balance = await LeaveBalance.findOne({ userId: req.user.id, year: new Date().getFullYear() });
    res.json({ success: true, balance: balance || { balances: [] } });
  } catch (err) {
    throw err;
  }
});

// Manager sees pending requests for their team
router.get('/team-requests', hasPermission(PERMISSIONS.APPROVE_LEAVES), async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ 'approvalChain.approverId': req.user.id, status: 'pending' }).populate('userId', 'name email avatar');
    res.json({ success: true, requests });
  } catch (err) {
    throw err;
  }
});

// Approve leave
router.put('/:id/approve', hasPermission(PERMISSIONS.APPROVE_LEAVES), async (req, res) => {
  try {
    const request = await LeaveRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    // Update status in approval chain
    request.status = 'approved';
    
    // Update LeaveBalance
    const currentYear = new Date(request.startDate).getFullYear();
    const balance = await LeaveBalance.findOne({ userId: request.userId, year: currentYear });
    if (balance) {
      const typeBalance = balance.balances.find(b => b.leaveTypeCode === request.leaveTypeCode);
      if (typeBalance) {
        typeBalance.pending = Math.max(0, typeBalance.pending - request.days);
        typeBalance.used += request.days;
        await balance.save();
      }
    }
    
    await request.save();

    res.json({ success: true, request });
  } catch (err) {
    throw err;
  }
});

// Reject leave
router.put('/:id/reject', hasPermission(PERMISSIONS.APPROVE_LEAVES), async (req, res) => {
  try {
    const request = await LeaveRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    request.status = 'rejected';

    // Update LeaveBalance
    const currentYear = new Date(request.startDate).getFullYear();
    const balance = await LeaveBalance.findOne({ userId: request.userId, year: currentYear });
    if (balance) {
      const typeBalance = balance.balances.find(b => b.leaveTypeCode === request.leaveTypeCode);
      if (typeBalance) {
        typeBalance.pending = Math.max(0, typeBalance.pending - request.days);
        await balance.save();
      }
    }

    await request.save();

    res.json({ success: true, request });
  } catch (err) {
    throw err;
  }
});

module.exports = router;
