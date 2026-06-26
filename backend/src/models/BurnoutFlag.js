const mongoose = require('mongoose');

const BurnoutFlagSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  triggeredAt: { type: Date, default: Date.now },
  reason: [{ type: String }],
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  acknowledged: { type: Boolean, default: false },
  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acknowledgedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('BurnoutFlag', BurnoutFlagSchema);
