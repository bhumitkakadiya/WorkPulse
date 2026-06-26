const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  status: { 
    type: String, 
    enum: ['todo', 'in_progress', 'blocked', 'in_review', 'done'],
    default: 'todo' 
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  dueDate: { type: Date, default: null },
  progressNotes: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  parentTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
