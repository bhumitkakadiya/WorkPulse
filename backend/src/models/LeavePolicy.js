const mongoose = require('mongoose');

const LeavePolicySchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  leaveTypes: [{
    name: { type: String, required: true },
    code: { type: String, required: true },
    maxDaysPerYear: { type: Number, default: 0 },
    carryForwardAllowed: { type: Boolean, default: false },
    maxCarryForwardDays: { type: Number, default: 0 },
    requiresApproval: { type: Boolean, default: true },
    blackoutDates: [{ type: Date }]
  }]
}, { timestamps: true });

module.exports = mongoose.model('LeavePolicy', LeavePolicySchema);
