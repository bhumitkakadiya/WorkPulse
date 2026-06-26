const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  deviceName: { type: String, required: true },
  platform: { type: String, enum: ['windows', 'macos', 'linux'], required: true },
  agentVersion: { type: String, default: '1.0.0' },
  isActive: { type: Boolean, default: true },
  lastHeartbeat: { type: Date, default: null },
  ipAddress: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Device', DeviceSchema);
