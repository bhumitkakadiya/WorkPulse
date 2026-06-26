const mongoose = require('mongoose');

const LeaveBalanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  year: { type: Number, required: true },
  balances: [{
    leaveTypeCode: { type: String, required: true },
    total: { type: Number, default: 0 },
    used: { type: Number, default: 0 },
    pending: { type: Number, default: 0 }
  }]
}, { timestamps: true });

module.exports = mongoose.model('LeaveBalance', LeaveBalanceSchema);
