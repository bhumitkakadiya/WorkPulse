const AuditLog = require('../models/AuditLog');

const logAudit = async ({
  action,
  performedBy,
  targetResource,
  resourceId,
  details,
  req // pass express request object to grab IP/UA
}) => {
  try {
    const ipAddress = req ? req.ip || req.connection.remoteAddress : null;
    const userAgent = req ? req.get('User-Agent') : null;

    await AuditLog.create({
      action,
      performedBy,
      targetResource,
      resourceId,
      details,
      ipAddress,
      userAgent
    });
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
};

module.exports = logAudit;
