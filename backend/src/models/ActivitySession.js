const mongoose = require('mongoose');

const ActivitySessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  type: { type: String, enum: ['active', 'idle', 'locked', 'sleeping', 'focus'], required: true },
  startTime: { type: Date, required: true, index: true },
  endTime: { type: Date },
  durationSeconds: { type: Number, default: 0 },
  appName: { type: String, default: null },
  windowTitle: { type: String, default: null },
  idleReason: { type: String, default: null },        // manager-visible annotation
  idleAnnotation: { type: String, default: null },    // employee's own explanation
  isFocusSession: { type: Boolean, default: false },
  date: { type: String, index: true },                // YYYY-MM-DD for quick daily queries
}, { timestamps: true });

ActivitySessionSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('ActivitySession', ActivitySessionSchema);
