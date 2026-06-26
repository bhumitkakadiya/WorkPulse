const mongoose = require('mongoose');

const AppUsageLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  appName: { type: String, required: true },
  windowTitle: { type: String, default: '' },
  category: { type: String, enum: ['productive', 'neutral', 'distracting'], default: 'neutral' },
  durationSeconds: { type: Number, required: true },
  intervalStart: { type: Date, required: true },
  intervalEnd: { type: Date, required: true },
  date: { type: String, index: true },
}, { timestamps: true });

AppUsageLogSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('AppUsageLog', AppUsageLogSchema);
