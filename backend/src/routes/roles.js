const express = require('express');
const router = express.Router();
const { protect, hasPermission } = require('../middleware/auth');
const Role = require('../models/Role');
const User = require('../models/User');
const PERMISSIONS = require('../constants/permissions');
const logAudit = require('../utils/auditLogger');

router.use(protect);

// @route  GET /api/roles
// @desc   Get all roles in a tree structure
router.get('/', async (req, res) => {
  try {
    const roles = await Role.find().sort({ level: 1 });
    res.json({ success: true, roles });
  } catch (err) {
    throw err;
  }
});

// @route  POST /api/roles
// @desc   Create a new role
router.post('/', hasPermission(PERMISSIONS.MANAGE_ROLES), async (req, res) => {
  try {
    const { name, parentRoleId, permissions, color } = req.body;
    
    // Default to admin role if no parent specified
    let actualParent = parentRoleId;
    if (!actualParent) {
      const adminRole = await Role.findOne({ name: 'Admin', isSystem: true });
      if (adminRole) actualParent = adminRole._id;
    }

    const role = await Role.create({
      name,
      parentRoleId: actualParent,
      permissions: permissions || [],
      color: color || '#6B7280',
      createdBy: req.user.id
    });
    
    await logAudit({
      action: 'CREATE',
      performedBy: req.user.id,
      targetResource: 'Role',
      resourceId: role._id,
      details: { name: role.name, permissions: role.permissions },
      req
    });
    
    res.status(201).json({ success: true, role });
  } catch (err) {
    throw err;
  }
});

// @route  PUT /api/roles/:id
// @desc   Update a role
router.put('/:id', hasPermission(PERMISSIONS.MANAGE_ROLES), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    
    // Prevent changing system roles parent or name
    if (role.isSystem) {
      if (req.body.name && req.body.name !== role.name) {
        return res.status(400).json({ success: false, message: 'Cannot change name of system role' });
      }
      if (req.body.parentRoleId && req.body.parentRoleId !== role.parentRoleId?.toString()) {
        return res.status(400).json({ success: false, message: 'Cannot change parent of system role' });
      }
    }

    const updatedRole = await Role.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    await logAudit({
      action: 'UPDATE',
      performedBy: req.user.id,
      targetResource: 'Role',
      resourceId: updatedRole._id,
      details: { changes: req.body },
      req
    });
    
    res.json({ success: true, role: updatedRole });
  } catch (err) {
    throw err;
  }
});

// @route  DELETE /api/roles/:id
// @desc   Delete a role
router.delete('/:id', hasPermission(PERMISSIONS.MANAGE_ROLES), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    
    if (role.isSystem) {
      return res.status(400).json({ success: false, message: 'Cannot delete system roles' });
    }
    
    // Check if users are assigned
    const usersCount = await User.countDocuments({ roleId: role._id });
    if (usersCount > 0) {
      return res.status(400).json({ success: false, message: `Cannot delete role. ${usersCount} users are currently assigned to it.` });
    }
    
    // Check if it has children
    const childrenCount = await Role.countDocuments({ parentRoleId: role._id });
    if (childrenCount > 0) {
      return res.status(400).json({ success: false, message: `Cannot delete role. It has ${childrenCount} child roles. Reassign them first.` });
    }

    await Role.deleteOne({ _id: role._id });
    
    await logAudit({
      action: 'DELETE',
      performedBy: req.user.id,
      targetResource: 'Role',
      resourceId: role._id,
      details: { name: role.name },
      req
    });

    res.json({ success: true, message: 'Role deleted' });
  } catch (err) {
    throw err;
  }
});

// @route  GET /api/roles/:id/permissions
// @desc   Get effective permissions for a role
router.get('/:id/permissions', async (req, res) => {
  try {
    // We already have a helper in auth.js, but let's just do it directly or reuse
    // For now, return its own permissions
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    
    res.json({ success: true, permissions: role.permissions });
  } catch (err) {
    throw err;
  }
});

// @route  POST /api/roles/reorder
router.post('/reorder', hasPermission(PERMISSIONS.MANAGE_ROLES), async (req, res) => {
  // To be implemented fully if drag and drop reordering is needed
  res.json({ success: true, message: 'Reorder stub' });
});

module.exports = router;
