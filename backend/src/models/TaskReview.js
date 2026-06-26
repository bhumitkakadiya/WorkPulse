const mongoose = require('mongoose');

const TaskReviewSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  decision: { type: String, enum: ['approved', 'changes_requested'], required: true },
  feedback: { type: String, required: true }
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model('TaskReview', TaskReviewSchema);
