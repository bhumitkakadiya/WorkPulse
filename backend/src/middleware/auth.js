const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

// Helper to compute effective permissions
async function getEffectivePermissions(roleId) {
  if (!roleId) return [];
  const allRoles = await Role.find({});
  const permissions = new Set();
  
  // Find descendants
  const roleMap = new Map();
  allRoles.forEach(r => roleMap.set(r._id.toString(), r));
  
  const queue = [roleId.toString()];
  while (queue.length > 0) {
    const currentId = queue.shift();
    const role = roleMap.get(currentId);
    if (role) {
      (role.permissions || []).forEach(p => permissions.add(p));
      // Find children (roles whose parent is currentId)
      for (const [id, r] of roleMap.entries()) {
        if (r.parentRoleId && r.parentRoleId.toString() === currentId) {
          queue.push(id);
        }
      }
    }
  }
  return Array.from(permissions);
}

// Protect routes — require valid JWT
exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized, no token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ success: false, message: 'User not found' });
    
    // Resolve role and effective permissions
    if (req.user.roleId) {
      req.userRole = await Role.findById(req.user.roleId);
      req.effectivePermissions = await getEffectivePermissions(req.user.roleId);
    } else {
      req.userRole = null;
      req.effectivePermissions = [];
    }
    
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

// Legacy Role-based access control
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' does not have access to this resource`,
      });
    }
    next();
  };
};

// Permission-based access control
exports.hasPermission = (permissionKey) => {
  return (req, res, next) => {
    // Fallback for hardcoded admin during migration
    if (req.user.role === 'admin') return next();
    
    if (!req.effectivePermissions || !req.effectivePermissions.includes(permissionKey)) {
      return res.status(403).json({
        success: false,
        message: `Missing required permission: ${permissionKey}`
      });
    }
    next();
  };
};

exports.getEffectivePermissions = getEffectivePermissions;
