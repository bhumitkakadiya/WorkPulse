const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  type: { type: String, enum: ['direct', 'task_thread'], required: true },
  participantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  lastMessageAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', ConversationSchema);
