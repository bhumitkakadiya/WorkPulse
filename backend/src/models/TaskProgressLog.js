const mongoose = require('mongoose');

const TaskProgressLogSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  progressPercent: { type: Number, required: true },
  note: { type: String, default: null }
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model('TaskProgressLog', TaskProgressLogSchema);
