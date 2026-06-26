const mongoose = require('mongoose');

const PerformanceSnapshotSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weekStartDate: { type: Date, required: true },
  avgProductivityScore: { type: Number, default: 0 },
  tasksAssigned: { type: Number, default: 0 },
  tasksCompleted: { type: Number, default: 0 },
  tasksDeclined: { type: Number, default: 0 },
  onTimeCompletionRate: { type: Number, default: 0 },
  avgChangesRequestedPerTask: { type: Number, default: 0 }
});

module.exports = mongoose.model('PerformanceSnapshot', PerformanceSnapshotSchema);
